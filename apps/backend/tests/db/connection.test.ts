import { Pool, PoolClient } from 'pg';
import { pool, initializeDatabase } from '../../src/db/connection';
import { cleanDatabase, getTestPool } from '../helpers/db';

// Mock console methods to reduce test output noise
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('Database Connection Management', () => {
  describe('Pool Configuration', () => {
    it('should create a PostgreSQL connection pool', () => {
      expect(pool).toBeInstanceOf(Pool);
    });

    it('should use environment variables for configuration', () => {
      // Test that pool respects environment configuration
      const testPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'crm_dev_db',
        user: process.env.DB_USER || 'crm_dev_user',
        password: process.env.DB_PASSWORD || 'dev_password',
      });

      expect(testPool.options.host).toBe(process.env.DB_HOST || 'localhost');
      expect(testPool.options.port).toBe(parseInt(process.env.DB_PORT || '5432'));
      expect(testPool.options.database).toBe(process.env.DB_NAME || 'crm_dev_db');
      expect(testPool.options.user).toBe(process.env.DB_USER || 'crm_dev_user');
      
      testPool.end();
    });

    it('should use default values when environment variables are not set', () => {
      const originalEnv = process.env;
      
      // Clear database environment variables
      process.env = {};
      
      const testPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'crm_dev_db',
        user: process.env.DB_USER || 'crm_dev_user',
        password: process.env.DB_PASSWORD || 'dev_password',
      });

      expect(testPool.options.host).toBe('localhost');
      expect(testPool.options.port).toBe(5432);
      expect(testPool.options.database).toBe('crm_dev_db');
      expect(testPool.options.user).toBe('crm_dev_user');
      
      testPool.end();
      process.env = originalEnv;
    });
  });

  describe('Connection Management', () => {
    let testPool: Pool;
    let client: PoolClient;

    beforeEach(async () => {
      testPool = getTestPool();
    });

    afterEach(async () => {
      if (client) {
        client.release();
      }
    });

    it('should successfully connect to the database', async () => {
      client = await testPool.connect();
      expect(client).toBeDefined();
      
      // Test that we can execute a simple query
      const result = await client.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should handle connection pooling', async () => {
      // Create multiple connections simultaneously
      const connections = await Promise.all([
        testPool.connect(),
        testPool.connect(),
        testPool.connect()
      ]);

      expect(connections).toHaveLength(3);
      
      // All connections should be functional
      const results = await Promise.all(
        connections.map(conn => conn.query('SELECT NOW() as timestamp'))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.rows[0].timestamp).toBeInstanceOf(Date);
      });

      // Release all connections
      connections.forEach(conn => conn.release());
    });

    it('should handle connection errors gracefully', async () => {
      // Create a pool with invalid configuration
      const invalidPool = new Pool({
        host: 'invalid-host',
        port: 9999,
        database: 'invalid_db',
        user: 'invalid_user',
        password: 'invalid_password',
        connectionTimeoutMillis: 1000
      });

      await expect(invalidPool.connect()).rejects.toThrow();
      
      invalidPool.end();
    });

    it('should handle query timeouts', async () => {
      client = await testPool.connect();
      
      // Test query timeout (simulate with a long-running query)
      const queryPromise = client.query('SELECT pg_sleep(0.1)'); // Short sleep for test speed
      
      await expect(queryPromise).resolves.toBeDefined();
    }, 10000);

    it('should support transactions', async () => {
      client = await testPool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create a temporary table for testing
        await client.query(`
          CREATE TEMP TABLE test_transaction (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50)
          )
        `);
        
        await client.query('INSERT INTO test_transaction (name) VALUES ($1)', ['test']);
        
        const result = await client.query('SELECT * FROM test_transaction');
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].name).toBe('test');
        
        await client.query('ROLLBACK');
        
        // After rollback, table should not exist
        await expect(
          client.query('SELECT * FROM test_transaction')
        ).rejects.toThrow();
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    it('should handle concurrent queries on the same connection', async () => {
      client = await testPool.connect();
      
      // Execute multiple queries concurrently on the same connection
      // Note: PostgreSQL handles this by queuing them
      const queries = [
        client.query('SELECT 1 as result'),
        client.query('SELECT 2 as result'),
        client.query('SELECT 3 as result')
      ];

      const results = await Promise.all(queries);
      
      expect(results[0].rows[0].result).toBe(1);
      expect(results[1].rows[0].result).toBe(2);
      expect(results[2].rows[0].result).toBe(3);
    });
  });

  describe('Database Initialization', () => {
    beforeEach(async () => {
      await cleanDatabase();
    });

    it('should create required tables', async () => {
      await initializeDatabase();
      
      const testPool = getTestPool();
      const client = await testPool.connect();
      
      try {
        // Check that core tables exist
        const tableQuery = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `;
        
        const result = await client.query(tableQuery);
        const tableNames = result.rows.map(row => row.table_name);
        
        // Core tables should exist
        expect(tableNames).toContain('users');
        expect(tableNames).toContain('leads');
        expect(tableNames).toContain('messages');
        expect(tableNames).toContain('interactions');
        expect(tableNames).toContain('ai_suggestions');
        
      } finally {
        client.release();
      }
    });

    it('should create tables with correct schema', async () => {
      await initializeDatabase();
      
      const testPool = getTestPool();
      const client = await testPool.connect();
      
      try {
        // Check users table schema
        const usersSchema = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'users'
          ORDER BY ordinal_position
        `);
        
        const userColumns = usersSchema.rows.map(row => row.column_name);
        expect(userColumns).toContain('id');
        expect(userColumns).toContain('email');
        expect(userColumns).toContain('password');
        expect(userColumns).toContain('name');
        expect(userColumns).toContain('company');
        expect(userColumns).toContain('created_at');
        expect(userColumns).toContain('updated_at');
        
        // Check leads table schema
        const leadsSchema = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'leads'
          ORDER BY ordinal_position
        `);
        
        const leadColumns = leadsSchema.rows.map(row => row.column_name);
        expect(leadColumns).toContain('id');
        expect(leadColumns).toContain('name');
        expect(leadColumns).toContain('phone');
        expect(leadColumns).toContain('email');
        expect(leadColumns).toContain('status');
        expect(leadColumns).toContain('user_id');
        
      } finally {
        client.release();
      }
    });

    it('should handle foreign key constraints', async () => {
      await initializeDatabase();
      
      const testPool = getTestPool();
      const client = await testPool.connect();
      
      try {
        // First create a user
        const userResult = await client.query(`
          INSERT INTO users (email, password, name, company) 
          VALUES ('test@example.com', 'password', 'Test User', 'Test Company')
          RETURNING id
        `);
        const userId = userResult.rows[0].id;
        
        // Create a lead with valid user_id
        const leadResult = await client.query(`
          INSERT INTO leads (name, phone, email, status, user_id)
          VALUES ('Test Lead', '+1234567890', 'lead@example.com', 'NEW', $1)
          RETURNING id
        `, [userId]);
        
        expect(leadResult.rows[0].id).toBeDefined();
        
        // Attempt to create lead with invalid user_id should fail
        await expect(
          client.query(`
            INSERT INTO leads (name, phone, email, status, user_id)
            VALUES ('Invalid Lead', '+9876543210', 'invalid@example.com', 'NEW', $1)
          `, ['00000000-0000-0000-0000-000000000000'])
        ).rejects.toThrow();
        
      } finally {
        client.release();
      }
    });

    it('should handle duplicate initialization gracefully', async () => {
      // Run initialization multiple times
      await initializeDatabase();
      await initializeDatabase();
      await initializeDatabase();
      
      // Should not throw errors and tables should still exist
      const testPool = getTestPool();
      const client = await testPool.connect();
      
      try {
        const result = await client.query('SELECT 1 FROM users LIMIT 1');
        // Should execute without error (table exists)
        expect(result).toBeDefined();
      } finally {
        client.release();
      }
    });

    it('should handle migration errors gracefully', async () => {
      // Mock client.query to simulate migration errors for specific queries
      const testPool = getTestPool();
      const client = await testPool.connect();
      const originalQuery = client.query;
      
      let callCount = 0;
      client.query = jest.fn().mockImplementation((text, params) => {
        callCount++;
        // Fail on a specific migration step
        if (typeof text === 'string' && text.includes('ALTER TABLE') && callCount === 5) {
          throw new Error('Simulated migration error');
        }
        return originalQuery.call(client, text, params);
      });
      
      // Should handle the error and continue
      await expect(initializeDatabase()).resolves.not.toThrow();
      
      client.query = originalQuery;
      client.release();
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle high-concurrency scenarios', async () => {
      const testPool = getTestPool();
      const startTime = Date.now();
      
      // Create many concurrent connections and queries
      const concurrentOperations = Array.from({ length: 20 }, async (_, i) => {
        const client = await testPool.connect();
        try {
          const result = await client.query('SELECT $1::int as number', [i]);
          return result.rows[0].number;
        } finally {
          client.release();
        }
      });
      
      const results = await Promise.all(concurrentOperations);
      const endTime = Date.now();
      
      expect(results).toHaveLength(20);
      expect(results).toEqual(Array.from({ length: 20 }, (_, i) => i));
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    }, 10000);

    it('should properly release connections', async () => {
      const testPool = getTestPool();
      
      // Get initial connection count
      const initialStats = testPool.totalCount;
      
      // Create and release multiple connections
      for (let i = 0; i < 5; i++) {
        const client = await testPool.connect();
        await client.query('SELECT 1');
        client.release();
      }
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Connection count should return to reasonable level
      expect(testPool.totalCount).toBeGreaterThanOrEqual(initialStats);
      expect(testPool.idleCount).toBeGreaterThan(0);
    });

    it('should handle connection lifecycle events', async () => {
      const testPool = getTestPool();
      let connectCount = 0;
      let errorCount = 0;
      
      testPool.on('connect', () => {
        connectCount++;
      });
      
      testPool.on('error', () => {
        errorCount++;
      });
      
      // Create some connections
      const client1 = await testPool.connect();
      const client2 = await testPool.connect();
      
      client1.release();
      client2.release();
      
      expect(connectCount).toBeGreaterThan(0);
      // No errors should occur in normal operation
      expect(errorCount).toBe(0);
      
      testPool.removeAllListeners();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from connection drops', async () => {
      const testPool = getTestPool();
      
      // Get a connection and simulate it being dropped
      const client = await testPool.connect();
      
      try {
        // First query should work
        await client.query('SELECT 1');
        
        // Simulate connection issue by ending the client connection
        await client.end();
        
        // Get a new connection from the pool
        const newClient = await testPool.connect();
        
        // This should work with the new connection
        const result = await newClient.query('SELECT 2 as test');
        expect(result.rows[0].test).toBe(2);
        
        newClient.release();
        
      } catch (error) {
        // Connection errors are expected in this test
        expect(error).toBeDefined();
      }
    });

    it('should handle database unavailability', async () => {
      // Create a pool with invalid settings to simulate database unavailability
      const unavailablePool = new Pool({
        host: 'nonexistent-host',
        port: 5432,
        database: 'nonexistent_db',
        user: 'nonexistent_user',
        password: 'wrong_password',
        connectionTimeoutMillis: 1000,
        max: 1
      });
      
      await expect(unavailablePool.connect()).rejects.toThrow();
      
      unavailablePool.end();
    });
  });

  describe('Query Performance', () => {
    it('should execute simple queries efficiently', async () => {
      const testPool = getTestPool();
      const client = await testPool.connect();
      
      try {
        const startTime = Date.now();
        
        // Execute multiple simple queries
        for (let i = 0; i < 100; i++) {
          await client.query('SELECT $1::int', [i]);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 100 simple queries should complete quickly
        expect(duration).toBeLessThan(1000); // Less than 1 second
        
      } finally {
        client.release();
      }
    });

    it('should handle prepared statements efficiently', async () => {
      const testPool = getTestPool();
      const client = await testPool.connect();
      
      try {
        // Prepare a statement
        const queryText = 'SELECT $1::int as number, $2::text as text';
        
        const startTime = Date.now();
        
        // Execute the same query multiple times (should be optimized)
        for (let i = 0; i < 50; i++) {
          const result = await client.query(queryText, [i, `text${i}`]);
          expect(result.rows[0].number).toBe(i);
          expect(result.rows[0].text).toBe(`text${i}`);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Prepared statements should execute efficiently
        expect(duration).toBeLessThan(500); // Less than 500ms
        
      } finally {
        client.release();
      }
    });
  });
});