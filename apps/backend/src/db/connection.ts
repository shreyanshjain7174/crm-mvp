import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'crm_dev_db',
  user: process.env.DB_USER || 'crm_dev_user',
  password: process.env.DB_PASSWORD || 'dev_password',
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
        lead_id UUID NOT NULL,
        content TEXT NOT NULL,
        direction VARCHAR(50) NOT NULL,
        message_type VARCHAR(50) DEFAULT 'TEXT',
        status VARCHAR(50) DEFAULT 'SENT',
        whatsapp_id VARCHAR(255),
        error_message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    // Create interactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        outcome TEXT,
        scheduled_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    // Add migration logic for existing tables
    try {
      // Migrate messages table to snake_case columns
      await client.query(`
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS error_message TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'TEXT',
        ADD COLUMN IF NOT EXISTS whatsapp_id VARCHAR(255)
      `);

      // Migrate interactions table to snake_case columns  
      await client.query(`
        ALTER TABLE interactions 
        ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
      `);

      // Try to rename columns if they exist with old camelCase names
      try {
        await client.query(`ALTER TABLE messages RENAME COLUMN "leadId" TO lead_id`);
      } catch (e) {
        // Column may not exist or already renamed
      }
      
      try {
        await client.query(`ALTER TABLE messages RENAME COLUMN "messageType" TO message_type`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE messages RENAME COLUMN "whatsappId" TO whatsapp_id`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE messages RENAME COLUMN "errorMessage" TO error_message`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE messages RENAME COLUMN "createdAt" TO created_at`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE messages RENAME COLUMN "updatedAt" TO updated_at`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE interactions RENAME COLUMN "leadId" TO lead_id`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE interactions RENAME COLUMN "scheduledAt" TO scheduled_at`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE interactions RENAME COLUMN "completedAt" TO completed_at`);
      } catch (e) {
        // Column may not exist or already renamed
      }

      try {
        await client.query(`ALTER TABLE interactions RENAME COLUMN "createdAt" TO created_at`);
      } catch (e) {
        // Column may not exist or already renamed
      }
      
      console.log('Database migrations applied successfully');
    } catch (migrationError) {
      console.warn('Migration warning (may be expected):', migrationError instanceof Error ? migrationError.message : String(migrationError));
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}