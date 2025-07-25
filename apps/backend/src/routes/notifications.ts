import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

// Notification schema validation
const notificationSchema = z.object({
  type: z.enum(['info', 'success', 'warning', 'error']),
  category: z.enum(['lead', 'message', 'ai', 'system', 'pipeline', 'contact', 'workflow', 'achievement']),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  actionRequired: z.boolean().default(false),
  actionUrl: z.string().url().optional(),
  relatedEntity: z.object({
    type: z.string(),
    id: z.string(),
    name: z.string()
  }).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional()
});

const notificationPreferencesSchema = z.object({
  category: z.string(),
  inAppEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  desktopEnabled: z.boolean().default(true),
  soundEnabled: z.boolean().default(true)
});

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Get user notifications
  fastify.get('/', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const { 
        page = 1, 
        limit = 20, 
        filter = 'all', 
        category = 'all',
        search = '',
        includeRead = 'true'
      } = request.query as any;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          id, type, category, title, message, priority, is_read, is_starred,
          action_required, action_url, related_entity_type, related_entity_id,
          related_entity_name, metadata, expires_at, created_at, updated_at,
          COUNT(*) OVER() AS total_count
        FROM user_notifications 
        WHERE user_id = $1
      `;
      
      const params = [userId];
      let paramIndex = 2;

      // Apply filters
      if (filter === 'unread') {
        query += ` AND is_read = false`;
      } else if (filter === 'starred') {
        query += ` AND is_starred = true`;
      } else if (filter === 'urgent') {
        query += ` AND priority = 'urgent'`;
      }

      if (category !== 'all') {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (search) {
        query += ` AND (title ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Filter out expired notifications
      query += ` AND (expires_at IS NULL OR expires_at > NOW())`;

      query += ` ORDER BY 
        CASE WHEN priority = 'urgent' THEN 1
             WHEN priority = 'high' THEN 2  
             WHEN priority = 'medium' THEN 3
             ELSE 4 END,
        is_read ASC,
        created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);

      const result = await fastify.db.query(query, params);
      const totalCount = result.rows[0]?.total_count || 0;

      reply.send({
        notifications: result.rows.map(row => ({
          id: row.id,
          type: row.type,
          category: row.category,
          title: row.title,
          message: row.message,
          timestamp: row.created_at,
          isRead: row.is_read,
          isStarred: row.is_starred,
          priority: row.priority,
          actionRequired: row.action_required,
          actionUrl: row.action_url,
          relatedEntity: row.related_entity_type ? {
            type: row.related_entity_type,
            id: row.related_entity_id,
            name: row.related_entity_name
          } : undefined,
          metadata: row.metadata,
          expiresAt: row.expires_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount),
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      fastify.log.error('Failed to fetch notifications:', error);
      reply.status(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  // Get notification statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const [totalResult, unreadResult, starredResult, urgentResult] = await Promise.all([
        fastify.db.query(`
          SELECT COUNT(*) as total 
          FROM user_notifications 
          WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
        `, [userId]),
        fastify.db.query(`
          SELECT COUNT(*) as unread 
          FROM user_notifications 
          WHERE user_id = $1 AND is_read = false AND (expires_at IS NULL OR expires_at > NOW())
        `, [userId]),
        fastify.db.query(`
          SELECT COUNT(*) as starred 
          FROM user_notifications 
          WHERE user_id = $1 AND is_starred = true AND (expires_at IS NULL OR expires_at > NOW())
        `, [userId]),
        fastify.db.query(`
          SELECT COUNT(*) as urgent 
          FROM user_notifications 
          WHERE user_id = $1 AND priority = 'urgent' AND (expires_at IS NULL OR expires_at > NOW())
        `, [userId])
      ]);

      reply.send({
        total: parseInt(totalResult.rows[0]?.total || '0'),
        unread: parseInt(unreadResult.rows[0]?.unread || '0'),
        starred: parseInt(starredResult.rows[0]?.starred || '0'),
        urgent: parseInt(urgentResult.rows[0]?.urgent || '0')
      });
    } catch (error) {
      fastify.log.error('Failed to fetch notification stats:', error);
      reply.status(500).send({ error: 'Failed to fetch notification stats' });
    }
  });

  // Create new notification
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
          category: { type: 'string', enum: ['lead', 'message', 'ai', 'system', 'pipeline', 'contact', 'workflow', 'achievement'] },
          title: { type: 'string', minLength: 1, maxLength: 255 },
          message: { type: 'string', minLength: 1 },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
          actionRequired: { type: 'boolean', default: false },
          actionUrl: { type: 'string', format: 'uri' },
          relatedEntity: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              id: { type: 'string' },
              name: { type: 'string' }
            }
          },
          metadata: { type: 'object' },
          expiresAt: { type: 'string', format: 'date-time' }
        },
        required: ['type', 'category', 'title', 'message']
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const notificationData = request.body as z.infer<typeof notificationSchema>;

      const result = await fastify.db.query(`
        INSERT INTO user_notifications (
          user_id, type, category, title, message, priority, action_required,
          action_url, related_entity_type, related_entity_id, related_entity_name,
          metadata, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        userId,
        notificationData.type,
        notificationData.category,
        notificationData.title,
        notificationData.message,
        notificationData.priority,
        notificationData.actionRequired,
        notificationData.actionUrl,
        notificationData.relatedEntity?.type,
        notificationData.relatedEntity?.id,
        notificationData.relatedEntity?.name,
        JSON.stringify(notificationData.metadata || {}),
        notificationData.expiresAt
      ]);

      const notification = result.rows[0];
      
      // Emit real-time notification via Socket.io if available
      if (fastify.io) {
        fastify.io.to(`user_${userId}`).emit('new_notification', {
          id: notification.id,
          type: notification.type,
          category: notification.category,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          timestamp: notification.created_at
        });
      }

      reply.status(201).send({
        id: notification.id,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        timestamp: notification.created_at
      });
    } catch (error) {
      fastify.log.error('Failed to create notification:', error);
      reply.status(500).send({ error: 'Failed to create notification' });
    }
  });

  // Mark notification as read
  fastify.patch('/:id/read', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const result = await fastify.db.query(`
        UPDATE user_notifications 
        SET is_read = true, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [id, userId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      reply.send({ success: true });
    } catch (error) {
      fastify.log.error('Failed to mark notification as read:', error);
      reply.status(500).send({ error: 'Failed to mark notification as read' });
    }
  });

  // Toggle notification star
  fastify.patch('/:id/star', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const result = await fastify.db.query(`
        UPDATE user_notifications 
        SET is_starred = NOT is_starred, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING is_starred
      `, [id, userId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      reply.send({ 
        success: true, 
        isStarred: result.rows[0].is_starred 
      });
    } catch (error) {
      fastify.log.error('Failed to toggle notification star:', error);
      reply.status(500).send({ error: 'Failed to toggle notification star' });
    }
  });

  // Mark all notifications as read
  fastify.patch('/mark-all-read', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      await fastify.db.query(`
        UPDATE user_notifications 
        SET is_read = true, updated_at = NOW()
        WHERE user_id = $1 AND is_read = false
      `, [userId]);

      reply.send({ success: true });
    } catch (error) {
      fastify.log.error('Failed to mark all notifications as read:', error);
      reply.status(500).send({ error: 'Failed to mark all notifications as read' });
    }
  });

  // Delete notification
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const result = await fastify.db.query(`
        DELETE FROM user_notifications 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [id, userId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      reply.send({ success: true });
    } catch (error) {
      fastify.log.error('Failed to delete notification:', error);
      reply.status(500).send({ error: 'Failed to delete notification' });
    }
  });

  // Get user notification preferences
  fastify.get('/preferences', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const result = await fastify.db.query(`
        SELECT 
          category, in_app_enabled, email_enabled, push_enabled,
          desktop_enabled, sound_enabled
        FROM user_notification_preferences 
        WHERE user_id = $1
        ORDER BY category
      `, [userId]);

      reply.send({
        preferences: result.rows.map(row => ({
          category: row.category,
          inAppEnabled: row.in_app_enabled,
          emailEnabled: row.email_enabled,
          pushEnabled: row.push_enabled,
          desktopEnabled: row.desktop_enabled,
          soundEnabled: row.sound_enabled
        }))
      });
    } catch (error) {
      fastify.log.error('Failed to fetch notification preferences:', error);
      reply.status(500).send({ error: 'Failed to fetch notification preferences' });
    }
  });

  // Update user notification preferences
  fastify.put('/preferences/:category', {
    schema: {
      body: {
        type: 'object',
        properties: {
          inAppEnabled: { type: 'boolean', default: true },
          emailEnabled: { type: 'boolean', default: false },
          pushEnabled: { type: 'boolean', default: true },
          desktopEnabled: { type: 'boolean', default: true },
          soundEnabled: { type: 'boolean', default: true }
        }
      },
      params: {
        type: 'object',
        properties: {
          category: { type: 'string' }
        },
        required: ['category']
      }
    }
  }, async (request, reply) => {
    try {
      const { category } = request.params as { category: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;
      const preferences = request.body as Omit<z.infer<typeof notificationPreferencesSchema>, 'category'>;

      const result = await fastify.db.query(`
        INSERT INTO user_notification_preferences (
          user_id, category, in_app_enabled, email_enabled, push_enabled,
          desktop_enabled, sound_enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, category)
        DO UPDATE SET
          in_app_enabled = $3,
          email_enabled = $4,
          push_enabled = $5,
          desktop_enabled = $6,
          sound_enabled = $7,
          updated_at = NOW()
        RETURNING *
      `, [
        userId,
        category,
        preferences.inAppEnabled,
        preferences.emailEnabled,
        preferences.pushEnabled,
        preferences.desktopEnabled,
        preferences.soundEnabled
      ]);

      reply.send({
        success: true,
        preferences: {
          category: result.rows[0].category,
          inAppEnabled: result.rows[0].in_app_enabled,
          emailEnabled: result.rows[0].email_enabled,
          pushEnabled: result.rows[0].push_enabled,
          desktopEnabled: result.rows[0].desktop_enabled,
          soundEnabled: result.rows[0].sound_enabled
        }
      });
    } catch (error) {
      fastify.log.error('Failed to update notification preferences:', error);
      reply.status(500).send({ error: 'Failed to update notification preferences' });
    }
  });
}

