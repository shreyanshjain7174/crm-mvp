import { FastifyInstance } from 'fastify';
import { z } from 'zod';
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
  const aiService = new AIService(fastify.prisma);

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
      
      const suggestions = await fastify.prisma.aISuggestion.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
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
      
      const suggestion = await fastify.prisma.aISuggestion.update({
        where: { id },
        data: {
          approved: data.approved,
          approvedAt: data.approved ? new Date() : null,
          content: data.modifiedContent || undefined
        }
      });
      
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
      const totalSuggestions = await fastify.prisma.aISuggestion.count();
      const approvedSuggestions = await fastify.prisma.aISuggestion.count({
        where: { approved: true }
      });
      const executedSuggestions = await fastify.prisma.aISuggestion.count({
        where: { executed: true }
      });
      
      const avgConfidence = await fastify.prisma.aISuggestion.aggregate({
        _avg: { confidence: true }
      });
      
      return {
        totalSuggestions,
        approvedSuggestions,
        executedSuggestions,
        approvalRate: totalSuggestions > 0 ? (approvedSuggestions / totalSuggestions) * 100 : 0,
        executionRate: approvedSuggestions > 0 ? (executedSuggestions / approvedSuggestions) * 100 : 0,
        averageConfidence: avgConfidence._avg.confidence || 0
      };
    } catch (error) {
      fastify.log.error('Error fetching AI analytics:', error);
      reply.status(500).send({ error: 'Failed to fetch analytics' });
    }
  });
}