import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MessageType } from '../types/enums';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware, invalidateCache, cacheKeyGenerators } from '../middleware/cache-middleware';

const sendMessageSchema = z.object({
  leadId: z.string(),
  content: z.string().min(1),
  messageType: z.nativeEnum(MessageType).optional()
});

export async function messageRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticate);

  // Get all messages with pagination and filters
  fastify.get('/', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 60, // 1 minute cache for messages list
        keyGenerator: cacheKeyGenerators.userWithQuery
      })
    ]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        direction, 
        status,
        leadId 
      } = request.query as {
        page?: number;
        limit?: number;
        search?: string;
        direction?: string;
        status?: string;
        leadId?: string;
      };

      const offset = (Number(page) - 1) * Number(limit);
      const whereConditions = ['l.user_id = $1'];
      const params: any[] = [userId];
      let paramIndex = 2;

      if (search) {
        whereConditions.push(`(l.name ILIKE $${paramIndex} OR l.phone ILIKE $${paramIndex} OR m.content ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (direction && direction !== 'all') {
        whereConditions.push(`m.direction = $${paramIndex}`);
        params.push(direction);
        paramIndex++;
      }

      if (status && status !== 'all') {
        whereConditions.push(`m.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (leadId) {
        whereConditions.push(`m.lead_id = $${paramIndex}`);
        params.push(leadId);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await fastify.db.query(
        `SELECT COUNT(*) FROM messages m 
         JOIN leads l ON m.lead_id = l.id 
         ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated messages
      params.push(Number(limit));
      params.push(offset);
      
      const result = await fastify.db.query(
        `SELECT 
          m.id,
          m.content,
          m.direction,
          m.status,
          m.timestamp,
          m.message_type,
          m.lead_id as "leadId",
          l.name as "leadName",
          l.phone as "leadPhone",
          COALESCE(s.approved AND s.type = 'MESSAGE', false) as "isAiGenerated",
          CASE WHEN s.approved AND s.type = 'MESSAGE' THEN s.confidence * 100 ELSE NULL END as "aiConfidence"
        FROM messages m
        JOIN leads l ON m.lead_id = l.id
        LEFT JOIN ai_suggestions s ON s.lead_id = m.lead_id AND s.content = m.content
        ${whereClause}
        ORDER BY m.timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );

      return {
        messages: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching messages:', error);
      reply.status(500).send({ error: 'Failed to fetch messages' });
    }
  });

  // Get message stats
  fastify.get('/stats', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 300, // 5 minutes cache for message stats
        keyGenerator: cacheKeyGenerators.userSpecific
      })
    ]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      
      const statsResult = await fastify.db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN m.direction = 'OUTBOUND' THEN 1 END) as sent,
          COUNT(CASE WHEN m.direction = 'INBOUND' THEN 1 END) as received,
          COUNT(CASE WHEN s.approved = true AND s.type = 'MESSAGE' THEN 1 END) as "aiGenerated",
          COUNT(CASE WHEN DATE(m.timestamp) = CURRENT_DATE THEN 1 END) as "todayCount"
        FROM messages m
        JOIN leads l ON m.lead_id = l.id
        LEFT JOIN ai_suggestions s ON s.lead_id = m.lead_id AND s.content = m.content
        WHERE l.user_id = $1
      `, [userId]);

      return statsResult.rows[0];
    } catch (error) {
      fastify.log.error('Error fetching message stats:', error);
      reply.status(500).send({ error: 'Failed to fetch message stats' });
    }
  });

  // Get all conversations (grouped by lead)
  fastify.get('/conversations', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 120, // 2 minutes cache for conversations
        keyGenerator: cacheKeyGenerators.userSpecific
      })
    ]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      
      const result = await fastify.db.query(`
        SELECT l.*, 
          (SELECT row_to_json(m) FROM (SELECT * FROM messages WHERE lead_id = l.id ORDER BY timestamp DESC LIMIT 1) m) as latest_message
        FROM leads l 
        WHERE l.user_id = $1 AND EXISTS (SELECT 1 FROM messages WHERE lead_id = l.id)
        ORDER BY l.updated_at DESC
      `, [userId]);
      const leads = result.rows;
      
      return leads;
    } catch (error) {
      fastify.log.error('Error fetching conversations:', error);
      reply.status(500).send({ error: 'Failed to fetch conversations' });
    }
  });

  // Get messages for a lead
  fastify.get<{ Params: { leadId: string } }>('/lead/:leadId', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 180, // 3 minutes cache for lead messages
        keyGenerator: cacheKeyGenerators.resourceById('lead-messages')
      })
    ]
  }, async (request, reply) => {
    try {
      const { leadId } = request.params;
      
      const result = await fastify.db.query(
        'SELECT * FROM messages WHERE lead_id = $1 ORDER BY timestamp ASC',
        [leadId]
      );
      const messages = result.rows;
      
      return messages;
    } catch (error) {
      fastify.log.error('Error fetching messages:', error);
      reply.status(500).send({ error: 'Failed to fetch messages' });
    }
  });

  // Send message
  fastify.post<{ Body: z.infer<typeof sendMessageSchema> }>('/send', {
    preHandler: [
      authenticate,
      invalidateCache(['user:*:*message*', 'user:*:*conversation*'])
    ]
  }, async (request, reply) => {
    try {
      const data = sendMessageSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;
      
      // Validate UUID format first
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.leadId)) {
        return reply.status(404).send({ error: 'Lead not found' });
      }
      
      // First verify lead exists and belongs to user
      const leadResult = await fastify.db.query(
        'SELECT * FROM leads WHERE id = $1 AND user_id = $2',
        [data.leadId, userId]
      );
      const lead = leadResult.rows[0];

      if (!lead) {
        return reply.status(404).send({ error: 'Lead not found' });
      }
      
      // Create message in database
      const messageResult = await fastify.db.query(`
        INSERT INTO messages (lead_id, content, direction, message_type)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [data.leadId, data.content, 'OUTBOUND', data.messageType || 'TEXT']);
      const message = messageResult.rows[0];

      // TODO: Send via WhatsApp API
      // This will be implemented in the WhatsApp service
      
      // Emit real-time event
      fastify.io.emit('message:sent', message);
      
      return message;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Error sending message:', error);
      reply.status(500).send({ error: 'Failed to send message' });
    }
  });

  // Mark message as read
  fastify.put<{ Params: { id: string } }>('/:id/read', {
    preHandler: [
      authenticate,
      invalidateCache(['user:*:*message*'])
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Validate UUID format first
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return null; // Return null for invalid IDs (like "non-existent-id")
      }
      
      const result = await fastify.db.query(
        'UPDATE messages SET status = $1 WHERE id = $2 RETURNING *',
        ['read', id]
      );
      const message = result.rows[0];
      
      if (message) {
        // Emit real-time event if message exists
        fastify.io.emit('message:read', message);
      }
      
      return message || null;
    } catch (error) {
      fastify.log.error('Error marking message as read:', error);
      reply.status(500).send({ error: 'Failed to mark message as read' });
    }
  });

  // Get conversation for a specific lead
  fastify.get<{ Params: { leadId: string } }>('/conversation/:leadId', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 180, // 3 minutes cache for conversations
        keyGenerator: cacheKeyGenerators.resourceById('conversation')
      })
    ]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const { leadId } = request.params;
      
      // Verify the lead belongs to the user
      const leadResult = await fastify.db.query(
        'SELECT id FROM leads WHERE id = $1 AND user_id = $2',
        [leadId, userId]
      );
      
      if (leadResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Lead not found' });
      }

      const result = await fastify.db.query(
        `SELECT 
          m.id,
          m.content,
          m.direction,
          m.status,
          m.timestamp,
          m.message_type,
          m.lead_id as "leadId",
          l.name as "leadName",
          l.phone as "leadPhone",
          COALESCE(s.approved AND s.type = 'MESSAGE', false) as "isAiGenerated",
          CASE WHEN s.approved AND s.type = 'MESSAGE' THEN s.confidence * 100 ELSE NULL END as "aiConfidence"
        FROM messages m
        JOIN leads l ON m.lead_id = l.id
        LEFT JOIN ai_suggestions s ON s.lead_id = m.lead_id AND s.content = m.content
        WHERE m.lead_id = $1 AND l.user_id = $2
        ORDER BY m.timestamp ASC`,
        [leadId, userId]
      );

      return result.rows;
    } catch (error) {
      fastify.log.error('Error fetching conversation:', error);
      reply.status(500).send({ error: 'Failed to fetch conversation' });
    }
  });
}