// Helper function to create notifications from templates
export async function createNotificationFromTemplate(
  fastify: FastifyInstance,
  userId: string,
  templateKey: string,
  variables: Record<string, any> = {},
  relatedEntity?: { type: string; id: string; name: string }
) {
  try {
    // Get template
    const templateResult = await fastify.db.query(`
      SELECT * FROM notification_templates 
      WHERE template_key = $1 AND is_active = true
    `, [templateKey]);

    if (templateResult.rows.length === 0) {
      fastify.log.warn(`Notification template not found: ${templateKey}`);
      return;
    }

    const template = templateResult.rows[0];

    // Replace variables in title and message
    let title = template.title_template;
    let message = template.message_template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regex, String(value));
      message = message.replace(regex, String(value));
    });

    // Create notification
    await fastify.db.query(`
      INSERT INTO user_notifications (
        user_id, type, category, title, message, priority, action_required,
        related_entity_type, related_entity_id, related_entity_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      userId,
      template.type,
      template.category,
      title,
      message,
      template.priority,
      template.action_required,
      relatedEntity?.type,
      relatedEntity?.id,
      relatedEntity?.name
    ]);

    // Emit real-time notification if Socket.io is available
    if (fastify.io) {
      fastify.io.to(`user_${userId}`).emit('new_notification', {
        type: template.type,
        category: template.category,
        title,
        message,
        priority: template.priority
      });
    }
  } catch (error) {
    fastify.log.error('Failed to create notification from template:', error);
  }
}

export default notificationRoutes;