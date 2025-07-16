import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Direction, MessageType } from '../types/enums';

const sendMessageSchema = z.object({
  leadId: z.string(),
  content: z.string().min(1),
  messageType: z.nativeEnum(MessageType).optional()
});

export async function messageRoutes(fastify: FastifyInstance) {
  // Get all conversations (grouped by lead)
  fastify.get('/conversations', async (request, reply) => {
    try {
      const result = await fastify.db.query(`
        SELECT l.*, 
          (SELECT row_to_json(m) FROM (SELECT * FROM messages WHERE lead_id = l.id ORDER BY timestamp DESC LIMIT 1) m) as latest_message
        FROM leads l 
        WHERE EXISTS (SELECT 1 FROM messages WHERE lead_id = l.id)
        ORDER BY l.updated_at DESC
      `);
      const leads = result.rows;
      
      return leads;
    } catch (error) {
      fastify.log.error('Error fetching conversations:', error);
      reply.status(500).send({ error: 'Failed to fetch conversations' });
    }
  });

  // Get messages for a lead
  fastify.get<{ Params: { leadId: string } }>('/lead/:leadId', async (request, reply) => {
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
  fastify.post<{ Body: z.infer<typeof sendMessageSchema> }>('/send', async (request, reply) => {
    try {
      const data = sendMessageSchema.parse(request.body);
      
      // Create message in database
      const messageResult = await fastify.db.query(`
        INSERT INTO messages (lead_id, content, direction, message_type)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [data.leadId, data.content, 'OUTBOUND', data.messageType || 'TEXT']);
      const message = messageResult.rows[0];

      // Get lead info for WhatsApp sending
      const leadResult = await fastify.db.query(
        'SELECT * FROM leads WHERE id = $1',
        [data.leadId]
      );
      const lead = leadResult.rows[0];

      if (!lead) {
        return reply.status(404).send({ error: 'Lead not found' });
      }

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
  fastify.put<{ Params: { id: string } }>('/:id/read', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const result = await fastify.db.query(
        'UPDATE messages SET status = $1 WHERE id = $2 RETURNING *',
        ['READ', id]
      );
      const message = result.rows[0];
      
      // Emit real-time event
      fastify.io.emit('message:read', message);
      
      return message;
    } catch (error) {
      fastify.log.error('Error marking message as read:', error);
      reply.status(500).send({ error: 'Failed to mark message as read' });
    }
  });
}