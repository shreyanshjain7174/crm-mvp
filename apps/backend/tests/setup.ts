import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console.log during tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Test database setup
let testDb: Pool;

beforeAll(async () => {
  // Create test database connection
  testDb = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'crm_test_db',
    user: process.env.DB_USER || 'crm_test_user',
    password: process.env.DB_PASSWORD || 'test_password',
  });

  // Ensure test database is clean
  await cleanDatabase();
});

afterAll(async () => {
  if (testDb) {
    await testDb.end();
  }
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});

async function cleanDatabase() {
  if (!testDb) return;
  
  try {
    // Delete in correct order to respect foreign key constraints
    await testDb.query('DELETE FROM interactions');
    await testDb.query('DELETE FROM messages');
    await testDb.query('DELETE FROM leads');
    await testDb.query('DELETE FROM users');
  } catch (error) {
    // Tables might not exist yet
    console.warn('Warning cleaning database:', error);
  }
}

export { testDb };