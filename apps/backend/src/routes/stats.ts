import { FastifyInstance } from 'fastify';

export async function statsRoutes(fastify: FastifyInstance) {
  // Get dashboard statistics
  fastify.get('/dashboard', async (request, reply) => {
    try {
      // Get total leads count
      const leadsResult = await fastify.db.query('SELECT COUNT(*) as count FROM leads');
      const totalLeads = parseInt(leadsResult.rows[0]?.count || '0');

      // Get active conversations (leads with messages in last 30 days)
      const conversationsResult = await fastify.db.query(`
        SELECT COUNT(DISTINCT leadId) as count 
        FROM messages 
        WHERE createdAt >= NOW() - INTERVAL '30 days'
      `);
      const activeConversations = parseInt(conversationsResult.rows[0]?.count || '0');

      // Calculate conversion rate (leads with status 'WARM', 'HOT', or 'CONVERTED' / total leads)
      const convertedResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM leads 
        WHERE status IN ('WARM', 'HOT', 'CONVERTED')
      `);
      const convertedLeads = parseInt(convertedResult.rows[0]?.count || '0');
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';

      // Get hot leads (status = 'HOT')
      const hotLeadsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM leads 
        WHERE status = 'HOT'
      `);
      const hotLeads = parseInt(hotLeadsResult.rows[0]?.count || '0');

      // Get growth percentage (leads added in last month vs previous month)
      const lastMonthResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM leads 
        WHERE createdAt >= NOW() - INTERVAL '30 days'
      `);
      const lastMonthLeads = parseInt(lastMonthResult.rows[0]?.count || '0');

      const previousMonthResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM leads 
        WHERE createdAt >= NOW() - INTERVAL '60 days' 
        AND createdAt < NOW() - INTERVAL '30 days'
      `);
      const previousMonthLeads = parseInt(previousMonthResult.rows[0]?.count || '0');
      
      const leadsGrowth = previousMonthLeads > 0 
        ? ((lastMonthLeads - previousMonthLeads) / previousMonthLeads * 100).toFixed(1)
        : lastMonthLeads > 0 ? '100.0' : '0.0';

      // Get conversations growth
      const lastMonthConversationsResult = await fastify.db.query(`
        SELECT COUNT(DISTINCT leadId) as count 
        FROM messages 
        WHERE createdAt >= NOW() - INTERVAL '30 days'
      `);
      const lastMonthConversations = parseInt(lastMonthConversationsResult.rows[0]?.count || '0');

      const previousMonthConversationsResult = await fastify.db.query(`
        SELECT COUNT(DISTINCT leadId) as count 
        FROM messages 
        WHERE createdAt >= NOW() - INTERVAL '60 days' 
        AND createdAt < NOW() - INTERVAL '30 days'
      `);
      const previousMonthConversations = parseInt(previousMonthConversationsResult.rows[0]?.count || '0');
      
      const conversationsGrowth = previousMonthConversations > 0 
        ? ((lastMonthConversations - previousMonthConversations) / previousMonthConversations * 100).toFixed(1)
        : lastMonthConversations > 0 ? '100.0' : '0.0';

      // Get hot leads growth
      const lastMonthHotLeadsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM leads 
        WHERE status = 'HOT' AND updatedAt >= NOW() - INTERVAL '30 days'
      `);
      const lastMonthHotLeads = parseInt(lastMonthHotLeadsResult.rows[0]?.count || '0');

      const previousMonthHotLeadsResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM leads 
        WHERE status = 'HOT' 
        AND updatedAt >= NOW() - INTERVAL '60 days' 
        AND updatedAt < NOW() - INTERVAL '30 days'
      `);
      const previousMonthHotLeads = parseInt(previousMonthHotLeadsResult.rows[0]?.count || '0');
      
      const hotLeadsGrowth = previousMonthHotLeads > 0 
        ? ((lastMonthHotLeads - previousMonthHotLeads) / previousMonthHotLeads * 100).toFixed(1)
        : lastMonthHotLeads > 0 ? '100.0' : '0.0';

      return {
        totalLeads,
        activeConversations,
        conversionRate: parseFloat(conversionRate),
        hotLeads,
        growth: {
          leads: parseFloat(leadsGrowth),
          conversations: parseFloat(conversationsGrowth),
          hotLeads: parseFloat(hotLeadsGrowth),
          conversionRate: 0 // Will calculate later when we have historical data
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching dashboard stats:', error);
      reply.status(500).send({ error: 'Failed to fetch dashboard statistics' });
    }
  });

  // Get user progress statistics
  fastify.get('/user/progress', async (request, reply) => {
    try {
      // Get contact count
      const contactsResult = await fastify.db.query('SELECT COUNT(*) as count FROM leads');
      const contactsAdded = parseInt(contactsResult.rows[0]?.count || '0');

      // Get messages sent count
      const messagesResult = await fastify.db.query(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE direction = 'OUTBOUND'
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