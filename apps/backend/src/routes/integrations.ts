/**
 * Integrations API Routes
 * 
 * Handles third-party service integrations like WhatsApp, Gmail, 
 * Google Calendar, CSV imports, and automation tools.
 */

import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

// Integration JSON Schemas
const connectIntegrationSchema = {
  type: 'object',
  properties: {
    integrationId: { type: 'string', minLength: 1 },
    authCode: { type: 'string' },
    config: { type: 'object' },
    redirectUri: { type: 'string' }
  },
  required: ['integrationId']
};

const updateIntegrationSchema = {
  type: 'object',
  properties: {
    enabled: { type: 'boolean' },
    config: { type: 'object' },
    settings: { type: 'object' }
  }
};

const importDataSchema = {
  type: 'object',
  properties: {
    integrationId: { type: 'string', minLength: 1 },
    fileData: { type: 'string', minLength: 1 },
    fileName: { type: 'string', minLength: 1 },
    mapping: { type: 'object' }
  },
  required: ['integrationId', 'fileData', 'fileName']
};

export async function integrationsRoutes(fastify: FastifyInstance) {
  // Apply authentication to all integration routes
  fastify.addHook('preHandler', authenticate);

  /**
   * Get All Integrations
   * GET /api/integrations
   * 
   * Returns list of all available integrations with their status
   */
  fastify.get('/', async (request, reply) => {
    try {
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Get user's integration connections
      const connectionsResult = await fastify.db.query(`
        SELECT integration_id, status, config, connected_at, last_sync_at
        FROM user_integrations 
        WHERE user_id = $1
      `, [userId]);

      const userConnections = new Map(
        connectionsResult.rows.map(row => [
          row.integration_id, 
          {
            status: row.status,
            config: row.config || {},
            connectedAt: row.connected_at,
            lastSyncAt: row.last_sync_at
          }
        ])
      );

      // Define available integrations with their metadata
      const availableIntegrations = [
        {
          id: 'whatsapp',
          name: 'WhatsApp Business',
          description: 'Send and receive WhatsApp messages directly from your CRM',
          category: 'messaging',
          featured: true,
          setupComplexity: 'easy',
          pricing: 'free',
          capabilities: ['messaging', 'media_sharing', 'templates'],
          authType: 'oauth2',
          configFields: [
            { key: 'phone_number_id', label: 'Phone Number ID', type: 'text' },
            { key: 'access_token', label: 'Access Token', type: 'password' },
            { key: 'webhook_verify_token', label: 'Webhook Verify Token', type: 'text' }
          ]
        },
        {
          id: 'gmail',
          name: 'Gmail',
          description: 'Sync emails and create leads from your Gmail inbox',
          category: 'email',
          featured: true,
          setupComplexity: 'easy',
          pricing: 'free',
          capabilities: ['email_sync', 'lead_creation', 'email_tracking'],
          authType: 'oauth2',
          configFields: []
        },
        {
          id: 'google-calendar',
          name: 'Google Calendar',
          description: 'Sync appointments and meetings with Google Calendar',
          category: 'calendar',
          featured: true,
          setupComplexity: 'medium',
          pricing: 'free',
          capabilities: ['calendar_sync', 'meeting_scheduling', 'reminders'],
          authType: 'oauth2',
          configFields: []
        },
        {
          id: 'csv-import',
          name: 'CSV Import',
          description: 'Import contacts and leads from CSV files',
          category: 'data',
          featured: false,
          setupComplexity: 'easy',
          pricing: 'free',
          capabilities: ['data_import', 'bulk_operations'],
          authType: 'none',
          configFields: [
            { key: 'delimiter', label: 'CSV Delimiter', type: 'select', options: [',', ';', '\t'] },
            { key: 'has_header', label: 'Has Header Row', type: 'boolean' }
          ]
        },
        {
          id: 'zapier',
          name: 'Zapier',
          description: 'Connect with 5000+ apps through Zapier automation',
          category: 'automation',
          featured: true,
          setupComplexity: 'medium',
          pricing: 'premium',
          capabilities: ['workflow_automation', 'webhooks', 'data_sync'],
          authType: 'api_key',
          configFields: [
            { key: 'webhook_url', label: 'Webhook URL', type: 'text' },
            { key: 'api_key', label: 'API Key', type: 'password' }
          ]
        },
        {
          id: 'voip',
          name: 'VoIP Integration',
          description: 'Make and receive calls directly from the CRM',
          category: 'messaging',
          featured: false,
          setupComplexity: 'advanced',
          pricing: 'premium',
          capabilities: ['voice_calls', 'call_recording', 'call_analytics'],
          authType: 'api_key',
          configFields: [
            { key: 'provider', label: 'VoIP Provider', type: 'select', options: ['twilio', 'vonage', 'custom'] },
            { key: 'account_sid', label: 'Account SID', type: 'text' },
            { key: 'auth_token', label: 'Auth Token', type: 'password' }
          ]
        }
      ];

      // Merge available integrations with user connection status
      const integrations = availableIntegrations.map(integration => {
        const connection = userConnections.get(integration.id);
        return {
          ...integration,
          status: connection ? connection.status : 'available',
          connectedAt: connection?.connectedAt,
          lastSyncAt: connection?.lastSyncAt,
          config: connection?.config || {}
        };
      });

      return reply.send({
        success: true,
        data: {
          integrations,
          summary: {
            total: integrations.length,
            connected: integrations.filter(i => i.status === 'connected').length,
            available: integrations.filter(i => i.status === 'available').length,
            premium: integrations.filter(i => i.pricing === 'premium').length
          }
        }
      });
    } catch (error) {
      logger.error('Failed to fetch integrations:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch integrations'
      });
    }
  });

  /**
   * Connect Integration
   * POST /api/integrations/connect
   * 
   * Initiates connection to a third-party service
   */
  fastify.post('/connect', {
    schema: {
      body: connectIntegrationSchema
    }
  }, async (request, reply) => {
    try {
      const { integrationId, authCode, config, redirectUri } = request.body as any;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Handle different integration types
      let connectionResult;
      switch (integrationId) {
        case 'whatsapp':
          connectionResult = await connectWhatsApp(authCode, config, userId, fastify.db);
          break;
        case 'gmail':
          connectionResult = await connectGmail(authCode, redirectUri, userId, fastify.db);
          break;
        case 'google-calendar':
          connectionResult = await connectGoogleCalendar(authCode, redirectUri, userId, fastify.db);
          break;
        case 'csv-import':
          connectionResult = await enableCSVImport(config, userId, fastify.db);
          break;
        case 'zapier':
          connectionResult = await connectZapier(config, userId, fastify.db);
          break;
        case 'voip':
          connectionResult = await connectVoIP(config, userId, fastify.db);
          break;
        default:
          throw new Error(`Unsupported integration: ${integrationId}`);
      }

      // Log successful connection
      await fastify.db.query(`
        INSERT INTO integration_logs (
          user_id, integration_id, action, status, details, created_at
        ) VALUES ($1, $2, 'connect', 'success', $3, NOW())
      `, [userId, integrationId, JSON.stringify(connectionResult)]);

      // Emit connection event
      fastify.io.emit('integration-connected', {
        userId,
        integrationId,
        status: 'connected',
        timestamp: new Date()
      });

      return reply.status(201).send({
        success: true,
        data: connectionResult
      });
    } catch (error: any) {
      if (error.validation) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid connection data',
          details: error.validation
        });
      }
      
      logger.error('Integration connection failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Connection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Disconnect Integration
   * DELETE /api/integrations/:integrationId
   * 
   * Disconnects and removes integration
   */
  fastify.delete('/:integrationId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          integrationId: { type: 'string', minLength: 1 }
        },
        required: ['integrationId']
      }
    }
  }, async (request, reply) => {
    try {
      const { integrationId } = request.params as { integrationId: string };
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Remove integration connection
      const result = await fastify.db.query(`
        DELETE FROM user_integrations 
        WHERE user_id = $1 AND integration_id = $2
        RETURNING *
      `, [userId, integrationId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Integration not found or not connected'
        });
      }

      // Log disconnection
      await fastify.db.query(`
        INSERT INTO integration_logs (
          user_id, integration_id, action, status, created_at
        ) VALUES ($1, $2, 'disconnect', 'success', NOW())
      `, [userId, integrationId]);

      // Emit disconnection event
      fastify.io.emit('integration-disconnected', {
        userId,
        integrationId,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        data: {
          message: 'Integration disconnected successfully',
          integrationId
        }
      });
    } catch (error) {
      logger.error('Integration disconnection failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Disconnection failed'
      });
    }
  });

  /**
   * Update Integration Settings
   * PUT /api/integrations/:integrationId
   * 
   * Updates integration configuration and settings
   */
  fastify.put('/:integrationId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          integrationId: { type: 'string', minLength: 1 }
        },
        required: ['integrationId']
      },
      body: updateIntegrationSchema
    }
  }, async (request, reply) => {
    try {
      const { integrationId } = request.params as any;
      const { enabled, config, settings } = request.body as any;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Update integration settings
      const result = await fastify.db.query(`
        UPDATE user_integrations 
        SET 
          status = CASE WHEN $1 IS NOT NULL THEN 
            (CASE WHEN $1 = true THEN 'connected' ELSE 'disabled' END)
            ELSE status END,
          config = COALESCE($2::jsonb, config),
          settings = COALESCE($3::jsonb, settings),
          updated_at = NOW()
        WHERE user_id = $4 AND integration_id = $5
        RETURNING *
      `, [
        enabled,
        config ? JSON.stringify(config) : null,
        settings ? JSON.stringify(settings) : null,
        userId,
        integrationId
      ]);

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Integration not found'
        });
      }

      const updatedIntegration = result.rows[0];

      // Log update
      await fastify.db.query(`
        INSERT INTO integration_logs (
          user_id, integration_id, action, status, details, created_at
        ) VALUES ($1, $2, 'update', 'success', $3, NOW())
      `, [userId, integrationId, JSON.stringify({ enabled, config, settings })]);

      return reply.send({
        success: true,
        data: {
          integrationId,
          status: updatedIntegration.status,
          config: JSON.parse(updatedIntegration.config || '{}'),
          settings: JSON.parse(updatedIntegration.settings || '{}'),
          updatedAt: updatedIntegration.updated_at
        }
      });
    } catch (error: any) {
      if (error.validation) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid update data',
          details: error.validation
        });
      }
      
      logger.error('Integration update failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Update failed'
      });
    }
  });

  /**
   * Import Data from Integration
   * POST /api/integrations/import
   * 
   * Imports data from external service or file
   */
  fastify.post('/import', {
    schema: {
      body: importDataSchema
    }
  }, async (request, reply) => {
    try {
      const { integrationId, fileData, fileName, mapping } = request.body as any;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      let importResult;
      switch (integrationId) {
        case 'csv-import':
          importResult = await importCSVData(fileData, fileName, mapping, userId, fastify.db);
          break;
        case 'gmail':
          importResult = await importGmailContacts(userId, fastify.db);
          break;
        default:
          throw new Error(`Import not supported for integration: ${integrationId}`);
      }

      // Log import
      await fastify.db.query(`
        INSERT INTO integration_logs (
          user_id, integration_id, action, status, details, created_at
        ) VALUES ($1, $2, 'import', 'success', $3, NOW())
      `, [userId, integrationId, JSON.stringify(importResult)]);

      return reply.send({
        success: true,
        data: importResult
      });
    } catch (error: any) {
      if (error.validation) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid import data',
          details: error.validation
        });
      }
      
      logger.error('Data import failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get Integration Logs
   * GET /api/integrations/:integrationId/logs
   * 
   * Returns activity logs for specific integration
   */
  fastify.get('/:integrationId/logs', {
    schema: {
      params: {
        type: 'object',
        properties: {
          integrationId: { type: 'string', minLength: 1 }
        },
        required: ['integrationId']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100 },
          offset: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { integrationId } = request.params as { integrationId: string };
      const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const result = await fastify.db.query(`
        SELECT * FROM integration_logs 
        WHERE user_id = $1 AND integration_id = $2
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
      `, [userId, integrationId, Math.min(limit, 100), offset]);

      const logs = result.rows.map(row => ({
        id: row.id,
        action: row.action,
        status: row.status,
        details: JSON.parse(row.details || '{}'),
        createdAt: row.created_at
      }));

      return reply.send({
        success: true,
        data: {
          logs,
          pagination: {
            limit,
            offset,
            total: logs.length
          }
        }
      });
    } catch (error) {
      logger.error('Failed to fetch integration logs:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch logs'
      });
    }
  });
}

