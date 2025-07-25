import { FastifyInstance } from 'fastify';
import { createNotificationFromTemplate } from '../routes/notifications';

// Realistic sample data based on research
const INDIAN_NAMES = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Singh', 'Vikram Gupta',
  'Anita Verma', 'Rohit Agarwal', 'Kavita Jain', 'Suresh Reddy', 'Meera Rao',
  'Arjun Mehta', 'Pooja Malhotra', 'Deepak Shah', 'Neha Kapoor', 'Vivek Nair',
  'Rekha Iyer', 'Manoj Sinha', 'Shweta Mishra', 'Rahul Tiwari', 'Anjali Das',
  'Kiran Bose', 'Sanjay Joshi', 'Ritu Bansal', 'Ashok Pillai', 'Gayatri Menon'
];

const COMPANY_NAMES = [
  'Tech Innovations Pvt Ltd', 'Digital Solutions Inc', 'Smart Systems Corp',
  'NextGen Technologies', 'Cyber Solutions Ltd', 'Data Dynamics India',
  'Cloud Connect Services', 'AI Ventures Mumbai', 'BlockChain Bangalore',
  'IoT Solutions Delhi', 'Mobile First Technologies', 'E-Commerce Hub',
  'FinTech Innovations', 'HealthTech Solutions', 'EduTech Services',
  'AgriTech Solutions', 'RetailTech Systems', 'LogiTech Operations',
  'Manufacturing Plus', 'ConsultTech Services', 'StartUp Accelerator',
  'Growth Ventures', 'Scale Solutions', 'Prime Technologies', 'Elite Systems'
];

const POSITIONS = [
  'Software Engineer', 'Product Manager', 'Business Analyst', 'Sales Manager',
  'Marketing Director', 'Operations Head', 'CTO', 'CEO', 'VP Sales',
  'Technical Lead', 'Project Manager', 'UX Designer', 'Data Scientist',
  'DevOps Engineer', 'Quality Assurance', 'Customer Success Manager',
  'Business Development', 'Digital Marketing Manager', 'HR Director',
  'Finance Manager', 'Procurement Head', 'Supply Chain Manager'
];

const LEAD_SOURCES = [
  'Website', 'WhatsApp', 'LinkedIn', 'Cold Call', 'Referral', 'Google Ads',
  'Facebook Ads', 'Email Campaign', 'Trade Show', 'Webinar', 'Content Marketing',
  'SEO', 'Social Media', 'Partner Network', 'Direct Mail', 'Event Networking'
];

const TAGS = [
  'hot-lead', 'enterprise', 'startup', 'tech', 'healthcare', 'finance',
  'education', 'retail', 'manufacturing', 'logistics', 'consulting',
  'decision-maker', 'budget-approved', 'needs-nurturing', 'price-sensitive',
  'feature-focused', 'security-conscious', 'scalability-focused'
];

const BUSINESS_PROFILES = [
  'Growing startup looking for scalable CRM solutions to manage expanding customer base',
  'Established enterprise seeking to modernize legacy customer management systems',
  'SME focused on improving sales team efficiency and customer engagement',
  'Digital-first company requiring AI-powered automation and analytics',
  'Traditional business transitioning to digital customer relationship management',
  'Fast-growing company needing comprehensive lead management and pipeline tracking',
  'Service-based business looking for client communication and project management tools',
  'E-commerce platform requiring integrated customer support and sales tracking'
];

const MESSAGE_TEMPLATES = [
  'Hi, I\'m interested in your CRM solution. Can we schedule a demo?',
  'What are your pricing plans for a team of 20 users?',
  'Do you offer WhatsApp integration for customer communication?',
  'I need a solution that can handle both leads and existing customers',
  'Can your system integrate with our existing ERP software?',
  'We\'re looking for AI-powered sales automation features',
  'What kind of reporting and analytics do you provide?',
  'Do you have mobile apps for field sales teams?',
  'How does your system handle data security and compliance?',
  'Can we get a trial version to test with our team?'
];

// Generate phone numbers in Indian format
function generatePhoneNumber(): string {
  const prefixes = ['98', '99', '97', '96', '95', '94', '93', '92', '91', '90'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 90000000) + 10000000;
  return `+91-${prefix}${suffix}`;
}

// Generate email from name and company
function generateEmail(name: string, company: string): string {
  const firstName = name.split(' ')[0].toLowerCase();
  const lastName = name.split(' ')[1]?.toLowerCase() || '';
  const domain = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15) + '.com';
  
  const variations = [
    `${firstName}.${lastName}@${domain}`,
    `${firstName}@${domain}`,
    `${firstName}${lastName[0] || ''}@${domain}`
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
}

// Generate realistic timestamps
function generateTimestamp(daysAgo: number): Date {
  const now = new Date();
  const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  // Add some random hours/minutes
  timestamp.setHours(Math.floor(Math.random() * 24));
  timestamp.setMinutes(Math.floor(Math.random() * 60));
  return timestamp;
}

