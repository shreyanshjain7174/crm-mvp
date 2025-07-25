/**
 * Agent Runtime API Routes
 * 
 * Provides REST endpoints for agent execution, monitoring, and management
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { agentRuntime, AgentManifest } from '../services/agent-runtime';
import { sandboxManager } from '../services/agent-sandbox';
import { logger } from '../utils/logger';

// Request/Response Schemas
const executeAgentSchema = z.object({
  agentId: z.string().min(1),
  input: z.any().optional(),
  sessionId: z.string().optional(),
  trigger: z.enum(['manual', 'schedule', 'webhook', 'event']).optional()
});

const installAgentSchema = z.object({
  manifest: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string(),
    author: z.string(),
    permissions: z.array(z.object({
      resource: z.string(),
      scope: z.string().optional()
    })),
    resourceLimits: z.object({
      timeout: z.number().min(1000).max(300000), // 1s to 5min
      memory: z.number().min(16).max(256), // 16MB to 256MB
      maxAPICalls: z.number().min(1).max(100) // 1 to 100 calls per minute
    }),
    code: z.string().min(1),
    entryPoint: z.string().optional(),
    triggers: z.array(z.object({
      type: z.enum(['manual', 'schedule', 'webhook', 'event']),
      condition: z.string(),
      description: z.string()
    })).optional()
  })
});

export async function agentRuntimeRoutes(fastify: FastifyInstance) {
  // Apply authentication to all runtime routes
  fastify.addHook('preHandler', authenticate);

  /**
   * Execute an Agent
   * POST /api/agents/runtime/execute
   * 
   * Starts agent execution with provided input data
   */
  fastify.post<{ Body: z.infer<typeof executeAgentSchema> }>('/execute', async (request, reply) => {
    try {
      const { agentId, input, sessionId, trigger } = executeAgentSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const executionId = await agentRuntime.executeAgent(userId, agentId, input, {
        sessionId,
        trigger
      });

      return reply.status(201).send({
        success: true,
        data: {
          executionId,
          status: 'started',
          message: 'Agent execution initiated successfully'
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

      logger.error('Agent execution failed:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Agent execution failed'
      });
    }
  });

  /**
   * Install Agent
   * POST /api/agents/runtime/install
   * 
   * Installs an agent from manifest
   */
  fastify.post<{ Body: z.infer<typeof installAgentSchema> }>('/install', async (request, reply) => {
    try {
      const { manifest } = installAgentSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      await agentRuntime.installAgent(userId, manifest as AgentManifest);

      return reply.status(201).send({
        success: true,
        data: {
          agentId: manifest.id,
          version: manifest.version,
          message: 'Agent installed successfully'
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid manifest data',
          details: error.errors
        });
      }

      logger.error('Agent installation failed:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Agent installation failed'
      });
    }
  });

  /**
   * Get Execution Status
   * GET /api/agents/runtime/executions/:executionId
   * 
   * Returns execution status and details
   */
  fastify.get<{ Params: { executionId: string } }>('/executions/:executionId', async (request, reply) => {
    try {
      const { executionId } = request.params;
      const execution = agentRuntime.getExecution(executionId);

      if (!execution) {
        return reply.status(404).send({
          success: false,
          error: 'Execution not found'
        });
      }

      // Verify user owns this execution
      const userId = (request as any).user?.userId || (request as any).user?.id;
      if (execution.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied'
        });
      }

      return reply.send({
        success: true,
        data: execution
      });

    } catch (error) {
      logger.error('Failed to get execution:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve execution'
      });
    }
  });

  /**
   * Get User Executions
   * GET /api/agents/runtime/executions
   * 
   * Returns list of user's agent executions
   */
  fastify.get<{ Querystring: { limit?: number; agentId?: string } }>('/executions', async (request, reply) => {
    try {
      const { limit = 50, agentId } = request.query;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const executions = await agentRuntime.getUserExecutions(userId, limit);
      
      // Filter by agentId if provided
      const filteredExecutions = agentId 
        ? executions.filter(e => e.agentId === agentId)
        : executions;

      return reply.send({
        success: true,
        data: {
          executions: filteredExecutions,
          total: filteredExecutions.length
        }
      });

    } catch (error) {
      logger.error('Failed to get user executions:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve executions'
      });
    }
  });

  /**
   * Stop Execution
   * POST /api/agents/runtime/executions/:executionId/stop
   * 
   * Stops a running execution
   */
  fastify.post<{ Params: { executionId: string } }>('/executions/:executionId/stop', async (request, reply) => {
    try {
      const { executionId } = request.params;
      const execution = agentRuntime.getExecution(executionId);

      if (!execution) {
        return reply.status(404).send({
          success: false,
          error: 'Execution not found'
        });
      }

      // Verify user owns this execution
      const userId = (request as any).user?.userId || (request as any).user?.id;
      if (execution.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied'
        });
      }

      await agentRuntime.stopExecution(executionId);

      return reply.send({
        success: true,
        data: {
          executionId,
          status: 'stopped',
          message: 'Execution stopped successfully'
        }
      });

    } catch (error) {
      logger.error('Failed to stop execution:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop execution'
      });
    }
  });

  /**
   * Get Runtime Statistics
   * GET /api/agents/runtime/stats
   * 
   * Returns runtime performance and usage statistics
   */
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = agentRuntime.getStats();

      return reply.send({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Failed to get runtime stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  });

  /**
   * Get Sandbox Status
   * GET /api/agents/runtime/sandbox/status
   * 
   * Returns active sandbox information
   */
  fastify.get('/sandbox/status', async (request, reply) => {
    try {
      const activeSandboxCount = sandboxManager.getActiveSandboxCount();

      return reply.send({
        success: true,
        data: { activeSandboxCount }
      });

    } catch (error) {
      logger.error('Failed to get sandbox status:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve sandbox status'
      });
    }
  });

  /**
   * Test Agent Code
   * POST /api/agents/runtime/test
   * 
   * Tests agent code in sandbox without installing
   */
  fastify.post<{ 
    Body: { 
      code: string; 
      input?: any; 
      permissions?: any[];
      resourceLimits?: any;
    } 
  }>('/test', async (request, reply) => {
    try {
      const { code, input = {}, permissions = [], resourceLimits } = request.body;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      if (!code || typeof code !== 'string') {
        return reply.status(400).send({
          success: false,
          error: 'Code is required and must be a string'
        });
      }

      // Use default resource limits for testing
      const defaultLimits = {
        timeout: 30000, // 30 seconds
        memory: 128, // 128MB
        maxAPICalls: 10 // 10 API calls
      };

      const context = {
        userId,
        agentId: 'test_agent',
        sessionId: `test_${Date.now()}`,
        permissions: permissions || [],
        resourceLimits: { ...defaultLimits, ...resourceLimits }
      };

      const sandbox = sandboxManager.createSandbox(context);
      const sandboxId = `${context.agentId}:${context.sessionId}`;

      if (!sandbox) {
        throw new Error('Failed to create test sandbox');
      }

      try {
        const result = await sandbox.execute(code, input);

        return reply.send({
          success: true,
          data: {
            result: result.result,
            error: result.error,
            resourceUsage: result.resourceUsage,
            executionSuccessful: result.success
          }
        });

      } finally {
        // Always cleanup test sandbox
        sandboxManager.destroySandbox(sandboxId);
      }

    } catch (error) {
      logger.error('Agent code test failed:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Code test failed'
      });
    }
  });

  /**
   * Get Agent Execution Logs
   * GET /api/agents/runtime/executions/:executionId/logs
   * 
   * Returns detailed logs for an execution
   */
  fastify.get<{ 
    Params: { executionId: string };
    Querystring: { limit?: number; severity?: string }
  }>('/executions/:executionId/logs', async (request, reply) => {
    try {
      const { executionId } = request.params;
      const { limit = 100, severity } = request.query;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Verify execution exists and user owns it
      const execution = agentRuntime.getExecution(executionId);
      if (!execution || execution.userId !== userId) {
        return reply.status(404).send({
          success: false,
          error: 'Execution not found or access denied'
        });
      }

      // Get logs from database
      let query = `
        SELECT * FROM agent_error_logs 
        WHERE execution_id = $1
      `;
      const params: any[] = [executionId];

      if (severity) {
        query += ` AND severity = $${params.length + 1}`;
        params.push(severity);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(Math.min(limit, 1000)); // Max 1000 logs

      const result = await fastify.db.query(query, params);

      return reply.send({
        success: true,
        data: {
          logs: result.rows,
          total: result.rows.length
        }
      });

    } catch (error) {
      logger.error('Failed to get execution logs:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve logs'
      });
    }
  });

  /**
   * Get Agent Performance Metrics
   * GET /api/agents/runtime/agents/:agentId/metrics
   * 
   * Returns performance metrics for a specific agent
   */
  fastify.get<{ 
    Params: { agentId: string };
    Querystring: { days?: number }
  }>('/agents/:agentId/metrics', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const { days = 7 } = request.query;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      const result = await fastify.db.query(`
        SELECT 
          DATE(recorded_at) as date,
          metric_name,
          AVG(metric_value) as avg_value,
          MAX(metric_value) as max_value,
          MIN(metric_value) as min_value,
          COUNT(*) as count
        FROM agent_performance_metrics apm
        JOIN agent_executions ae ON apm.execution_id = ae.id
        WHERE ae.agent_id = $1 AND ae.user_id = $2 
        AND apm.recorded_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(recorded_at), metric_name
        ORDER BY date DESC, metric_name
      `, [agentId, userId]);

      return reply.send({
        success: true,
        data: {
          metrics: result.rows,
          period: `${days} days`,
          agentId
        }
      });

    } catch (error) {
      logger.error('Failed to get agent metrics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve metrics'
      });
    }
  });
}

export default agentRuntimeRoutes;