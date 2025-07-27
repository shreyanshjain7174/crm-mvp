import { Pool, PoolClient } from 'pg';
import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';

// Test database connection pool
let testPool: Pool | null = null;

export async function getTestPool(): Promise<Pool> {
  if (!testPool) {
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://crm_test_user:test_password@localhost:5433/crm_test_db',
      max: 5,
    });
  }
  return testPool;
}

export async function cleanDatabase(app?: FastifyInstance): Promise<void> {
  // Use app's database connection if provided, otherwise use test pool
  let client;
  let shouldRelease = false;
  
  if (app?.db) {
    client = await app.db.connect();
    shouldRelease = true;
  } else {
    const pool = await getTestPool();
    client = await pool.connect();
    shouldRelease = true;
  }
  
  try {
    // Disable foreign key checks
    await client.query('SET session_replication_role = replica;');
    
    // Get all table names
    const result = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    `);
    
    // Truncate all tables
    for (const row of result.rows) {
      await client.query(`TRUNCATE TABLE ${row.tablename} CASCADE`);
    }
    
    // Re-enable foreign key checks
    await client.query('SET session_replication_role = DEFAULT;');
  } finally {
    if (shouldRelease) {
      client.release();
    }
  }
}

export async function runMigrations(): Promise<void> {
  const pool = await getTestPool();
  const client = await pool.connect();
  
  try {
    // Run all migration files
    const migrationsDir = path.join(__dirname, '../../src/db/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
      }
    }
  } finally {
    client.release();
  }
}

export async function seedTestData(app: FastifyInstance): Promise<void> {
  const pool = await getTestPool();
  
  // Create test users
  const users = [
    { id: 'test-user-1', email: 'test1@example.com', name: 'Test User 1', company: 'Test Company 1' },
    { id: 'test-user-2', email: 'test2@example.com', name: 'Test User 2', company: 'Test Company 2' },
  ];
  
  for (const user of users) {
    await pool.query(
      'INSERT INTO users (id, email, name, company, password) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      [user.id, user.email, user.name, user.company, '$2a$10$mock_hashed_password']
    );
  }
  
  // Create test contacts
  const contacts = [
    { name: 'John Doe', email: 'john@example.com', phone: '+1234567890', status: 'ACTIVE' },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '+0987654321', status: 'ACTIVE' },
  ];
  
  for (const contact of contacts) {
    await pool.query(
      'INSERT INTO contacts (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5)',
      ['test-user-1', contact.name, contact.email, contact.phone, contact.status]
    );
  }
}

export async function closeTestPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}