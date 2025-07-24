/**
 * Universal Agent Protocol (UAP) Backend APIs
 * 
 * Core communication endpoints that enable AI agents to integrate
 * with the CRM platform through standardized protocols.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { agentService } from '../services/agent-service';
import { logger } from '../utils/logger';

// Protocol Data Schemas
const agentConnectSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  apiKey: z.string(),
  manifest: z.object({
    name: z.string(),
    version: z.string(),
    capabilities: z.array(z.string()),
    requirements: z.object({
      permissions: z.array(z.string()),
      resources: z.object({
        memory: z.number().optional(),
        cpu: z.number().optional(),
        storage: z.number().optional()
      }).optional()
    }).optional()
  })
});

const dataReceiveSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  data: z.object({
    type: z.enum(['contact', 'message', 'interaction', 'custom']),
    payload: z.any(),
    metadata: z.record(z.any()).optional()
  }),
  timestamp: z.string().datetime().optional()
});

const dataSendSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  data: z.object({
    type: z.enum(['contact', 'message', 'lead_update', 'event', 'command']),
    payload: z.any(),
    metadata: z.record(z.any()).optional()
  })
});

const querySchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  query: z.object({
    type: z.enum(['leads', 'messages', 'contacts', 'custom']),
    filters: z.record(z.any()).optional(),
    limit: z.number().min(1).max(1000).optional(),
    offset: z.number().min(0).optional()
  })
});

const heartbeatSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  status: z.enum(['healthy', 'degraded', 'error']),
  metrics: z.object({
    memory: z.number().optional(),
    cpu: z.number().optional(),
    responseTime: z.number().optional(),
    activeConnections: z.number().optional()
  }).optional(),
  message: z.string().optional()
});

export async function agentProtocolRoutes(fastify: FastifyInstance) {
  // Apply authentication to all protocol routes
  fastify.addHook('preHandler', authenticate);

  /**
   * Agent Connection Protocol
   * POST /api/agents/protocol/connect
   * 
   * Establishes connection between agent and CRM platform
   */
  fastify.post<{ Body: z.infer<typeof agentConnectSchema> }>('/connect', async (request, reply) => {
    try {
      const { agentId, instanceId, apiKey, manifest } = agentConnectSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Validate agent exists and user has permission
      const agent = await agentService.getAgent(agentId, userId);
      if (!agent) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found or access denied'
        });
      }

      // Validate API key (in production, this would check against stored credentials)
      if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid API key'
        });
      }

      // Create active session for agent instance
      await fastify.db.query(`
        INSERT INTO agent_sessions (
          agent_installation_id, instance_id, status, 
          manifest, connected_at, last_heartbeat
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (agent_installation_id, instance_id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          manifest = EXCLUDED.manifest,
          connected_at = EXCLUDED.connected_at,
          last_heartbeat = EXCLUDED.last_heartbeat
      `, [agentId, instanceId, 'connected', JSON.stringify(manifest)]);

      // Log connection event
      await fastify.db.query(`
        INSERT INTO agent_logs (
          id, agent_installation_id, timestamp, level, message, context, created_at
        ) VALUES (gen_random_uuid(), $1, NOW(), 'info', $2, $3, NOW())
      `, [
        agentId,
        'Agent connected to protocol',
        JSON.stringify({ instanceId, manifest })
      ]);

      // Emit connection event via WebSocket
      fastify.io.emit('agent-connected', {
        agentId,
        instanceId,
        userId,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        data: {
          sessionId: `${agentId}:${instanceId}`,
          supportedProtocolVersion: '1.0.0',
          endpoints: {
            heartbeat: '/api/agents/protocol/heartbeat',
            dataReceive: '/api/agents/protocol/data/receive',
            dataSend: '/api/agents/protocol/data/send',
            query: '/api/agents/protocol/query'
          }
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }
      
      logger.error('Agent protocol connection failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Connection failed'
      });
    }
  });

  /**
   * Agent Heartbeat
   * POST /api/agents/protocol/heartbeat
   * 
   * Agent sends periodic health status
   */
  fastify.post<{ Body: z.infer<typeof heartbeatSchema> }>('/heartbeat', async (request, reply) => {
    try {
      const { agentId, instanceId, status, metrics, message } = heartbeatSchema.parse(request.body);

      // Verify agent session exists
      const sessionResult = await fastify.db.query(`
        SELECT id FROM agent_sessions 
        WHERE agent_installation_id = $1 AND instance_id = $2
      `, [agentId, instanceId]);

      if (sessionResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent session not found'
        });
      }

      // Update heartbeat timestamp and status
      await fastify.db.query(`
        UPDATE agent_sessions 
        SET last_heartbeat = NOW(), status = $1, metrics = $2
        WHERE agent_installation_id = $3 AND instance_id = $4
      `, [status, JSON.stringify(metrics || {}), agentId, instanceId]);

      // Log health status if not healthy
      if (status !== 'healthy') {
        await fastify.db.query(`
          INSERT INTO agent_logs (
            id, agent_installation_id, timestamp, level, message, context, created_at
          ) VALUES (gen_random_uuid(), $1, NOW(), $2, $3, $4, NOW())
        `, [
          agentId,
          status === 'error' ? 'error' : 'warn',
          message || `Agent status: ${status}`,
          JSON.stringify({ instanceId, status, metrics })
        ]);
      }

      // Update agent metrics if provided
      if (metrics) {
        await fastify.db.query(`
          INSERT INTO agent_metrics (
            id, agent_installation_id, timestamp, calls_processed,
            successful_calls, failed_calls, response_time_ms, cost_cents,
            savings_cents, created_at
          ) VALUES (
            gen_random_uuid(), $1, NOW(), 0, 0, 0, $2, 0, 0, NOW()
          )
        `, [agentId, metrics.responseTime || 0]);
      }

      return reply.send({
        success: true,
        data: {
          acknowledged: true,
          nextHeartbeat: Date.now() + 30000 // 30 seconds
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid heartbeat data',
          details: error.errors
        });
      }
      
      logger.error('Agent heartbeat failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Heartbeat failed'
      });
    }
  });

  /**
   * Receive Data from Agent
   * POST /api/agents/protocol/data/receive
   * 
   * Platform receives data from agent
   */
  fastify.post<{ Body: z.infer<typeof dataReceiveSchema> }>('/data/receive', async (request, reply) => {
    try {
      const { agentId, instanceId, data } = dataReceiveSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Verify agent session
      const sessionResult = await fastify.db.query(`
        SELECT id FROM agent_sessions 
        WHERE agent_installation_id = $1 AND instance_id = $2 AND status = 'connected'
      `, [agentId, instanceId]);

      if (sessionResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent session not found or disconnected'
        });
      }

      // Process data based on type
      let processedData;
      switch (data.type) {
        case 'contact':
          processedData = await processContactData(agentId, userId, data.payload, fastify.db);
          break;
        case 'message':
          processedData = await processMessageData(agentId, userId, data.payload, fastify.db);
          break;
        case 'interaction':
          processedData = await processInteractionData(agentId, userId, data.payload, fastify.db);
          break;
        case 'custom':
          processedData = await processCustomData(agentId, userId, data.payload, fastify.db);
          break;
        default:
          throw new Error(`Unsupported data type: ${data.type}`);
      }

      // Log data reception
      await fastify.db.query(`
        INSERT INTO agent_logs (
          id, agent_installation_id, timestamp, level, message, context, created_at
        ) VALUES (gen_random_uuid(), $1, NOW(), 'info', $2, $3, NOW())
      `, [
        agentId,
        `Received ${data.type} data`,
        JSON.stringify({ instanceId, dataType: data.type, recordId: processedData?.id })
      ]);

      // Emit data received event
      fastify.io.emit('agent-data-received', {
        agentId,
        instanceId,
        dataType: data.type,
        data: processedData,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        data: {
          processed: true,
          recordId: processedData?.id,
          message: `${data.type} data processed successfully`
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid data format',
          details: error.errors
        });
      }
      
      logger.error('Data receive failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Data processing failed'
      });
    }
  });

  /**
   * Send Data to Agent
   * POST /api/agents/protocol/data/send
   * 
   * Platform sends data to agent
   */
  fastify.post<{ Body: z.infer<typeof dataSendSchema> }>('/data/send', async (request, reply) => {
    try {
      const { agentId, instanceId, data } = dataSendSchema.parse(request.body);

      // Verify agent session
      const sessionResult = await fastify.db.query(`
        SELECT id FROM agent_sessions 
        WHERE agent_installation_id = $1 AND instance_id = $2 AND status = 'connected'
      `, [agentId, instanceId]);

      if (sessionResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent session not found or disconnected'
        });
      }

      // Store data for agent pickup (in production, this could use webhooks or WebSocket)
      await fastify.db.query(`
        INSERT INTO agent_data_queue (
          id, agent_installation_id, instance_id, data_type,
          payload, status, created_at, expires_at
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, 'pending', NOW(), NOW() + INTERVAL '1 hour')
      `, [agentId, instanceId, data.type, JSON.stringify(data)]);

      // Emit data send event via WebSocket
      fastify.io.emit(`agent-data-${agentId}-${instanceId}`, {
        type: 'data-send',
        data: data,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        data: {
          queued: true,
          message: `Data queued for agent ${agentId}`
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid send data format',
          details: error.errors
        });
      }
      
      logger.error('Data send failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Data send failed'
      });
    }
  });

  /**
   * Query Agent
   * POST /api/agents/protocol/query
   * 
   * Execute query against agent data
   */
  fastify.post<{ Body: z.infer<typeof querySchema> }>('/query', async (request, reply) => {
    try {
      const { agentId, instanceId, query } = querySchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Verify agent session
      const sessionResult = await fastify.db.query(`
        SELECT id FROM agent_sessions 
        WHERE agent_installation_id = $1 AND instance_id = $2 AND status = 'connected'
      `, [agentId, instanceId]);

      if (sessionResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent session not found or disconnected'
        });
      }

      // Execute query based on type
      let results;
      switch (query.type) {
        case 'leads':
          results = await queryLeads(userId, query.filters, query.limit, query.offset, fastify.db);
          break;
        case 'messages':
          results = await queryMessages(userId, query.filters, query.limit, query.offset, fastify.db);
          break;
        case 'contacts':
          results = await queryContacts(userId, query.filters, query.limit, query.offset, fastify.db);
          break;
        case 'custom':
          results = await queryCustom(agentId, query.filters, query.limit, query.offset, fastify.db);
          break;
        default:
          throw new Error(`Unsupported query type: ${query.type}`);
      }

      return reply.send({
        success: true,
        data: {
          results,
          total: results.length,
          query: query
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid query format',
          details: error.errors
        });
      }
      
      logger.error('Agent query failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Query execution failed'
      });
    }
  });

  /**
   * Disconnect Agent
   * POST /api/agents/protocol/disconnect
   * 
   * Gracefully disconnect agent from platform
   */
  fastify.post<{ Body: { agentId: string, instanceId: string } }>('/disconnect', async (request, reply) => {
    try {
      const { agentId, instanceId } = request.body;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Update session status
      await fastify.db.query(`
        UPDATE agent_sessions 
        SET status = 'disconnected', disconnected_at = NOW()
        WHERE agent_installation_id = $1 AND instance_id = $2
      `, [agentId, instanceId]);

      // Log disconnection
      await fastify.db.query(`
        INSERT INTO agent_logs (
          id, agent_installation_id, timestamp, level, message, context, created_at
        ) VALUES (gen_random_uuid(), $1, NOW(), 'info', $2, $3, NOW())
      `, [
        agentId,
        'Agent disconnected from protocol',
        JSON.stringify({ instanceId })
      ]);

      // Emit disconnection event
      fastify.io.emit('agent-disconnected', {
        agentId,
        instanceId,
        userId,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        data: {
          disconnected: true,
          message: 'Agent disconnected successfully'
        }
      });
    } catch (error) {
      logger.error('Agent disconnect failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Disconnect failed'
      });
    }
  });
}

