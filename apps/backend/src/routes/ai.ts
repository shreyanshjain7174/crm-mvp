import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { SuggestionType } from '../types/enums';
import { AIService } from '../services/ai.service';
import { aiIntegrationService, AIRequest } from '../services/ai-integration.service';

const generateSuggestionSchema = z.object({
  leadId: z.string(),
  type: z.nativeEnum(SuggestionType),
  context: z.string().optional()
});

const approveSuggestionSchema = z.object({
  approved: z.boolean(),
  modifiedContent: z.string().optional()
});

const generateResponseSchema = z.object({
  prompt: z.string(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  leadId: z.string().optional(),
  context: z.record(z.any()).optional(),
  stream: z.boolean().optional()
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

  // Get all pending AI suggestions
  fastify.get('/suggestions/pending', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const result = await fastify.db.query(`
        SELECT s.*, 
          row_to_json(l) as lead
        FROM ai_suggestions s
        JOIN leads l ON s.lead_id = l.id
        WHERE s.approved = false AND l.user_id = $1
        ORDER BY s.created_at DESC
      `, [(request as any).user.userId]);
      const suggestions = result.rows;
      
      return suggestions;
    } catch (error) {
      fastify.log.error('Error fetching pending AI suggestions:', error);
      reply.status(500).send({ error: 'Failed to fetch pending suggestions' });
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

  // New AI generation endpoints with streaming support
  fastify.post<{ Body: z.infer<typeof generateResponseSchema> }>('/v2/generate', async (request, reply) => {
    try {
      const data = generateResponseSchema.parse(request.body);
      
      // If streaming is requested, setup SSE
      if (data.stream) {
        reply.header('Content-Type', 'text/event-stream');
        reply.header('Cache-Control', 'no-cache');
        reply.header('Connection', 'keep-alive');
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Headers', 'Cache-Control');

        const aiRequest: AIRequest = {
          prompt: data.prompt,
          model: data.model,
          temperature: data.temperature,
          max_tokens: data.max_tokens,
          user_id: (request as any).user?.userId,
          context: data.context
        };

        try {
          const streamEmitter = await aiIntegrationService.generateStreamingResponse(aiRequest);
          
          streamEmitter.on('chunk', (chunk) => {
            reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
          });

          streamEmitter.on('complete', () => {
            reply.raw.write(`data: [DONE]\n\n`);
            reply.raw.end();
          });

          streamEmitter.on('error', (error) => {
            fastify.log.error('Streaming error:', error);
            reply.raw.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
            reply.raw.end();
          });

        } catch (error) {
          fastify.log.error('Error setting up streaming:', error);
          reply.raw.write(`data: ${JSON.stringify({ error: 'Failed to initiate streaming' })}\n\n`);
          reply.raw.end();
        }
      } else {
        // Regular non-streaming response
        const aiRequest: AIRequest = {
          prompt: data.prompt,
          model: data.model,
          temperature: data.temperature,
          max_tokens: data.max_tokens,
          user_id: (request as any).user?.userId,
          context: data.context
        };

        const response = await aiIntegrationService.generateResponse(aiRequest);
        return response;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Error generating AI response:', error);
      reply.status(500).send({ error: 'Failed to generate response' });
    }
  });

  // Get available AI models
  fastify.get('/models', async (request, reply) => {
    try {
      const models = await aiIntegrationService.getAvailableModels();
      return { models };
    } catch (error) {
      fastify.log.error('Error fetching AI models:', error);
      reply.status(500).send({ error: 'Failed to fetch available models' });
    }
  });

  // Get token usage statistics
  fastify.get('/usage', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId;
      const usage = await aiIntegrationService.getTokenUsage(userId);
      return usage;
    } catch (error) {
      fastify.log.error('Error fetching token usage:', error);
      reply.status(500).send({ error: 'Failed to fetch token usage' });
    }
  });

  // AI service health check
  fastify.get('/health', async (_request, _reply) => {
    try {
      const isHealthy = await aiIntegrationService.healthCheck();
      return { 
        status: isHealthy ? 'healthy' : 'unhealthy',
        ai_backend_connected: isHealthy,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Error checking AI service health:', error);
      return { 
        status: 'unhealthy',
        ai_backend_connected: false,
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      };
    }
  });
}