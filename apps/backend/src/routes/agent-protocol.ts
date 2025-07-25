import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { agentService } from '../services/agent-service';
import { AgentDataProcessor } from '../services/agent-data-processor';
import { logger } from '../utils/logger';

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

const heartbeatSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  status: z.enum(['healthy', 'degraded', 'error']),
  metrics: z.object({
    cpuUsage: z.number(),
    memoryUsage: z.number(),
    requestCount: z.number(),
    errorRate: z.number()
  }).optional(),
  message: z.string().optional()
});

const dataReceiveSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  data: z.object({
    type: z.enum(['contact', 'message', 'interaction', 'custom']),
    payload: z.any()
  })
});

const dataSendSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  data: z.any()
});

const querySchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  query: z.object({
    type: z.enum(['leads', 'messages', 'contacts', 'custom']),
    filters: z.any().optional(),
    limit: z.number().optional(),
    offset: z.number().optional()
  })
});

export default async function agentProtocolRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  
  const dataProcessor = new AgentDataProcessor(fastify.db);

  fastify.post<{ Body: z.infer<typeof agentConnectSchema> }>('/connect', async (request, reply) => {
    try {
      const { agentId, instanceId, apiKey, manifest } = agentConnectSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const agent = await agentService.getAgent(agentId, userId);
      if (!agent) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found or access denied'
        });
      }

      const sessionResult = await fastify.db.query(`
        INSERT INTO agent_sessions (agent_installation_id, instance_id, status, connected_at, last_heartbeat, session_data)
        VALUES ($1, $2, 'connected', NOW(), NOW(), $3)
        ON CONFLICT (agent_installation_id, instance_id) 
        DO UPDATE SET status = 'connected', connected_at = NOW(), last_heartbeat = NOW(), session_data = $3
        RETURNING id
      `, [agentId, instanceId, JSON.stringify({ manifest, apiKey: apiKey.substring(0, 8) + '...' })]);

      fastify.io.emit('agent-connected', {
        agentId,
        instanceId,
        userId,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        sessionId: sessionResult.rows[0].id,
        message: 'Agent connected successfully'
      });
    } catch (error) {
      logger.error('Agent connection failed:', error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid connection parameters'
      });
    }
  });

  fastify.post<{ Body: z.infer<typeof heartbeatSchema> }>('/heartbeat', async (request, reply) => {
    try {
      const { agentId, instanceId, status, metrics, message } = heartbeatSchema.parse(request.body);

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

      await fastify.db.query(`
        UPDATE agent_sessions 
        SET last_heartbeat = NOW(), status = $3, session_data = session_data || $4
        WHERE agent_installation_id = $1 AND instance_id = $2
      `, [agentId, instanceId, status, JSON.stringify({ metrics, message })]);

      return reply.send({ success: true });
    } catch (error) {
      logger.error('Heartbeat processing failed:', error);
      return reply.status(400).send({
        success: false,
        error: 'Invalid heartbeat data'
      });
    }
  });

  fastify.post<{ Body: z.infer<typeof dataReceiveSchema> }>('/data/receive', async (request, reply) => {
    try {
      const { agentId, instanceId, data } = dataReceiveSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const sessionResult = await fastify.db.query(`
        SELECT id FROM agent_sessions 
        WHERE agent_installation_id = $1 AND instance_id = $2 AND status = 'connected'
      `, [agentId, instanceId]);

      if (sessionResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Active agent session not found'
        });
      }

      let processedData;
      switch (data.type) {
        case 'contact':
          processedData = await dataProcessor.processContactData(agentId, userId, data.payload);
          break;
        case 'message':
          processedData = await dataProcessor.processMessageData(agentId, userId, data.payload);
          break;
        case 'interaction':
          processedData = await dataProcessor.processInteractionData(agentId, userId, data.payload);
          break;
        case 'custom':
          processedData = await dataProcessor.processCustomData(agentId, userId, data.payload);
          break;
        default:
          throw new Error(`Unsupported data type: ${data.type}`);
      }

      await fastify.db.query(`
        INSERT INTO agent_data_logs (agent_installation_id, instance_id, data_type, data_id, processed_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [agentId, instanceId, data.type, processedData.id]);

      return reply.send({
        success: true,
        processedData
      });
    } catch (error) {
      logger.error('Data processing failed:', error);
      return reply.status(400).send({
        success: false,
        error: 'Data processing failed'
      });
    }
  });

  fastify.post<{ Body: z.infer<typeof dataSendSchema> }>('/data/send', async (request, reply) => {
    try {
      const { agentId, instanceId, data } = dataSendSchema.parse(request.body);

      const sessionResult = await fastify.db.query(`
        SELECT id FROM agent_sessions 
        WHERE agent_installation_id = $1 AND instance_id = $2 AND status = 'connected'
      `, [agentId, instanceId]);

      if (sessionResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Active agent session not found'
        });
      }

      fastify.io.to(`agent:${instanceId}`).emit('agent-data', {
        agentId,
        instanceId,
        data,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        message: 'Data sent to agent'
      });
    } catch (error) {
      logger.error('Data sending failed:', error);
      return reply.status(400).send({
        success: false,
        error: 'Data sending failed'
      });
    }
  });

  fastify.post<{ Body: z.infer<typeof querySchema> }>('/query', async (request, reply) => {
    try {
      const { agentId, instanceId, query } = querySchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const sessionResult = await fastify.db.query(`
        SELECT id FROM agent_sessions 
        WHERE agent_installation_id = $1 AND instance_id = $2 AND status = 'connected'
      `, [agentId, instanceId]);

      if (sessionResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Active agent session not found'
        });
      }

      let results;
      switch (query.type) {
        case 'leads':
          results = await dataProcessor.queryLeads(userId, query.filters, query.limit, query.offset);
          break;
        case 'messages':
          results = await dataProcessor.queryMessages(userId, query.filters, query.limit, query.offset);
          break;
        case 'contacts':
          results = await dataProcessor.queryContacts(userId, query.filters, query.limit, query.offset);
          break;
        case 'custom':
          results = await dataProcessor.queryCustom(agentId, query.filters, query.limit, query.offset);
          break;
        default:
          throw new Error(`Unsupported query type: ${query.type}`);
      }

      return reply.send({
        success: true,
        results,
        count: results.length
      });
    } catch (error) {
      logger.error('Query execution failed:', error);
      return reply.status(400).send({
        success: false,
        error: 'Query execution failed'
      });
    }
  });

  fastify.post<{ Body: { agentId: string, instanceId: string } }>('/disconnect', async (request, reply) => {
    try {
      const { agentId, instanceId } = request.body;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      await fastify.db.query(`
        UPDATE agent_sessions 
        SET status = 'disconnected', disconnected_at = NOW()
        WHERE agent_installation_id = $1 AND instance_id = $2
      `, [agentId, instanceId]);

      fastify.io.emit('agent-disconnected', {
        agentId,
        instanceId,
        userId,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        message: 'Agent disconnected successfully'
      });
    } catch (error) {
      logger.error('Agent disconnection failed:', error);
      return reply.status(400).send({
        success: false,
        error: 'Disconnection failed'
      });
    }
  });
}