// Helper functions for data processing
async function processContactData(agentId: string, userId: string, payload: any, db: any) {
  // Insert or update contact data
  const result = await db.query(`
    INSERT INTO leads (id, name, phone, email, source, user_id, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (phone) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      updated_at = NOW()
    RETURNING id
  `, [payload.name, payload.phone, payload.email, `agent:${agentId}`, userId]);
  
  return { id: result.rows[0].id, type: 'contact' };
}

async function processMessageData(agentId: string, userId: string, payload: any, db: any) {
  // Process message data
  const result = await db.query(`
    INSERT INTO messages (id, lead_id, content, direction, message_type, timestamp, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), NOW())
    RETURNING id
  `, [payload.leadId, payload.content, payload.direction || 'INBOUND', payload.type || 'TEXT']);
  
  return { id: result.rows[0].id, type: 'message' };
}

async function processInteractionData(agentId: string, userId: string, payload: any, db: any) {
  // Process interaction data
  const result = await db.query(`
    INSERT INTO interactions (id, lead_id, type, description, completed_at, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
    RETURNING id
  `, [payload.leadId, payload.type, payload.description]);
  
  return { id: result.rows[0].id, type: 'interaction' };
}

async function processCustomData(_agentId: string, _userId: string, _payload: any, _db: any) {
  // Store custom data in agent-specific table or JSON field
  return { id: 'custom', type: 'custom', processed: true };
}

// Helper functions for queries
async function queryLeads(userId: string, filters: any, limit = 50, offset = 0, db: any) {
  const result = await db.query(`
    SELECT * FROM leads 
    WHERE user_id = $1 
    ORDER BY updated_at DESC 
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);
  
  return result.rows;
}

async function queryMessages(userId: string, filters: any, limit = 50, offset = 0, db: any) {
  const result = await db.query(`
    SELECT m.*, l.name as lead_name FROM messages m
    JOIN leads l ON m.lead_id = l.id
    WHERE l.user_id = $1 
    ORDER BY m.timestamp DESC 
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);
  
  return result.rows;
}

async function queryContacts(userId: string, filters: any, limit = 50, offset = 0, db: any) {
  return queryLeads(userId, filters, limit, offset, db);
}

async function queryCustom(agentId: string, filters: any, _limit = 50, _offset = 0, _db: any) {
  // Query agent-specific data for the specified agent
  console.log(`Querying custom data for agent: ${agentId} with filters:`, filters);
  return [];
}

export default agentProtocolRoutes;