// Integration connection handlers
async function connectWhatsApp(authCode: string | undefined, config: any, userId: string, db: any) {
  // In production, this would validate WhatsApp Business API credentials
  const connection = {
    integrationId: 'whatsapp',
    status: 'connected',
    config: {
      phoneNumberId: config?.phone_number_id || 'demo_phone_id',
      accessToken: config?.access_token || 'demo_token',
      webhookVerifyToken: config?.webhook_verify_token || 'demo_verify_token'
    },
    connectedAt: new Date()
  };

  await db.query(`
    INSERT INTO user_integrations (user_id, integration_id, status, config, connected_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, integration_id) DO UPDATE SET
      status = EXCLUDED.status,
      config = EXCLUDED.config,
      connected_at = EXCLUDED.connected_at,
      updated_at = NOW()
  `, [userId, 'whatsapp', 'connected', JSON.stringify(connection.config), connection.connectedAt]);

  return connection;
}

async function connectGmail(authCode: string | undefined, redirectUri: string | undefined, userId: string, db: any) {
  // In production, this would handle OAuth2 flow with Google
  const connection = {
    integrationId: 'gmail',
    status: 'connected',
    config: {
      authCode: authCode || 'demo_auth_code',
      redirectUri: redirectUri || 'http://localhost:3000/integrations/callback'
    },
    connectedAt: new Date()
  };

  await db.query(`
    INSERT INTO user_integrations (user_id, integration_id, status, config, connected_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, integration_id) DO UPDATE SET
      status = EXCLUDED.status,
      config = EXCLUDED.config,
      connected_at = EXCLUDED.connected_at,
      updated_at = NOW()
  `, [userId, 'gmail', 'connected', JSON.stringify(connection.config), connection.connectedAt]);

  return connection;
}

