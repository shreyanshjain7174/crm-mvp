import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { LeadStatus, Priority } from '../types/enums';

const createLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  source: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  businessProfile: z.string().optional()
});

const updateLeadSchema = z.object({
  name: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedTo: z.string().optional(),
  businessProfile: z.string().optional()
});

export async function leadRoutes(fastify: FastifyInstance) {
  // Get all leads
  fastify.get('/', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const result = await fastify.db.query(`
        SELECT l.*, 
          (SELECT row_to_json(m) FROM (SELECT * FROM messages WHERE lead_id = l.id ORDER BY timestamp DESC LIMIT 1) m) as latest_message,
          (SELECT json_agg(i ORDER BY i.created_at DESC) FROM (SELECT * FROM interactions WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 3) i) as interactions,
          (SELECT row_to_json(s) FROM (SELECT * FROM ai_suggestions WHERE lead_id = l.id AND approved = false ORDER BY created_at DESC LIMIT 1) s) as pending_suggestion
        FROM leads l 
        WHERE l.user_id = $1 
        ORDER BY l.updated_at DESC
      `, [(request as any).user.userId]);
      const leads = result.rows;
      
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
      
      const result = await fastify.db.query(`
        SELECT l.*, 
          (SELECT json_agg(m ORDER BY m.timestamp DESC) FROM messages m WHERE m.lead_id = l.id) as messages,
          (SELECT json_agg(i ORDER BY i.created_at DESC) FROM interactions i WHERE i.lead_id = l.id) as interactions,
          (SELECT json_agg(s ORDER BY s.created_at DESC) FROM ai_suggestions s WHERE s.lead_id = l.id) as ai_suggestions
        FROM leads l 
        WHERE l.id = $1
      `, [id]);
      const lead = result.rows[0];
      
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
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const data = createLeadSchema.parse(request.body);
      
      const result = await fastify.db.query(`
        INSERT INTO leads (name, phone, email, source, priority, business_profile, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [data.name, data.phone, data.email, data.source, data.priority || 'MEDIUM', data.businessProfile, (request as any).user.userId]);
      const lead = { ...result.rows[0], messages: [], interactions: [], ai_suggestions: [] };
      
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
      
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (data.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      if (data.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        values.push(data.priority);
      }
      if (data.assignedTo !== undefined) {
        updateFields.push(`assigned_to = $${paramIndex++}`);
        values.push(data.assignedTo);
      }
      if (data.businessProfile !== undefined) {
        updateFields.push(`business_profile = $${paramIndex++}`);
        values.push(data.businessProfile);
      }
      
      updateFields.push(`updated_at = NOW()`);
      values.push(id);
      
      const result = await fastify.db.query(`
        UPDATE leads SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      const lead = { ...result.rows[0], messages: [], interactions: [], ai_suggestions: [] };
      
      // Create interaction for status change
      if (data.status) {
        await fastify.db.query(`
          INSERT INTO interactions (lead_id, type, description, completed_at)
          VALUES ($1, $2, $3, NOW())
        `, [id, 'STATUS_CHANGE', `Status changed to ${data.status}`]);
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
      
      await fastify.db.query('DELETE FROM leads WHERE id = $1', [id]);
      
      // Emit real-time event
      fastify.io.emit('lead:deleted', { id });
      
      return { success: true };
    } catch (error) {
      fastify.log.error('Error deleting lead:', error);
      reply.status(500).send({ error: 'Failed to delete lead' });
    }
  });
}