import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SuggestionType } from '../types/enums';
import { AIService } from '../services/ai.service';

const generateSuggestionSchema = z.object({
  leadId: z.string(),
  type: z.enum(['MESSAGE', 'FOLLOW_UP', 'STATUS_CHANGE', 'PRIORITY_UPDATE']),
  context: z.string().optional()
});

const approveSuggestionSchema = z.object({
  approved: z.boolean(),
  modifiedContent: z.string().optional()
});

export async function aiRoutes(fastify: FastifyInstance) {
  const aiService = new AIService(fastify.db);

  // Generate AI suggestion
  fastify.post<{ Body: z.infer<typeof generateSuggestionSchema> }>('/suggest', async (request, reply) => {
    try {
      const data = generateSuggestionSchema.parse(request.body);
      
      const suggestion = await aiService.generateSuggestion(data.leadId, data.type, data.context);
      
      // Emit real-time event
      fastify.io.emit('ai:suggestion', suggestion);
      
      return suggestion;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Error generating AI suggestion:', error);
      reply.status(500).send({ error: 'Failed to generate suggestion' });
    }
  });

  // Get AI suggestions for a lead
  fastify.get<{ Params: { leadId: string } }>('/suggestions/:leadId', async (request, reply) => {
    try {
      const { leadId } = request.params;
      
      const result = await fastify.db.query(
        'SELECT * FROM ai_suggestions WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 10',
        [leadId]
      );
      const suggestions = result.rows;
      
      return suggestions;
    } catch (error) {
      fastify.log.error('Error fetching AI suggestions:', error);
      reply.status(500).send({ error: 'Failed to fetch suggestions' });
    }
  });

  // Approve/reject AI suggestion
  fastify.put<{ 
    Params: { id: string }, 
    Body: z.infer<typeof approveSuggestionSchema> 
  }>('/suggestions/:id/approve', async (request, reply) => {
    try {
      const { id } = request.params;
      const data = approveSuggestionSchema.parse(request.body);
      
      const result = await fastify.db.query(
        'UPDATE ai_suggestions SET approved = $1, approved_at = $2, content = COALESCE($3, content) WHERE id = $4 RETURNING *',
        [data.approved, data.approved ? new Date() : null, data.modifiedContent, id]
      );
      const suggestion = result.rows[0];
      
      if (data.approved) {
        await aiService.executeSuggestion(suggestion);
      }
      
      // Emit real-time event
      fastify.io.emit('ai:suggestion_approved', suggestion);
      
      return suggestion;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Error approving AI suggestion:', error);
      reply.status(500).send({ error: 'Failed to approve suggestion' });
    }
  });

  // Get AI analytics
  fastify.get('/analytics', async (request, reply) => {
    try {
      const totalResult = await fastify.db.query('SELECT COUNT(*) as count FROM ai_suggestions');
      const approvedResult = await fastify.db.query('SELECT COUNT(*) as count FROM ai_suggestions WHERE approved = true');
      const executedResult = await fastify.db.query('SELECT COUNT(*) as count FROM ai_suggestions WHERE executed = true');
      const avgResult = await fastify.db.query('SELECT AVG(confidence) as avg_confidence FROM ai_suggestions');
      
      const totalSuggestions = parseInt(totalResult.rows[0].count);
      const approvedSuggestions = parseInt(approvedResult.rows[0].count);
      const executedSuggestions = parseInt(executedResult.rows[0].count);
      const avgConfidence = parseFloat(avgResult.rows[0].avg_confidence || 0);
      
      return {
        totalSuggestions,
        approvedSuggestions,
        executedSuggestions,
        approvalRate: totalSuggestions > 0 ? (approvedSuggestions / totalSuggestions) * 100 : 0,
        executionRate: approvedSuggestions > 0 ? (executedSuggestions / approvedSuggestions) * 100 : 0,
        averageConfidence: avgConfidence
      };
    } catch (error) {
      fastify.log.error('Error fetching AI analytics:', error);
      reply.status(500).send({ error: 'Failed to fetch analytics' });
    }
  });
}