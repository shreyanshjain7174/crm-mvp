#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const DB_CONFIG = {
  user: process.env.POSTGRES_USER || 'crm_dev_user',
  password: process.env.POSTGRES_PASSWORD || 'dev_password',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_dev_db',
};

async function seedDemoData() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if demo user already exists
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', ['admin@demo.com']);
    
    if (userCheck.rows.length > 0) {
      console.log('Demo user already exists');
      return;
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const userResult = await client.query(`
      INSERT INTO users (email, password, name, company, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, NOW(), NOW()) 
      RETURNING id, email, name, company
    `, ['admin@demo.com', hashedPassword, 'Demo Admin', 'Demo Company']);
    
    const user = userResult.rows[0];
    console.log('Created demo user:', user);

    // Create some demo leads
    const leads = [
      {
        name: 'John Smith',
        phone: '+911234567890',
        email: 'john@example.com',
        status: 'WARM',
        priority: 'HIGH',
        source: 'Website',
        businessProfile: 'Small business owner looking for CRM solution'
      },
      {
        name: 'Sarah Johnson',
        phone: '+919876543210',
        email: 'sarah@company.com',
        status: 'HOT',
        priority: 'URGENT',
        source: 'Referral',
        businessProfile: 'Enterprise client evaluating CRM platforms'
      },
      {
        name: 'Mike Wilson',
        phone: '+911122334455',
        email: 'mike@startup.io',
        status: 'COLD',
        priority: 'MEDIUM',
        source: 'Social Media',
        businessProfile: 'Startup founder interested in automation'
      }
    ];

    for (const lead of leads) {
      const leadResult = await client.query(`
        INSERT INTO leads (name, phone, email, status, priority, source, business_profile, assigned_to, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
        RETURNING id, name, status
      `, [lead.name, lead.phone, lead.email, lead.status, lead.priority, lead.source, lead.businessProfile, user.id]);
      
      console.log('Created demo lead:', leadResult.rows[0]);
    }

    console.log('✅ Demo data seeded successfully!');
    console.log('');
    console.log('Demo Login Credentials:');
    console.log('Email: admin@demo.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };