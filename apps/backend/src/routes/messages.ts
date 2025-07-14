import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Direction, MessageType } from '@prisma/client';

const sendMessageSchema = z.object({
  leadId: z.string(),
  content: z.string().min(1),
  messageType: z.nativeEnum(MessageType).optional()
});

export async function messageRoutes(fastify: FastifyInstance) {
  // Get all conversations (grouped by lead)
  fastify.get('/conversations', async (request, reply) => {
    try {
      const leads = await fastify.prisma.lead.findMany({
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        },
        where: {
          messages: {
            some: {}
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
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
      
      const messages = await fastify.prisma.message.findMany({
        where: { leadId },
        orderBy: { timestamp: 'asc' }
      });
      
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
      const message = await fastify.prisma.message.create({
        data: {
          ...data,
          direction: 'OUTBOUND',
          messageType: data.messageType || 'TEXT'
        }
      });

      // Get lead info for WhatsApp sending
      const lead = await fastify.prisma.lead.findUnique({
        where: { id: data.leadId }
      });

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
      
      const message = await fastify.prisma.message.update({
        where: { id },
        data: { status: 'READ' }
      });
      
      // Emit real-time event
      fastify.io.emit('message:read', message);
      
      return message;
    } catch (error) {
      fastify.log.error('Error marking message as read:', error);
      reply.status(500).send({ error: 'Failed to mark message as read' });
    }
  });
}