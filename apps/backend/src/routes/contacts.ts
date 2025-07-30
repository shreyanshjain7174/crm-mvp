import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware, invalidateCache, cacheKeyGenerators } from '../middleware/cache-middleware';
import { z } from 'zod';

// Contact schema validation
const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).default('ACTIVE')
});

const contactUpdateSchema = contactSchema.partial();

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Get contacts with search, filtering, and pagination
  fastify.get('/', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 300, // 5 minutes cache to prevent excessive load during re-render loops
        keyGenerator: cacheKeyGenerators.userWithQuery
      })
    ]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      
      // Request frequency monitoring for debugging excessive calls
      const requestNow = Date.now();
      const requestKey = `requests_${userId}_${request.url}`;
      const storedTimes = (global as any)[requestKey] || [];
      const recentTimes = storedTimes.filter((time: number) => requestNow - time < 60000);
      recentTimes.push(requestNow);
      (global as any)[requestKey] = recentTimes;
      
      if (recentTimes.length > 5) {
        fastify.log.warn(`High request frequency: ${recentTimes.length} requests to ${request.url} in 1 minute`);
      }
      
      // Log excessive requests for debugging
      const now = Date.now();
      const userKey = `contacts_requests_${userId}`;
      const requestTimes = (global as any)[userKey] || [];
      
      // Clean old requests (older than 1 minute)
      const recentRequests = requestTimes.filter((time: number) => now - time < 60000);
      recentRequests.push(now);
      (global as any)[userKey] = recentRequests;
      
      // Log if too many requests
      if (recentRequests.length > 10) {
        fastify.log.warn(`High request frequency for user ${userId}: ${recentRequests.length} requests in 1 minute`);
      }
      
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        status = 'all',
        source = 'all',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = request.query as any;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          id, name, email, phone, company, position, source, notes, 
          tags, status, created_at, updated_at,
          COUNT(*) OVER() AS total_count
        FROM contacts 
        WHERE user_id = $1
      `;
      
      const params = [userId];
      let paramIndex = 2;

      // Apply search filter
      if (search) {
        query += ` AND (
          name ILIKE $${paramIndex} OR 
          email ILIKE $${paramIndex} OR 
          company ILIKE $${paramIndex} OR
          phone ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Apply status filter
      if (status !== 'all') {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Apply source filter
      if (source !== 'all') {
        query += ` AND source = $${paramIndex}`;
        params.push(source);
        paramIndex++;
      }

      // Apply sorting
      const validSortFields = ['name', 'email', 'company', 'created_at', 'updated_at'];
      const validSortOrders = ['asc', 'desc'];
      
      if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
      } else {
        query += ` ORDER BY created_at DESC`;
      }

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await fastify.db.query(query, params);
      const totalCount = result.rows[0]?.total_count || 0;

      reply.send({
        contacts: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          company: row.company,
          position: row.position,
          source: row.source,
          notes: row.notes,
          tags: row.tags || [],
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount),
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Failed to fetch contacts:', error);
      reply.status(500).send({ error: 'Failed to fetch contacts' });
    }
  });

  // Get contact statistics
  fastify.get('/stats', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 600, // 10 minutes cache for stats to reduce load
        keyGenerator: cacheKeyGenerators.userSpecific
      })
    ]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      
      // Request frequency monitoring for debugging excessive calls
      const requestNow = Date.now();
      const requestKey = `requests_${userId}_${request.url}`;
      const storedTimes = (global as any)[requestKey] || [];
      const recentTimes = storedTimes.filter((time: number) => requestNow - time < 60000);
      recentTimes.push(requestNow);
      (global as any)[requestKey] = recentTimes;
      
      if (recentTimes.length > 5) {
        fastify.log.warn(`High request frequency: ${recentTimes.length} requests to ${request.url} in 1 minute`);
      }

      const [totalResult, statusResult, sourceResult, recentResult] = await Promise.all([
        fastify.db.query(`
          SELECT COUNT(*) as total FROM contacts WHERE user_id = $1
        `, [userId]),
        fastify.db.query(`
          SELECT status, COUNT(*) as count 
          FROM contacts 
          WHERE user_id = $1 
          GROUP BY status
        `, [userId]),
        fastify.db.query(`
          SELECT source, COUNT(*) as count 
          FROM contacts 
          WHERE user_id = $1 AND source IS NOT NULL
          GROUP BY source 
          ORDER BY count DESC 
          LIMIT 5
        `, [userId]),
        fastify.db.query(`
          SELECT COUNT(*) as recent 
          FROM contacts 
          WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
        `, [userId])
      ]);

      const statusStats = statusResult.rows.reduce((acc, row) => {
        acc[row.status.toLowerCase()] = parseInt(row.count);
        return acc;
      }, { active: 0, inactive: 0, blocked: 0 });

      reply.send({
        total: parseInt(totalResult.rows[0]?.total || '0'),
        recentlyAdded: parseInt(recentResult.rows[0]?.recent || '0'),
        byStatus: statusStats,
        topSources: sourceResult.rows.map(row => ({
          source: row.source,
          count: parseInt(row.count)
        }))
      });
    } catch (error) {
      fastify.log.error('Failed to fetch contact stats:', error);
      reply.status(500).send({ error: 'Failed to fetch contact stats' });
    }
  });

  // Create new contact
  fastify.post('/', {
    preHandler: [
      authenticate,
      invalidateCache(['user:*:*contact*'])
    ],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          company: { type: 'string' },
          position: { type: 'string' },
          source: { type: 'string' },
          notes: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'], default: 'ACTIVE' }
        },
        required: ['name']
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      
      // Request frequency monitoring for debugging excessive calls
      const requestNow = Date.now();
      const requestKey = `requests_${userId}_${request.url}`;
      const storedTimes = (global as any)[requestKey] || [];
      const recentTimes = storedTimes.filter((time: number) => requestNow - time < 60000);
      recentTimes.push(requestNow);
      (global as any)[requestKey] = recentTimes;
      
      if (recentTimes.length > 5) {
        fastify.log.warn(`High request frequency: ${recentTimes.length} requests to ${request.url} in 1 minute`);
      }
      const contactData = request.body as z.infer<typeof contactSchema>;

      const result = await fastify.db.query(`
        INSERT INTO contacts (
          user_id, name, email, phone, company, position, source, 
          notes, tags, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        userId,
        contactData.name,
        contactData.email,
        contactData.phone,
        contactData.company,
        contactData.position,
        contactData.source,
        contactData.notes,
        JSON.stringify(contactData.tags || []),
        contactData.status
      ]);

      const contact = result.rows[0];
      
      reply.status(201).send({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        position: contact.position,
        source: contact.source,
        notes: contact.notes,
        tags: contact.tags || [],
        status: contact.status,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      });
    } catch (error) {
      fastify.log.error('Failed to create contact:', error);
      reply.status(500).send({ error: 'Failed to create contact' });
    }
  });

  // Get single contact
  fastify.get('/:id', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 600, // 10 minutes cache for individual contacts
        keyGenerator: cacheKeyGenerators.resourceById('contact')
      })
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return reply.status(404).send({ error: 'Contact not found' });
      }

      const result = await fastify.db.query(`
        SELECT * FROM contacts WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Contact not found' });
      }

      const contact = result.rows[0];
      reply.send({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        position: contact.position,
        source: contact.source,
        notes: contact.notes,
        tags: contact.tags || [],
        status: contact.status,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      });
    } catch (error) {
      fastify.log.error('Failed to fetch contact:', error);
      reply.status(500).send({ error: 'Failed to fetch contact' });
    }
  });

  // Update contact
  fastify.put('/:id', {
    preHandler: [
      authenticate,
      invalidateCache(['user:*:*contact*'])
    ],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          company: { type: 'string' },
          position: { type: 'string' },
          source: { type: 'string' },
          notes: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const updateData = request.body as z.infer<typeof contactUpdateSchema>;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return reply.status(404).send({ error: 'Contact not found' });
      }

      // Build dynamic update query
      const updateFields = [];
      const params = [id, userId];
      let paramIndex = 3;

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          if (key === 'tags') {
            updateFields.push(`tags = $${paramIndex}`);
            params.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            params.push(value);
          }
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return reply.status(400).send({ error: 'No fields to update' });
      }

      updateFields.push('updated_at = NOW()');

      const result = await fastify.db.query(`
        UPDATE contacts 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Contact not found' });
      }

      const contact = result.rows[0];
      reply.send({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        position: contact.position,
        source: contact.source,
        notes: contact.notes,
        tags: contact.tags || [],
        status: contact.status,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      });
    } catch (error) {
      fastify.log.error('Failed to update contact:', error);
      reply.status(500).send({ error: 'Failed to update contact' });
    }
  });

  // Delete contact
  fastify.delete('/:id', {
    preHandler: [
      authenticate,
      invalidateCache(['user:*:*contact*'])
    ]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return reply.status(404).send({ error: 'Contact not found' });
      }

      const result = await fastify.db.query(`
        DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id
      `, [id, userId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Contact not found' });
      }

      reply.send({ success: true });
    } catch (error) {
      fastify.log.error('Failed to delete contact:', error);
      reply.status(500).send({ error: 'Failed to delete contact' });
    }
  });

  // Bulk operations
  fastify.post('/bulk', {
    preHandler: [
      authenticate,
      invalidateCache(['user:*:*contact*'])
    ]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      
      // Request frequency monitoring for debugging excessive calls
      const requestNow = Date.now();
      const requestKey = `requests_${userId}_${request.url}`;
      const storedTimes = (global as any)[requestKey] || [];
      const recentTimes = storedTimes.filter((time: number) => requestNow - time < 60000);
      recentTimes.push(requestNow);
      (global as any)[requestKey] = recentTimes;
      
      if (recentTimes.length > 5) {
        fastify.log.warn(`High request frequency: ${recentTimes.length} requests to ${request.url} in 1 minute`);
      }
      const { action, contactIds, updateData } = request.body as {
        action: 'delete' | 'update' | 'export';
        contactIds: string[];
        updateData?: Partial<z.infer<typeof contactSchema>>;
      };

      if (!contactIds || contactIds.length === 0) {
        return reply.status(400).send({ error: 'No contacts selected' });
      }

      switch (action) {
        case 'delete': {
          const deleteResult = await fastify.db.query(`
            DELETE FROM contacts 
            WHERE id = ANY($1) AND user_id = $2
            RETURNING id
          `, [contactIds, userId]);
          
          reply.send({ 
            success: true, 
            deletedCount: deleteResult.rows.length 
          });
          break;
        }

        case 'update': {
          if (!updateData) {
            return reply.status(400).send({ error: 'Update data required' });
          }

          // Build dynamic update query for bulk update
          const updateFields = [];
          const params = [contactIds, userId];
          let paramIndex = 3;

          for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
              if (key === 'tags') {
                updateFields.push(`tags = $${paramIndex}`);
                params.push(JSON.stringify(value));
              } else {
                updateFields.push(`${key} = $${paramIndex}`);
                params.push(value);
              }
              paramIndex++;
            }
          }

          if (updateFields.length === 0) {
            return reply.status(400).send({ error: 'No fields to update' });
          }

          updateFields.push('updated_at = NOW()');

          const updateResult = await fastify.db.query(`
            UPDATE contacts 
            SET ${updateFields.join(', ')}
            WHERE id = ANY($1) AND user_id = $2
            RETURNING id
          `, params);

          reply.send({ 
            success: true, 
            updatedCount: updateResult.rows.length 
          });
          break;
        }

        default:
          reply.status(400).send({ error: 'Invalid action' });
      }
    } catch (error) {
      fastify.log.error('Failed bulk operation:', error);
      reply.status(500).send({ error: 'Failed bulk operation' });
    }
  });
}

export default contactRoutes;