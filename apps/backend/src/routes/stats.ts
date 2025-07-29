import { FastifyInstance } from 'fastify';
import { cacheMiddleware, cacheKeyGenerators } from '../middleware/cache-middleware';

export async function statsRoutes(fastify: FastifyInstance) {
  // Get dashboard statistics
  fastify.get('/dashboard', {
    preHandler: [
      cacheMiddleware({
        ttl: 180, // 3 minutes cache for dashboard stats
        keyGenerator: () => 'dashboard:stats'
      })
    ]
  }, async (request, reply) => {
    try {
      // Get total contacts count (using contacts table instead of leads)
      const contactsResult = await fastify.db.query('SELECT COUNT(*) as count FROM contacts');
      const totalLeads = parseInt(contactsResult.rows[0]?.count || '0');

      // Get active conversations (contacts with messages in last 30 days)
      // Since messages table might not exist or have different structure, we'll approximate this
      // by counting contacts that have been updated recently (indicating activity)
      const conversationsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE updated_at >= NOW() - INTERVAL '30 days'
      `);
      const activeConversations = parseInt(conversationsResult.rows[0]?.count || '0');

      // Calculate conversion rate (contacts with status 'ACTIVE' / total contacts)
      const convertedResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE status = 'ACTIVE'
      `);
      const convertedLeads = parseInt(convertedResult.rows[0]?.count || '0');
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

      // Get hot leads (active contacts - this is the closest analogy)
      const hotLeads = convertedLeads;

      // Get growth percentage (contacts added in last month vs previous month)
      const lastMonthResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);
      const lastMonthLeads = parseInt(lastMonthResult.rows[0]?.count || '0');

      const previousMonthResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE created_at >= NOW() - INTERVAL '60 days' 
        AND created_at < NOW() - INTERVAL '30 days'
      `);
      const previousMonthLeads = parseInt(previousMonthResult.rows[0]?.count || '0');
      
      const leadsGrowth = previousMonthLeads > 0 
        ? ((lastMonthLeads - previousMonthLeads) / previousMonthLeads * 100)
        : lastMonthLeads > 0 ? 100 : 0;

      // Get conversations growth (based on contact updates)
      const lastMonthConversationsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE updated_at >= NOW() - INTERVAL '30 days'
      `);
      const lastMonthConversations = parseInt(lastMonthConversationsResult.rows[0]?.count || '0');

      const previousMonthConversationsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE updated_at >= NOW() - INTERVAL '60 days' 
        AND updated_at < NOW() - INTERVAL '30 days'
      `);
      const previousMonthConversations = parseInt(previousMonthConversationsResult.rows[0]?.count || '0');
      
      const conversationsGrowth = previousMonthConversations > 0 
        ? ((lastMonthConversations - previousMonthConversations) / previousMonthConversations * 100)
        : lastMonthConversations > 0 ? 100 : 0;

      // Get hot leads growth (active contacts growth)
      const lastMonthHotLeadsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE status = 'ACTIVE' AND updated_at >= NOW() - INTERVAL '30 days'
      `);
      const lastMonthHotLeads = parseInt(lastMonthHotLeadsResult.rows[0]?.count || '0');

      const previousMonthHotLeadsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE status = 'ACTIVE' 
        AND updated_at >= NOW() - INTERVAL '60 days' 
        AND updated_at < NOW() - INTERVAL '30 days'
      `);
      const previousMonthHotLeads = parseInt(previousMonthHotLeadsResult.rows[0]?.count || '0');
      
      const hotLeadsGrowth = previousMonthHotLeads > 0 
        ? ((lastMonthHotLeads - previousMonthHotLeads) / previousMonthHotLeads * 100)
        : lastMonthHotLeads > 0 ? 100 : 0;

      return {
        totalLeads,
        activeConversations,
        conversionRate,
        hotLeads,
        growth: {
          leads: leadsGrowth,
          conversations: conversationsGrowth,
          hotLeads: hotLeadsGrowth,
          conversionRate: 0 // Will calculate later when we have historical data
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching dashboard stats:', error);
      reply.status(500).send({ error: 'Failed to fetch dashboard statistics' });
    }
  });

  // Get user progress statistics
  fastify.get('/user/progress', {
    preHandler: [
      cacheMiddleware({
        ttl: 300, // 5 minutes cache for user progress
        keyGenerator: () => 'user:progress:stats'
      })
    ]
  }, async (request, reply) => {
    try {
      // Get contact count
      const contactsResult = await fastify.db.query('SELECT COUNT(*) as count FROM contacts');
      const contactsAdded = parseInt(contactsResult.rows[0]?.count || '0');

      // Get messages sent count (approximation based on active contacts since messages table structure is unclear)
      const messagesResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM contacts 
        WHERE status = 'ACTIVE'
      `);
      const messagesSent = parseInt(messagesResult.rows[0]?.count || '0');

      // Get AI interactions count (this would be from AI suggestion approvals)
      // For now, we'll use a placeholder until AI system is fully implemented
      const aiInteractions = 0;

      // Get templates used count (placeholder for now)
      const templatesUsed = 0;

      // Get pipeline actions count (placeholder for now)
      const pipelineActions = 0;

      // Determine user stage based on activity
      let stage = 'new';
      if (contactsAdded >= 1) {
        stage = 'beginner';
      }
      if (contactsAdded >= 10 && messagesSent >= 5) {
        stage = 'intermediate';
      }
      if (messagesSent >= 5 && pipelineActions >= 10) {
        stage = 'advanced';
      }
      if (aiInteractions >= 25 && templatesUsed >= 10) {
        stage = 'expert';
      }

      // Calculate progress percentage based on current stage
      let progressPercentage = 0;
      switch (stage) {
        case 'new':
          progressPercentage = contactsAdded > 0 ? 20 : 0;
          break;
        case 'beginner':
          progressPercentage = 20 + (Math.min(messagesSent, 5) / 5 * 20);
          break;
        case 'intermediate':
          progressPercentage = 40 + (Math.min(contactsAdded - 10, 40) / 40 * 20);
          break;
        case 'advanced':
          progressPercentage = 60 + (Math.min(aiInteractions, 25) / 25 * 20);
          break;
        case 'expert':
          progressPercentage = 100;
          break;
      }

      return {
        stage,
        stats: {
          contactsAdded,
          messagesSent,
          aiInteractions,
          templatesUsed,
          pipelineActions
        },
        progressPercentage: Math.round(progressPercentage),
        nextStageRequirements: getNextStageRequirements(stage, {
          contactsAdded,
          messagesSent,
          aiInteractions,
          templatesUsed,
          pipelineActions
        })
      };
    } catch (error) {
      fastify.log.error('Error fetching user progress:', error);
      reply.status(500).send({ error: 'Failed to fetch user progress' });
    }
  });
}

function getNextStageRequirements(stage: string, stats: any): string[] {
  switch (stage) {
    case 'new':
      return ['Add your first contact to unlock messaging'];
    case 'beginner':
      return [
        `Add ${Math.max(0, 10 - stats.contactsAdded)} more contacts`,
        `Send ${Math.max(0, 5 - stats.messagesSent)} more messages`
      ].filter(req => !req.includes('0 more'));
    case 'intermediate':
      return [
        `Send ${Math.max(0, 5 - stats.messagesSent)} more messages`,
        `Perform ${Math.max(0, 10 - stats.pipelineActions)} pipeline actions`
      ].filter(req => !req.includes('0 more'));
    case 'advanced':
      return [
        `Use AI assistance ${Math.max(0, 25 - stats.aiInteractions)} more times`,
        `Use ${Math.max(0, 10 - stats.templatesUsed)} message templates`
      ].filter(req => !req.includes('0 more'));
    case 'expert':
      return ['🎉 You\'ve mastered all CRM features!'];
    default:
      return [];
  }
}