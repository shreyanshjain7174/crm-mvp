import { logger } from '../utils/logger';
import { FastifyInstance } from 'fastify';

/**
 * Seeds the marketplace with sample agent data
 */
export async function seedMarketplaceData(app: FastifyInstance) {
  try {
    logger.info('Starting marketplace data seeding...');

    // Check if agent_registry table exists and has data
    const existingAgents = await app.db.query(`
      SELECT COUNT(*) as count FROM agent_registry 
      WHERE created_at > NOW() - INTERVAL '1 day'
    `);
    
    const agentCount = parseInt(existingAgents.rows[0]?.count || '0');
    
    if (agentCount > 0) {
      logger.info(`Marketplace already has ${agentCount} recent agents, skipping seeding`);
      return;
    }

    // Sample marketplace agents
    const sampleAgents = [
      {
        agent_id: 'whatsapp-auto-responder-v2',
        name: 'WhatsApp Auto Responder Pro',
        version: '2.1.0',
        description: 'Advanced WhatsApp automation with AI-powered responses and lead qualification',
        full_description: 'Transform your WhatsApp business communication with intelligent automation. This agent handles customer inquiries, qualifies leads, books appointments, and provides 24/7 customer support with natural language processing.',
        category: 'whatsapp',
        provider_name: 'CRM Automation Solutions',
        provider_website: 'https://crmautomation.in',
        provider_verified: true,
        verified: true,
        featured: true,
        featured_order: 1,
        capabilities: ['auto-response', 'lead-qualification', 'appointment-booking', 'multilingual'],
        tags: ['whatsapp', 'automation', 'ai', 'leads', 'support'],
        pricing_model: 'freemium',
        price: 999.00,
        currency: 'INR',
        free_trial_days: 14,
        status: 'active'
      },
      {
        agent_id: 'ai-lead-scoring-engine',
        name: 'AI Lead Scoring Engine',
        version: '1.8.0',
        description: 'Intelligent lead scoring based on behavior, engagement, and demographic data',
        full_description: 'Boost your sales efficiency with advanced AI lead scoring. Automatically prioritize leads based on conversion probability, engagement patterns, and behavioral signals to focus your team on high-value prospects.',
        category: 'data',
        provider_name: 'DataCRM Analytics',
        provider_website: 'https://datacrm.ai',
        provider_verified: true,
        verified: true,
        featured: true,
        featured_order: 2,
        capabilities: ['lead-scoring', 'predictive-analytics', 'behavior-analysis', 'integration-apis'],
        tags: ['analytics', 'scoring', 'ai', 'predictions', 'sales'],
        pricing_model: 'subscription',
        price: 1499.00,
        currency: 'INR',
        free_trial_days: 7,
        status: 'active'
      },
      {
        agent_id: 'voice-call-assistant',
        name: 'AI Voice Call Assistant',
        version: '3.0.2',
        description: 'Human-like voice AI for inbound and outbound call handling',
        full_description: 'Revolutionize your phone operations with AI voice technology. Handle customer calls, conduct surveys, book appointments, and provide support with natural voice interactions in Hindi and English.',
        category: 'voice',
        provider_name: 'VoiceAI India',
        provider_website: 'https://voiceai.in',
        provider_verified: true,
        verified: true,
        featured: false,
        capabilities: ['voice-calls', 'multilingual', 'call-routing', 'appointment-booking'],
        tags: ['voice', 'calls', 'ai', 'hindi', 'english'],
        pricing_model: 'usage',
        price: 2.50,
        currency: 'INR',
        status: 'active'
      },
      {
        agent_id: 'social-media-monitor',
        name: 'Social Media Monitor',
        version: '1.5.1',
        description: 'Track mentions, engage with customers, and manage social presence',
        full_description: 'Monitor your brand across social platforms, automatically respond to mentions, track sentiment, and engage with customers. Supports Instagram, Facebook, Twitter, and LinkedIn.',
        category: 'automation',
        provider_name: 'SocialCRM Tools',
        provider_verified: false,
        verified: false,
        featured: false,
        capabilities: ['social-monitoring', 'auto-engagement', 'sentiment-analysis', 'reporting'],
        tags: ['social', 'monitoring', 'engagement', 'sentiment'],
        pricing_model: 'freemium',
        price: 799.00,
        currency: 'INR',
        free_trial_days: 30,
        status: 'active'
      },
      {
        agent_id: 'email-campaign-optimizer',
        name: 'Email Campaign Optimizer',
        version: '2.3.0',
        description: 'AI-powered email marketing with personalization and optimization',
        full_description: 'Maximize email marketing ROI with AI-driven personalization, optimal send times, subject line optimization, and automated follow-up sequences.',
        category: 'automation',
        provider_name: 'EmailAI Solutions',
        provider_website: 'https://emailai.co.in',
        provider_verified: true,
        verified: true,
        featured: false,
        capabilities: ['email-optimization', 'personalization', 'a-b-testing', 'automation'],
        tags: ['email', 'marketing', 'optimization', 'automation'],
        pricing_model: 'subscription',
        price: 1299.00,
        currency: 'INR',
        free_trial_days: 14,
        status: 'active'
      },
      {
        agent_id: 'customer-support-bot',
        name: 'Intelligent Support Bot',
        version: '4.1.0',
        description: '24/7 AI customer support with ticket routing and escalation',
        full_description: 'Provide round-the-clock customer support with intelligent chatbot technology. Handles common queries, routes complex issues, and seamlessly escalates to human agents when needed.',
        category: 'support',
        provider_name: 'SupportAI Technologies',
        provider_website: 'https://supportai.tech',
        provider_verified: true,
        verified: true,
        featured: true,
        featured_order: 3,
        capabilities: ['chatbot', 'ticket-routing', 'escalation', 'knowledge-base'],
        tags: ['support', 'chatbot', 'tickets', 'automation'],
        pricing_model: 'freemium',
        price: 899.00,
        currency: 'INR',
        free_trial_days: 21,
        status: 'active'
      },
      {
        agent_id: 'lead-enrichment-pro',
        name: 'Lead Enrichment Pro',
        version: '1.9.3',
        description: 'Automatically enrich lead data with social, professional, and company information',
        full_description: 'Enhance your lead database with comprehensive data enrichment. Automatically gather social profiles, company information, job titles, and contact details to improve sales outcomes.',
        category: 'lead-gen',
        provider_name: 'DataEnrich India',
        provider_verified: true,
        verified: false,
        featured: false,
        capabilities: ['data-enrichment', 'social-profiles', 'company-data', 'contact-discovery'],
        tags: ['enrichment', 'data', 'leads', 'profiles'],
        pricing_model: 'usage',
        price: 5.00,
        currency: 'INR',
        status: 'active'
      },
      {
        agent_id: 'appointment-scheduler-ai',
        name: 'AI Appointment Scheduler',
        version: '2.0.1',
        description: 'Smart appointment booking with calendar integration and reminders',
        full_description: 'Streamline appointment booking with intelligent scheduling AI. Integrates with Google Calendar, sends automated reminders, handles rescheduling, and optimizes meeting slots.',
        category: 'automation',
        provider_name: 'ScheduleAI Systems',
        provider_website: 'https://scheduleai.in',
        provider_verified: true,
        verified: true,
        featured: false,
        capabilities: ['scheduling', 'calendar-sync', 'reminders', 'optimization'],
        tags: ['appointments', 'calendar', 'scheduling', 'automation'],
        pricing_model: 'subscription',
        price: 699.00,
        currency: 'INR',
        free_trial_days: 10,
        status: 'active'
      }
    ];

    // Insert agents
    for (const agent of sampleAgents) {
      try {
        await app.db.query(`
          INSERT INTO agent_registry (
            agent_id, name, version, description, full_description, category,
            provider_name, provider_website, provider_verified, verified,
            featured, featured_order, capabilities, tags, pricing_model,
            price, currency, free_trial_days, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
          ) ON CONFLICT (agent_id) DO UPDATE SET
            name = EXCLUDED.name,
            version = EXCLUDED.version,
            description = EXCLUDED.description,
            updated_at = NOW()
        `, [
          agent.agent_id, agent.name, agent.version, agent.description,
          agent.full_description, agent.category, agent.provider_name,
          agent.provider_website, agent.provider_verified, agent.verified,
          agent.featured, agent.featured_order, JSON.stringify(agent.capabilities),
          JSON.stringify(agent.tags), agent.pricing_model, agent.price,
          agent.currency, agent.free_trial_days, agent.status
        ]);
        
        logger.debug(`Seeded agent: ${agent.name}`);
      } catch (error) {
        logger.error(`Failed to seed agent ${agent.name}:`, error);
      }
    }

    // Add sample installed agents (to show install counts)
    const sampleInstallations = [
      { agent_id: 'whatsapp-auto-responder-v2', installs: 1250 },
      { agent_id: 'ai-lead-scoring-engine', installs: 890 },
      { agent_id: 'customer-support-bot', installs: 2100 },
      { agent_id: 'voice-call-assistant', installs: 456 },
      { agent_id: 'email-campaign-optimizer', installs: 720 },
      { agent_id: 'appointment-scheduler-ai', installs: 340 }
    ];

    // Create dummy user IDs for installations
    for (const install of sampleInstallations) {
      const installCount = install.installs;
      // Create a batch insert for better performance
      const batchSize = 50;
      const batches = Math.ceil(installCount / batchSize);
      
      for (let batch = 0; batch < Math.min(batches, 10); batch++) { // Limit to 10 batches for demo
        const currentBatchSize = Math.min(batchSize, installCount - (batch * batchSize));
        const values = Array.from({ length: currentBatchSize }, (_) => 
          `('${install.agent_id}', gen_random_uuid(), gen_random_uuid(), 'active', NOW())`
        ).join(', ');
        
        try {
          await app.db.query(`
            INSERT INTO installed_agents (agent_id, user_id, business_id, status, installed_at)
            VALUES ${values}
            ON CONFLICT DO NOTHING
          `);
        } catch (error) {
          // Ignore conflicts for demo data
        }
      }
    }

    // Add sample reviews
    const sampleReviews = [
      {
        agent_id: 'whatsapp-auto-responder-v2',
        rating: 5,
        title: 'Game Changer for Our Business',
        comment: 'This agent has transformed how we handle WhatsApp inquiries. Response time improved by 90% and customer satisfaction is through the roof!'
      },
      {
        agent_id: 'whatsapp-auto-responder-v2',
        rating: 4,
        title: 'Great functionality, minor setup issues',
        comment: 'Works perfectly once configured. The AI responses are surprisingly natural. Setup took some time but support was helpful.'
      },
      {
        agent_id: 'ai-lead-scoring-engine',
        rating: 5,
        title: 'Incredible accuracy in lead scoring',
        comment: 'Our conversion rate increased by 40% after implementing this. The AI accurately identifies high-potential leads.'
      },
      {
        agent_id: 'customer-support-bot',
        rating: 5,
        title: 'Best customer support automation',
        comment: '24/7 support coverage without hiring additional staff. Handles 80% of queries automatically.'
      }
    ];

    for (const review of sampleReviews) {
      try {
        await app.db.query(`
          INSERT INTO agent_reviews (
            agent_id, user_id, business_id, rating, title, comment, 
            verified_purchase, created_at
          ) VALUES (
            $1, gen_random_uuid(), gen_random_uuid(), $2, $3, $4, true, NOW()
          ) ON CONFLICT DO NOTHING
        `, [review.agent_id, review.rating, review.title, review.comment]);
      } catch (error) {
        // Ignore conflicts for demo data
      }
    }

    logger.info(`Successfully seeded marketplace with ${sampleAgents.length} agents`);
  } catch (error) {
    logger.error('Failed to seed marketplace data:', error);
  }
}