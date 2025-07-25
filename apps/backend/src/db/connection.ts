import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

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

    // Create ai_suggestions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        context TEXT,
        confidence DECIMAL(3,2),
        approved BOOLEAN DEFAULT FALSE,
        executed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        executed_at TIMESTAMP,
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

    // Apply new monitoring and billing migrations
    try {
      await runAgentMigrations(client);
      await runBillingMigrations(client);
      await runMonitoringMigrations(client);
      await runIntegrationsMigrations(client);
      await runContactsMigrations(client);
      await runAchievementsMigrations(client);
      await runNotificationsMigrations(client);
      console.log('Agent, billing, monitoring, integrations, contacts, achievements, and notifications migrations applied successfully');
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

// Agent system migrations
async function runAgentMigrations(client: any) {
  // Agent installations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_installations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id VARCHAR(100) NOT NULL,
      agent_id VARCHAR(100) NOT NULL,
      agent_name VARCHAR(255) NOT NULL,
      agent_provider VARCHAR(100) NOT NULL,
      agent_version VARCHAR(50) NOT NULL,
      pricing_model VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (pricing_model IN ('free', 'subscription', 'usage', 'hybrid')),
      pricing_config JSONB DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
      installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(business_id, agent_id)
    )
  `);

  // Agent marketplace table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_marketplace (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      provider VARCHAR(100) NOT NULL,
      version VARCHAR(50) NOT NULL,
      pricing_model VARCHAR(20) NOT NULL DEFAULT 'free',
      pricing_config JSONB DEFAULT '{}',
      capabilities JSONB DEFAULT '[]',
      configuration_schema JSONB DEFAULT '{}',
      installation_count INTEGER DEFAULT 0,
      rating DECIMAL(3,2) DEFAULT 0.0,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Billing system migrations
async function runBillingMigrations(client: any) {
  // Agent usage events table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_usage_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id VARCHAR(100) NOT NULL,
      agent_id VARCHAR(100) NOT NULL,
      installation_id UUID NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      event_data JSONB DEFAULT '{}',
      usage_amount DECIMAL(12,4) NOT NULL DEFAULT 0,
      usage_unit VARCHAR(50) NOT NULL,
      cost_amount INTEGER DEFAULT 0, -- in smallest currency unit (paise)
      billing_period VARCHAR(20) NOT NULL, -- YYYY-MM-DD format
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Billing periods table
  await client.query(`
    CREATE TABLE IF NOT EXISTS billing_periods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id VARCHAR(100) NOT NULL,
      period_start TIMESTAMP WITH TIME ZONE NOT NULL,
      period_end TIMESTAMP WITH TIME ZONE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finalized', 'paid', 'overdue')),
      total_amount INTEGER DEFAULT 0, -- in smallest currency unit
      currency VARCHAR(3) DEFAULT 'INR',
      due_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agent usage quotas table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_usage_quotas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id VARCHAR(100) NOT NULL,
      agent_id VARCHAR(100) NOT NULL,
      installation_id UUID NOT NULL,
      quota_type VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (quota_type IN ('monthly', 'daily', 'lifetime')),
      usage_unit VARCHAR(50) NOT NULL,
      quota_limit DECIMAL(12,4) NOT NULL DEFAULT 0,
      quota_used DECIMAL(12,4) NOT NULL DEFAULT 0,
      quota_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      quota_period_end TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 month',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(business_id, agent_id, quota_type, usage_unit)
    )
  `);

  // Billing notifications table
  await client.query(`
    CREATE TABLE IF NOT EXISTS billing_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id VARCHAR(100) NOT NULL,
      agent_id VARCHAR(100),
      notification_type VARCHAR(100) NOT NULL,
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB DEFAULT '{}',
      sent BOOLEAN DEFAULT FALSE,
      sent_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Monitoring system migrations