// Get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export class DataSeeder {
  constructor(private fastify: FastifyInstance) {}

  async seedAll(): Promise<void> {
    try {
      console.log('🌱 Starting data seeding...');
      
      // Get or create the test user for seeding data
      let userId = await this.getOrCreateTestUser();

      // Clear existing data
      await this.clearExistingData(userId);

      // Seed data in order of dependencies
      await this.seedContacts(userId);
      await this.seedLeads(userId);
      await this.seedMessages(userId);
      await this.seedNotifications(userId);
      await this.seedUserStats(userId);
      await this.seedAchievements(userId);

      console.log('🎉 Data seeding completed successfully!');
    } catch (error) {
      console.error('❌ Data seeding failed:', error);
      throw error;
    }
  }

  private async getOrCreateTestUser(): Promise<string> {
    // Check if test user exists
    const userResult = await this.fastify.db.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['test@example.com']
    );

    if (userResult.rows.length > 0) {
      return userResult.rows[0].id;
    }

    // Create test user
    console.log('📝 Creating test user for data seeding...');
    const result = await this.fastify.db.query(`
      INSERT INTO users (email, password, name, company, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      'test@example.com',
      '$2b$10$dummy.hash.for.test.user.only',
      'Test User',
      'Demo Company',
      new Date()
    ]);
    
    return result.rows[0].id;
  }

  private async clearExistingData(userId: string): Promise<void> {
    console.log('🧹 Clearing existing seed data...');
    
    const tables = [
      'user_notifications',
      'user_achievements', 
      'user_progress_stats',
      'user_stages',
      'messages',
      'interactions',
      'ai_suggestions',
      'leads',
      'contacts'
    ];

    for (const table of tables) {
      try {
        await this.fastify.db.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
      } catch (error) {
        // Some tables might not exist yet, that's OK
        console.warn(`Warning clearing ${table}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  private async seedContacts(userId: string): Promise<void> {
    console.log('👥 Seeding contacts...');
    
    const contactsToCreate = 25;

    for (let i = 0; i < contactsToCreate; i++) {
      const name = INDIAN_NAMES[i % INDIAN_NAMES.length];
      const company = COMPANY_NAMES[i % COMPANY_NAMES.length];
      const position = POSITIONS[i % POSITIONS.length];
      const source = LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)];
      const tags = getRandomItems(TAGS, Math.floor(Math.random() * 4) + 1);
      const status = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'BLOCKED'][Math.floor(Math.random() * 5)];
      
      await this.fastify.db.query(`
        INSERT INTO contacts (
          user_id, name, email, phone, company, position, source, 
          notes, tags, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      `, [
        userId, 
        name, 
        generateEmail(name, company),
        generatePhoneNumber(),
        company,
        position, 
        source, 
        `Contact from ${source}. ${Math.random() > 0.5 ? 'High potential for enterprise solution.' : 'Interested in SME package.'}`,
        JSON.stringify(tags),
        status, 
        generateTimestamp(Math.floor(Math.random() * 90))
      ]);
    }
  }

  private async seedLeads(userId: string): Promise<void> {
    console.log('🎯 Seeding leads...');
    
    const leadsToCreate = 40;
    
    for (let i = 0; i < leadsToCreate; i++) {
      const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
      const phone = generatePhoneNumber();
      const email = Math.random() > 0.3 ? generateEmail(name, COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)]) : null;
      const status = ['COLD', 'WARM', 'HOT', 'CONVERTED', 'LOST'][Math.floor(Math.random() * 5)];
      const source = LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)];
      const priority = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)];
      const aiScore = Math.random() > 0.7 ? Math.round((Math.random() * 8 + 1) * 100) / 100 : null;
      const businessProfile = BUSINESS_PROFILES[Math.floor(Math.random() * BUSINESS_PROFILES.length)];
      
      await this.fastify.db.query(`
        INSERT INTO leads (
          user_id, name, phone, email, status, source, priority, 
          ai_score, business_profile, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      `, [
        userId, name, phone, email, status, source, priority,
        aiScore, businessProfile, generateTimestamp(Math.floor(Math.random() * 60))
      ]);
    }
  }

  private async seedMessages(userId: string): Promise<void> {
    console.log('💬 Seeding messages...');
    
    // Get leads to attach messages to
    const leadsResult = await this.fastify.db.query(
      'SELECT id FROM leads WHERE user_id = $1',
      [userId]
    );
    
    const leadIds = leadsResult.rows.map(row => row.id);
    const messagesToCreate = 120;
    
    for (let i = 0; i < messagesToCreate; i++) {
      const leadId = leadIds[Math.floor(Math.random() * leadIds.length)];
      const direction = Math.random() > 0.6 ? 'INCOMING' : 'OUTGOING';
      const messageType = ['TEXT', 'IMAGE', 'DOCUMENT'][Math.floor(Math.random() * 3)];
      const status = direction === 'INCOMING' ? 'RECEIVED' : ['SENT', 'DELIVERED', 'READ'][Math.floor(Math.random() * 3)];
      
      let content;
      if (direction === 'INCOMING') {
        content = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
      } else {
        content = `Thank you for your interest. I'll schedule a demo call with our team to discuss your requirements in detail.`;
      }
      
      await this.fastify.db.query(`
        INSERT INTO messages (
          lead_id, content, direction, message_type, status, 
          timestamp, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $6, $6)
      `, [
        leadId, content, direction, messageType, status,
        generateTimestamp(Math.floor(Math.random() * 30))
      ]);
    }
  }

  private async seedNotifications(userId: string): Promise<void> {
    console.log('🔔 Seeding notifications...');
    
    const notificationTypes = [
      {
        type: 'info',
        category: 'lead',
        title: 'New Lead Added',
        message: '{name} has been added as a new lead from {source}',
        priority: 'medium',
        actionRequired: true
      },
      {
        type: 'success',
        category: 'ai',
        title: 'AI Response Generated',
        message: 'AI has generated a response for {name}. Review and approve to send.',
        priority: 'low',
        actionRequired: true
      },
      {
        type: 'warning',
        category: 'pipeline',
        title: 'Lead Score Threshold Reached',
        message: '{name} has reached a lead score of {score}. Consider moving to qualified stage.',
        priority: 'high',
        actionRequired: true
      },
      {
        type: 'success',
        category: 'pipeline',
        title: 'Lead Converted',
        message: 'Congratulations! {name} has been successfully converted to a customer',
        priority: 'medium',
        actionRequired: false
      },
      {
        type: 'info',
        category: 'message',
        title: 'New WhatsApp Message',
        message: 'Received message from {name}: "{messageContent}"',
        priority: 'medium',
        actionRequired: true
      },
      {
        type: 'success',
        category: 'achievement',
        title: 'Achievement Unlocked',
        message: 'Congratulations! You have unlocked the "{achievementName}" achievement!',
        priority: 'low',
        actionRequired: false
      }
    ];

    const notificationsToCreate = 35;
    
    for (let i = 0; i < notificationsToCreate; i++) {
      const template = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
      const isRead = Math.random() > 0.4;
      const isStarred = Math.random() > 0.8;
      
      // Replace placeholders in message
      let message = template.message;
      message = message.replace('{name}', name);
      message = message.replace('{source}', LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)]);
      message = message.replace('{score}', String(Math.floor(Math.random() * 30) + 70));
      message = message.replace('{messageContent}', MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)]);
      message = message.replace('{achievementName}', 'Lead Master');
      
      await this.fastify.db.query(`
        INSERT INTO user_notifications (
          user_id, type, category, title, message, priority, 
          is_read, is_starred, action_required, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      `, [
        userId, template.type, template.category, template.title, message,
        template.priority, isRead, isStarred, template.actionRequired,
        generateTimestamp(Math.floor(Math.random() * 14))
      ]);
    }
  }

  private async seedUserStats(userId: string): Promise<void> {
    console.log('📊 Seeding user statistics...');
    
    const stats = {
      totalLeads: 40,
      totalContacts: 25,
      totalMessages: 120,
      aiResponsesUsed: 15,
      daysActive: 45,
      fastResponses: 8,
      leadsConverted: 6,
      pipelineUpdates: 32
    };

    for (const [statName, statValue] of Object.entries(stats)) {
      await this.fastify.db.query(`
        INSERT INTO user_progress_stats (user_id, stat_name, stat_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, stat_name)
        DO UPDATE SET stat_value = $3, updated_at = NOW()
      `, [userId, statName, statValue]);
    }

    // Set user stage based on stats
    await this.fastify.db.query(`
      INSERT INTO user_stages (user_id, current_stage, stage_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET current_stage = $2, stage_data = $3, updated_at = NOW()
    `, [userId, 3, JSON.stringify({ unlockedFeatures: ['contacts', 'pipeline', 'ai'] })]);
  }

  private async seedAchievements(userId: string): Promise<void> {
    console.log('🏆 Seeding achievements...');
    
    // Unlock some achievements based on the stats we created
    const achievementsToUnlock = [
      'first-lead',
      'first-contact', 
      'first-message',
      'lead-master-10',
      'contact-collector-25',
      'communicator-100',
      'ai-explorer',
      'daily-user'
    ];

    for (const achievementId of achievementsToUnlock) {
      // Get achievement definition
      const definitionResult = await this.fastify.db.query(`
        SELECT * FROM achievement_definitions WHERE achievement_id = $1
      `, [achievementId]);

      if (definitionResult.rows.length > 0) {
        const definition = definitionResult.rows[0];
        
        await this.fastify.db.query(`
          INSERT INTO user_achievements (
            user_id, achievement_id, achievement_name, achievement_description,
            achievement_category, achievement_rarity, points, unlocked_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id, achievement_id) DO NOTHING
        `, [
          userId, definition.achievement_id, definition.name, definition.description,
          definition.category, definition.rarity, definition.points,
          generateTimestamp(Math.floor(Math.random() * 30))
        ]);
      }
    }
  }
}

export async function initializeDataSeeding(fastify: FastifyInstance): Promise<void> {
  const seeder = new DataSeeder(fastify);
  await seeder.seedAll();
}