async function connectGoogleCalendar(authCode: string | undefined, redirectUri: string | undefined, userId: string, db: any) {
  const connection = {
    integrationId: 'google-calendar',
    status: 'connected',
    config: {
      authCode: authCode || 'demo_calendar_auth',
      redirectUri: redirectUri || 'http://localhost:3000/integrations/callback'
    },
    connectedAt: new Date()
  };

  await db.query(`
    INSERT INTO user_integrations (user_id, integration_id, status, config, connected_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, integration_id) DO UPDATE SET
      status = EXCLUDED.status,
      config = EXCLUDED.config,
      connected_at = EXCLUDED.connected_at,
      updated_at = NOW()
  `, [userId, 'google-calendar', 'connected', JSON.stringify(connection.config), connection.connectedAt]);

  return connection;
}

async function enableCSVImport(config: any, userId: string, db: any) {
  const connection = {
    integrationId: 'csv-import',
    status: 'connected',
    config: {
      delimiter: config?.delimiter || ',',
      hasHeader: config?.has_header !== false
    },
    connectedAt: new Date()
  };

  await db.query(`
    INSERT INTO user_integrations (user_id, integration_id, status, config, connected_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, integration_id) DO UPDATE SET
      status = EXCLUDED.status,
      config = EXCLUDED.config,
      connected_at = EXCLUDED.connected_at,
      updated_at = NOW()
  `, [userId, 'csv-import', 'connected', JSON.stringify(connection.config), connection.connectedAt]);

  return connection;
}