async function runMonitoringMigrations(client: any) {
  // Agent health checks table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_health_checks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id VARCHAR(100) NOT NULL,
      connectivity VARCHAR(20) NOT NULL CHECK (connectivity IN ('pass', 'fail', 'warning')),
      authentication VARCHAR(20) NOT NULL CHECK (authentication IN ('pass', 'fail', 'warning')),
      dependencies VARCHAR(20) NOT NULL CHECK (dependencies IN ('pass', 'fail', 'warning')),
      performance VARCHAR(20) NOT NULL CHECK (performance IN ('pass', 'fail', 'warning')),
      details JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agent performance metrics table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_performance_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id VARCHAR(100) NOT NULL,
      business_id VARCHAR(100) NOT NULL,
      success_rate DECIMAL(5,2) DEFAULT 0,
      avg_response_time INTEGER DEFAULT 0, -- in milliseconds
      tasks_completed INTEGER DEFAULT 0,
      tasks_per_minute DECIMAL(8,2) DEFAULT 0,
      error_rate DECIMAL(5,2) DEFAULT 0,
      uptime DECIMAL(5,2) DEFAULT 0, -- percentage
      resource_usage JSONB DEFAULT '{}', -- CPU, memory, etc.
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agent task executions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_task_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id VARCHAR(100) NOT NULL,
      agent_id VARCHAR(100) NOT NULL,
      task_type VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
      start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP WITH TIME ZONE,
      duration INTEGER, -- in milliseconds
      input JSONB DEFAULT '{}',
      output JSONB DEFAULT '{}',
      error TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agent alerts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id VARCHAR(100) NOT NULL,
      agent_id VARCHAR(100) NOT NULL,
      alert_type VARCHAR(100) NOT NULL,
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      message TEXT NOT NULL,
      details JSONB DEFAULT '{}',
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_agent_health_checks_agent_id ON agent_health_checks(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_health_checks_created_at ON agent_health_checks(created_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent_id ON agent_performance_metrics(agent_id, business_id);
    CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_created_at ON agent_performance_metrics(created_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_agent_task_executions_agent_id ON agent_task_executions(agent_id, business_id);
    CREATE INDEX IF NOT EXISTS idx_agent_task_executions_status ON agent_task_executions(status);
    CREATE INDEX IF NOT EXISTS idx_agent_task_executions_start_time ON agent_task_executions(start_time DESC);
    
    CREATE INDEX IF NOT EXISTS idx_agent_alerts_business_id ON agent_alerts(business_id);
    CREATE INDEX IF NOT EXISTS idx_agent_alerts_agent_id ON agent_alerts(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_alerts_resolved ON agent_alerts(resolved);
    CREATE INDEX IF NOT EXISTS idx_agent_alerts_created_at ON agent_alerts(created_at DESC);
  `);
}

// Integrations system migrations
async function runIntegrationsMigrations(client: any) {
  // Apply the integrations migration SQL
  const integrationsMigrationPath = path.join(__dirname, 'migrations/013_integrations_schema.sql');
  const integrationsMigration = fs.readFileSync(integrationsMigrationPath, 'utf8');
  await client.query(integrationsMigration);
}

// Contacts system migrations
async function runContactsMigrations(client: any) {
  // Apply the contacts migration SQL
  const contactsMigrationPath = path.join(__dirname, 'migrations/015_contacts_schema.sql');
  const contactsMigration = fs.readFileSync(contactsMigrationPath, 'utf8');
  await client.query(contactsMigration);
}

// Achievements system migrations
async function runAchievementsMigrations(client: any) {
  // Apply the achievements migration SQL
  const achievementsMigrationPath = path.join(__dirname, 'migrations/016_achievements_schema.sql');
  const achievementsMigration = fs.readFileSync(achievementsMigrationPath, 'utf8');
  await client.query(achievementsMigration);
}

// Notifications system migrations
async function runNotificationsMigrations(client: any) {
  // Apply the notifications migration SQL
  const notificationsMigrationPath = path.join(__dirname, 'migrations/017_notifications_schema.sql');
  const notificationsMigration = fs.readFileSync(notificationsMigrationPath, 'utf8');
  await client.query(notificationsMigration);
}