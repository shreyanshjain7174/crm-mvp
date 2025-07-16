import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export { pool };

// Simple database initialization
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `);

    // Create leads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'COLD',
        source VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        assigned_to VARCHAR(255),
        ai_score DECIMAL(3,2),
        business_profile TEXT,
        user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        leadId UUID NOT NULL,
        content TEXT NOT NULL,
        direction VARCHAR(50) NOT NULL,
        messageType VARCHAR(50) DEFAULT 'TEXT',
        status VARCHAR(50) DEFAULT 'SENT',
        whatsappId VARCHAR(255),
        errorMessage TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    // Create interactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        leadId UUID NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        outcome TEXT,
        scheduledAt TIMESTAMP,
        completedAt TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    // Add migration logic for existing tables
    try {
      // Add errorMessage column to messages table if it doesn't exist
      await client.query(`
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS errorMessage TEXT
      `);
      
      // Add createdAt and updatedAt columns to messages table if they don't exist
      await client.query(`
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      
      console.log('Database migrations applied successfully');
    } catch (migrationError) {
      console.warn('Migration warning (may be expected):', migrationError.message);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}