async function connectZapier(config: any, userId: string, db: any) {
  // Premium feature - would validate API key and webhook URL
  const connection = {
    integrationId: 'zapier',
    status: 'connected',
    config: {
      webhookUrl: config?.webhook_url,
      apiKey: config?.api_key
    },
    connectedAt: new Date()
  };

  await db.query(`
    INSERT INTO user_integrations (user_id, integration_id, status, config, connected_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, integration_id) DO UPDATE SET
      status = EXCLUDED.status,
      config = EXCLUDED.config,
      connected_at = EXCLUDED.connected_at,
      updated_at = NOW()
  `, [userId, 'zapier', 'connected', JSON.stringify(connection.config), connection.connectedAt]);

  return connection;
}

async function connectVoIP(config: any, userId: string, db: any) {
  const connection = {
    integrationId: 'voip',
    status: 'connected',
    config: {
      provider: config?.provider || 'twilio',
      accountSid: config?.account_sid,
      authToken: config?.auth_token
    },
    connectedAt: new Date()
  };

  await db.query(`
    INSERT INTO user_integrations (user_id, integration_id, status, config, connected_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, integration_id) DO UPDATE SET
      status = EXCLUDED.status,
      config = EXCLUDED.config,
      connected_at = EXCLUDED.connected_at,
      updated_at = NOW()
  `, [userId, 'voip', 'connected', JSON.stringify(connection.config), connection.connectedAt]);

  return connection;
}

async function importCSVData(fileData: string, fileName: string, mapping: any, userId: string, db: any) {
  // Decode base64 and parse CSV
  const csvContent = Buffer.from(fileData, 'base64').toString('utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataLines = lines.slice(1);
  
  let imported = 0;
  let errors = 0;

  for (const line of dataLines) {
    try {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      // Map to CRM fields
      const name = record.name || record.Name || record.full_name || '';
      const phone = record.phone || record.Phone || record.mobile || '';
      const email = record.email || record.Email || '';

      if (name && phone) {
        await db.query(`
          INSERT INTO leads (id, name, phone, email, source, user_id, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, 'csv_import', $4, NOW(), NOW())
          ON CONFLICT (phone) DO NOTHING
        `, [name, phone, email, userId]);
        imported++;
      }
    } catch (error) {
      errors++;
    }
  }

  return {
    fileName,
    totalRows: dataLines.length,
    imported,
    errors,
    summary: `Imported ${imported} contacts from ${fileName}`
  };
}

async function importGmailContacts(_userId: string, _db: any) {
  // In production, this would use Google People API
  // For now, return mock data
  return {
    source: 'gmail',
    imported: 0,
    errors: 0,
    summary: 'Gmail import requires OAuth authentication'
  };
}

export default integrationsRoutes;