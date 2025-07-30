import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

// WhatsApp settings schema
const whatsappSettingsSchema = z.object({
  businessPhone: z.string().min(10),
  displayName: z.string().min(2),
  welcomeMessage: z.string().min(10),
  businessAccountId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  autoReply: z.boolean(),
  webhookStatus: z.boolean()
});

// AI settings schema
const aiSettingsSchema = z.object({
  confidenceThreshold: z.number().min(0).max(100),
  responseTone: z.enum(['professional', 'friendly', 'casual', 'formal']),
  businessContext: z.string().optional(),
  autoScoring: z.boolean(),
  autoSuggestions: z.boolean(),
  autoFollowup: z.boolean()
});

// Notification settings schema
const notificationSettingsSchema = z.object({
  email: z.object({
    newLeads: z.boolean(),
    whatsappMessages: z.boolean(),
    aiSuggestions: z.boolean()
  }),
  push: z.object({
    urgentLeads: z.boolean(),
    followupReminders: z.boolean()
  })
});

// Backup settings schema
const backupSettingsSchema = z.object({
  autoBackup: z.boolean(),
  includeMessages: z.boolean(),
  includeAIData: z.boolean(),
  frequency: z.enum(['hourly', 'every6hours', 'daily', 'weekly'])
});

// Appearance settings schema
const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string().optional(),
  compactMode: z.boolean(),
  showAnimations: z.boolean(),
  highContrast: z.boolean()
});

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get all settings for a user
  fastify.get('/all', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      
      // Get user settings (create default if not exists)
      const result = await fastify.db.query(`
        SELECT * FROM user_settings WHERE user_id = $1
      `, [userId]);
      
      let settings = result.rows[0];
      
      if (!settings) {
        // Create default settings
        const defaultResult = await fastify.db.query(`
          INSERT INTO user_settings (
            user_id,
            whatsapp_settings,
            ai_settings,
            notification_settings,
            backup_settings,
            appearance_settings
          ) VALUES (
            $1,
            $2::jsonb,
            $3::jsonb,
            $4::jsonb,
            $5::jsonb,
            $6::jsonb
          ) RETURNING *
        `, [
          userId,
          JSON.stringify({
            businessPhone: '',
            displayName: 'CRM Business',
            welcomeMessage: 'Hi! Thanks for reaching out. We\'ll get back to you shortly.',
            businessAccountId: '',
            phoneNumberId: '',
            autoReply: true,
            webhookStatus: true
          }),
          JSON.stringify({
            confidenceThreshold: 80,
            responseTone: 'friendly',
            businessContext: '',
            autoScoring: true,
            autoSuggestions: true,
            autoFollowup: false
          }),
          JSON.stringify({
            email: {
              newLeads: true,
              whatsappMessages: true,
              aiSuggestions: false
            },
            push: {
              urgentLeads: true,
              followupReminders: true
            }
          }),
          JSON.stringify({
            autoBackup: true,
            includeMessages: true,
            includeAIData: false,
            frequency: 'every6hours'
          }),
          JSON.stringify({
            theme: 'system',
            primaryColor: '#3b82f6',
            compactMode: false,
            showAnimations: true,
            highContrast: false
          })
        ]);
        
        settings = defaultResult.rows[0];
      }
      
      return {
        whatsapp: settings.whatsapp_settings,
        ai: settings.ai_settings,
        notifications: settings.notification_settings,
        backup: settings.backup_settings,
        appearance: settings.appearance_settings,
        updatedAt: settings.updated_at
      };
    } catch (error) {
      fastify.log.error('Get settings error:', error);
      reply.status(500).send({ error: 'Failed to get settings' });
    }
  });

  // Update WhatsApp settings
  fastify.put('/whatsapp', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const settings = whatsappSettingsSchema.parse(request.body);
      
      const result = await fastify.db.query(`
        UPDATE user_settings 
        SET whatsapp_settings = $1::jsonb, updated_at = NOW()
        WHERE user_id = $2
        RETURNING whatsapp_settings
      `, [JSON.stringify(settings), userId]);
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Settings not found' });
      }
      
      return { 
        settings: result.rows[0].whatsapp_settings,
        message: 'WhatsApp settings updated successfully' 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Update WhatsApp settings error:', error);
      reply.status(500).send({ error: 'Failed to update WhatsApp settings' });
    }
  });

  // Update AI settings
  fastify.put('/ai', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const settings = aiSettingsSchema.parse(request.body);
      
      const result = await fastify.db.query(`
        UPDATE user_settings 
        SET ai_settings = $1::jsonb, updated_at = NOW()
        WHERE user_id = $2
        RETURNING ai_settings
      `, [JSON.stringify(settings), userId]);
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Settings not found' });
      }
      
      return { 
        settings: result.rows[0].ai_settings,
        message: 'AI settings updated successfully' 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Update AI settings error:', error);
      reply.status(500).send({ error: 'Failed to update AI settings' });
    }
  });

  // Update notification settings
  fastify.put('/notifications', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const settings = notificationSettingsSchema.parse(request.body);
      
      const result = await fastify.db.query(`
        UPDATE user_settings 
        SET notification_settings = $1::jsonb, updated_at = NOW()
        WHERE user_id = $2
        RETURNING notification_settings
      `, [JSON.stringify(settings), userId]);
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Settings not found' });
      }
      
      return { 
        settings: result.rows[0].notification_settings,
        message: 'Notification settings updated successfully' 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Update notification settings error:', error);
      reply.status(500).send({ error: 'Failed to update notification settings' });
    }
  });

  // Update backup settings
  fastify.put('/backup', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const settings = backupSettingsSchema.parse(request.body);
      
      const result = await fastify.db.query(`
        UPDATE user_settings 
        SET backup_settings = $1::jsonb, updated_at = NOW()
        WHERE user_id = $2
        RETURNING backup_settings
      `, [JSON.stringify(settings), userId]);
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Settings not found' });
      }
      
      return { 
        settings: result.rows[0].backup_settings,
        message: 'Backup settings updated successfully' 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Update backup settings error:', error);
      reply.status(500).send({ error: 'Failed to update backup settings' });
    }
  });

  // Update appearance settings
  fastify.put('/appearance', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const settings = appearanceSettingsSchema.parse(request.body);
      
      const result = await fastify.db.query(`
        UPDATE user_settings 
        SET appearance_settings = $1::jsonb, updated_at = NOW()
        WHERE user_id = $2
        RETURNING appearance_settings
      `, [JSON.stringify(settings), userId]);
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Settings not found' });
      }
      
      return { 
        settings: result.rows[0].appearance_settings,
        message: 'Appearance settings updated successfully' 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error('Update appearance settings error:', error);
      reply.status(500).send({ error: 'Failed to update appearance settings' });
    }
  });

  // Export user data
  fastify.get('/export/:type', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const { type } = request.params as { type: string };
      
      let data;
      let filename;
      
      switch (type) {
        case 'contacts':
          const contactsResult = await fastify.db.query(`
            SELECT * FROM contacts WHERE user_id = $1
          `, [userId]);
          data = contactsResult.rows;
          filename = `contacts-export-${Date.now()}.json`;
          break;
          
        case 'messages':
          const messagesResult = await fastify.db.query(`
            SELECT m.* FROM messages m
            JOIN leads l ON m.lead_id = l.id
            WHERE l.user_id = $1
          `, [userId]);
          data = messagesResult.rows;
          filename = `messages-export-${Date.now()}.json`;
          break;
          
        case 'analytics':
          // Get various analytics data
          const statsResult = await fastify.db.query(`
            SELECT 
              (SELECT COUNT(*) FROM leads WHERE user_id = $1) as total_leads,
              (SELECT COUNT(*) FROM leads WHERE user_id = $1 AND status = 'HOT') as hot_leads,
              (SELECT COUNT(*) FROM messages m JOIN leads l ON m.lead_id = l.id WHERE l.user_id = $1) as total_messages,
              (SELECT COUNT(*) FROM interactions i JOIN leads l ON i.lead_id = l.id WHERE l.user_id = $1) as total_interactions
          `, [userId]);
          data = statsResult.rows[0];
          filename = `analytics-export-${Date.now()}.json`;
          break;
          
        default:
          return reply.status(400).send({ error: 'Invalid export type' });
      }
      
      reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(data);
    } catch (error) {
      fastify.log.error('Export data error:', error);
      reply.status(500).send({ error: 'Failed to export data' });
    }
  });

  // Get backup status
  fastify.get('/backup-status', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      
      // In a real implementation, this would check actual backup status
      // For now, we'll simulate it
      const lastBackup = new Date();
      lastBackup.setHours(lastBackup.getHours() - 2);
      
      return {
        lastBackup: lastBackup.toISOString(),
        nextBackup: new Date(lastBackup.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        status: 'success',
        size: '12.5 MB'
      };
    } catch (error) {
      fastify.log.error('Get backup status error:', error);
      reply.status(500).send({ error: 'Failed to get backup status' });
    }
  });
}