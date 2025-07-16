import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  source: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  businessProfile: z.string().optional()
});

const updateLeadSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['COLD', 'WARM', 'HOT', 'CONVERTED', 'LOST']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  businessProfile: z.string().optional()
});

export async function leadRoutes(fastify: FastifyInstance) {
  // Get all leads
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const leads = await fastify.prisma.lead.findMany({
        where: { userId: request.user.userId },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1
          },
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          aiSuggestions: {
            where: { approved: false },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return leads;
    } catch (error) {
      fastify.log.error('Error fetching leads:', error);
      reply.status(500).send({ error: 'Failed to fetch leads' });
    }
  });

  // Get lead by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const lead = await fastify.prisma.lead.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' }
          },
          interactions: {
            orderBy: { createdAt: 'desc' }
          },
          aiSuggestions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      
      if (!lead) {
        return reply.status(404).send({ error: 'Lead not found' });
      }
      
      return lead;
    } catch (error) {
      fastify.log.error('Error fetching lead:', error);
      reply.status(500).send({ error: 'Failed to fetch lead' });
    }
  });

  // Create new lead
  fastify.post<{ Body: z.infer<typeof createLeadSchema> }>('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const data = createLeadSchema.parse(request.body);
      
      const lead = await fastify.prisma.lead.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          source: data.source,
          priority: data.priority || 'MEDIUM',
          businessProfile: data.businessProfile,
          userId: request.user.userId
        },
        include: {
          messages: true,
          interactions: true,
          aiSuggestions: true
        }
      });
      
      // Emit real-time event
      fastify.io.emit('lead:created', lead);
      
      return lead;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Error creating lead:', error);
      reply.status(500).send({ error: 'Failed to create lead' });
    }
  });

  // Update lead
  fastify.put<{ Params: { id: string }, Body: z.infer<typeof updateLeadSchema> }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const data = updateLeadSchema.parse(request.body);
      
      const lead = await fastify.prisma.lead.update({
        where: { id },
        data,
        include: {
          messages: true,
          interactions: true,
          aiSuggestions: true
        }
      });
      
      // Create interaction for status change
      if (data.status) {
        await fastify.prisma.interaction.create({
          data: {
            leadId: id,
            type: 'STATUS_CHANGE',
            description: `Status changed to ${data.status}`,
            completedAt: new Date()
          }
        });
      }
      
      // Emit real-time event
      fastify.io.emit('lead:updated', lead);
      
      return lead;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Error updating lead:', error);
      reply.status(500).send({ error: 'Failed to update lead' });
    }
  });

  // Delete lead
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      await fastify.prisma.lead.delete({
        where: { id }
      });
      
      // Emit real-time event
      fastify.io.emit('lead:deleted', { id });
      
      return { success: true };
    } catch (error) {
      fastify.log.error('Error deleting lead:', error);
      reply.status(500).send({ error: 'Failed to delete lead' });
    }
  });
}