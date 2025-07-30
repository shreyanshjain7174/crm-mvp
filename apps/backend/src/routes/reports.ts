import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

// Report metrics schema
const reportPeriodSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('7d'),
  reportType: z.enum(['overview', 'leads', 'revenue', 'activity']).default('overview')
});

export async function reportsRoutes(fastify: FastifyInstance) {
  // Get comprehensive report data
  fastify.get('/', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const { period = '7d', reportType = 'overview' } = request.query as any;
      
      // Calculate date range based on period
      let dateFilter;
      switch (period) {
        case '7d':
          dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
          break;
        case '30d':
          dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
          break;
        case '90d':
          dateFilter = "created_at >= NOW() - INTERVAL '90 days'";
          break;
        case '1y':
          dateFilter = "created_at >= NOW() - INTERVAL '1 year'";
          break;
        default:
          dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
      }

      // Get total leads/contacts for the period
      const leadsResult = await fastify.db.query(`
        SELECT COUNT(*) as total_leads FROM contacts 
        WHERE user_id = $1 AND ${dateFilter}
      `, [userId]);
      const totalLeads = parseInt(leadsResult.rows[0]?.total_leads || '0');

      // Get converted leads (contacts with ACTIVE status)
      const convertedResult = await fastify.db.query(`
        SELECT COUNT(*) as converted_leads FROM contacts 
        WHERE user_id = $1 AND status = 'ACTIVE' AND ${dateFilter}
      `, [userId]);
      const convertedLeads = parseInt(convertedResult.rows[0]?.converted_leads || '0');

      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

      // Mock revenue data (in production, this would come from deals/transactions table)
      const totalRevenue = Math.floor(convertedLeads * 5000 + Math.random() * 50000);
      const avgDealSize = convertedLeads > 0 ? Math.floor(totalRevenue / convertedLeads) : 0;
      const activePipelineValue = Math.floor(totalLeads * 3000 + Math.random() * 100000);

      // Get message activity (if messages table exists)
      let messagesSent = 0;
      try {
        const messagesResult = await fastify.db.query(`
          SELECT COUNT(*) as messages FROM messages m
          JOIN leads l ON m.lead_id = l.id
          WHERE l.user_id = $1 AND m.direction = 'OUTBOUND' AND m.${dateFilter.replace('created_at', 'timestamp')}
        `, [userId]);
        messagesSent = parseInt(messagesResult.rows[0]?.messages || '0');
      } catch (error) {
        // Messages table might not exist, use estimated data
        messagesSent = Math.floor(totalLeads * 2.5);
      }

      // Mock call and email data (in production, these would come from activity tables)
      const callsMade = Math.floor(messagesSent * 0.3);
      const emailsSent = Math.floor(messagesSent * 0.4);
      const responseTime = 2.3 + Math.random() * 2; // Mock response time in hours

      // Calculate trends (compare with previous period)
      const previousPeriodFilter = getPreviousPeriodFilter(period);
      
      const previousLeadsResult = await fastify.db.query(`
        SELECT COUNT(*) as previous_leads FROM contacts 
        WHERE user_id = $1 AND ${previousPeriodFilter}
      `, [userId]);
      const previousLeads = parseInt(previousLeadsResult.rows[0]?.previous_leads || '0');
      
      const leadsChange = previousLeads > 0 ? ((totalLeads - previousLeads) / previousLeads * 100) : 0;
      
      const previousConvertedResult = await fastify.db.query(`
        SELECT COUNT(*) as previous_converted FROM contacts 
        WHERE user_id = $1 AND status = 'ACTIVE' AND ${previousPeriodFilter}
      `, [userId]);
      const previousConverted = parseInt(previousConvertedResult.rows[0]?.previous_converted || '0');
      
      const previousConversionRate = previousLeads > 0 ? ((previousConverted / previousLeads) * 100) : 0;
      const conversionChange = previousConversionRate > 0 ? 
        ((conversionRate - previousConversionRate) / previousConversionRate * 100) : 0;

      // Mock revenue and activity trends
      const revenueChange = 15.5 + Math.random() * 20 - 10; // -10% to +25%
      const activityChange = 8.2 + Math.random() * 15 - 5; // -5% to +23%

      // Get top performers (most active contacts)
      const topPerformersResult = await fastify.db.query(`
        SELECT name, email, status, updated_at
        FROM contacts 
        WHERE user_id = $1 AND ${dateFilter}
        ORDER BY updated_at DESC 
        LIMIT 5
      `, [userId]);

      const topPerformers = topPerformersResult.rows.map((row, index) => ({
        name: row.name,
        email: row.email,
        performance: Math.floor(Math.random() * 30) + 70, // Mock performance score 70-100
        change: Math.floor(Math.random() * 20) - 10, // -10 to +10
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }));

      // Get recent activities (based on contact updates)
      const activitiesResult = await fastify.db.query(`
        SELECT name, email, status, updated_at
        FROM contacts 
        WHERE user_id = $1 AND updated_at >= NOW() - INTERVAL '24 hours'
        ORDER BY updated_at DESC 
        LIMIT 10
      `, [userId]);

      const recentActivities = activitiesResult.rows.map(row => ({
        type: getRandomActivityType(),
        description: `${getRandomAction()} ${row.name}`,
        timestamp: row.updated_at,
        user: 'You',
        status: row.status || 'pending'
      }));

      return {
        success: true,
        data: {
          period,
          reportType,
          metrics: {
            totalLeads,
            convertedLeads,
            conversionRate: Math.round(conversionRate * 10) / 10,
            totalRevenue,
            avgDealSize,
            activePipelineValue,
            responseTime: Math.round(responseTime * 10) / 10,
            messagesSent,
            callsMade,
            emailsSent
          },
          trends: {
            leads: Math.round(leadsChange * 10) / 10,
            conversion: Math.round(conversionChange * 10) / 10,
            revenue: Math.round(revenueChange * 10) / 10,
            activity: Math.round(activityChange * 10) / 10
          },
          topPerformers,
          recentActivities,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      fastify.log.error('Reports API error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate reports'
      });
    }
  });

  // Get detailed analytics for specific metrics
  fastify.get('/analytics/:metric', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const { metric } = request.params as { metric: string };
      const { period = '30d' } = request.query as any;

      let data: any = {};

      switch (metric) {
        case 'conversion-funnel':
          // Get conversion funnel data
          const totalContactsResult = await fastify.db.query(`
            SELECT COUNT(*) as total FROM contacts WHERE user_id = $1
          `, [userId]);
          const totalContacts = parseInt(totalContactsResult.rows[0]?.total || '0');

          const qualifiedResult = await fastify.db.query(`
            SELECT COUNT(*) as qualified FROM contacts 
            WHERE user_id = $1 AND status IN ('ACTIVE', 'ENGAGED')
          `, [userId]);
          const qualified = parseInt(qualifiedResult.rows[0]?.qualified || '0');

          const convertedResult = await fastify.db.query(`
            SELECT COUNT(*) as converted FROM contacts 
            WHERE user_id = $1 AND status = 'ACTIVE'
          `, [userId]);
          const converted = parseInt(convertedResult.rows[0]?.converted || '0');

          data = {
            funnel: [
              { stage: 'Total Contacts', count: totalContacts, percentage: 100 },
              { stage: 'Qualified Leads', count: qualified, percentage: totalContacts > 0 ? (qualified / totalContacts * 100) : 0 },
              { stage: 'Converted', count: converted, percentage: totalContacts > 0 ? (converted / totalContacts * 100) : 0 }
            ]
          };
          break;

        case 'performance-trends':
          // Generate mock performance trends
          const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
          const trends = [];
          for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            trends.push({
              date: date.toISOString().split('T')[0],
              leads: Math.floor(Math.random() * 10) + 5,
              conversions: Math.floor(Math.random() * 3) + 1,
              revenue: Math.floor(Math.random() * 5000) + 2000
            });
          }
          data = { trends };
          break;

        default:
          return reply.status(400).send({
            success: false,
            error: 'Invalid metric specified'
          });
      }

      return {
        success: true,
        data,
        metric,
        period,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Analytics API error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate analytics'
      });
    }
  });
}

// Helper functions
function getPreviousPeriodFilter(period: string): string {
  switch (period) {
    case '7d':
      return "created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'";
    case '30d':
      return "created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'";
    case '90d':
      return "created_at >= NOW() - INTERVAL '180 days' AND created_at < NOW() - INTERVAL '90 days'";
    case '1y':
      return "created_at >= NOW() - INTERVAL '2 years' AND created_at < NOW() - INTERVAL '1 year'";
    default:
      return "created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'";
  }
}

function getRandomActivityType(): string {
  const activities = ['call', 'email', 'message', 'meeting', 'note', 'task'];
  return activities[Math.floor(Math.random() * activities.length)];
}

function getRandomAction(): string {
  const actions = ['Called', 'Emailed', 'Messaged', 'Met with', 'Added note for', 'Created task for'];
  return actions[Math.floor(Math.random() * actions.length)];
}