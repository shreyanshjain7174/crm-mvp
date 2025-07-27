/**
 * Agent Lifecycle API Routes
 * 
 * Provides REST endpoints for managing AI agents including installation,
 * configuration, monitoring, and lifecycle operations.
 */

// Type definitions are now included via global declaration
import { FastifyPluginAsync } from 'fastify'
import { 
  AgentInstallRequest,
  AgentConfigRequest,
  AgentActionRequest,
  AgentResponse,
  AgentListResponse,
  AgentMetricsResponse,
  AgentLogsResponse
} from '../types/agent-types'
import { agentService } from '../services/agent-service'
import { authenticate } from '../middleware/auth'

const agentRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all agent routes
  fastify.addHook('preHandler', authenticate)

  /**
   * Get all installed agents for business
   * GET /api/agents
   */
  fastify.get<{
    Querystring: { businessId?: string }
    Reply: AgentListResponse
  }>('/', async (request, reply) => {
    const { businessId } = request.query
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    if (!businessId && !userId) {
      return reply.status(400).send({
        success: false,
        error: 'Business ID or authenticated user required'
      })
    }

    try {
      const agents = await agentService.getInstalledAgents(businessId || userId)
      
      return reply.send({
        success: true,
        data: agents,
        meta: {
          total: agents.length,
          businessId: businessId || userId
        }
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch agents')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agents'
      })
    }
  })

  /**
   * Get specific agent details
   * GET /api/agents/:agentId
   */
  fastify.get<{
    Params: { agentId: string }
    Reply: AgentResponse
  }>('/:agentId', async (request, reply) => {
    const { agentId } = request.params
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      const agent = await agentService.getAgent(agentId, userId)
      
      if (!agent) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found'
        })
      }

      return reply.send({
        success: true,
        data: agent
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to fetch agent')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agent'
      })
    }
  })

  /**
   * Install new agent
   * POST /api/agents/install
   */
  fastify.post<{
    Body: AgentInstallRequest
    Reply: AgentResponse
  }>('/install', async (request, reply) => {
    const { agentId, businessId, config } = request.body
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      const installedAgent = await agentService.installAgent({
        agentId,
        businessId: businessId || userId,
        userId: userId!,
        config
      })

      return reply.status(201).send({
        success: true,
        data: installedAgent
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to install agent')
      
      if (error instanceof Error && error.message.includes('already installed')) {
        return reply.status(409).send({
          success: false,
          error: 'Agent already installed'
        })
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to install agent'
      })
    }
  })

  /**
   * Uninstall agent
   * DELETE /api/agents/:agentId
   */
  fastify.delete<{
    Params: { agentId: string }
    Reply: { success: boolean; message?: string; error?: string }
  }>('/:agentId', async (request, reply) => {
    const { agentId } = request.params
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      await agentService.uninstallAgent(agentId, userId!)
      
      return reply.send({
        success: true,
        message: 'Agent uninstalled successfully'
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to uninstall agent')
      return reply.status(500).send({
        success: false,
        error: 'Failed to uninstall agent'
      })
    }
  })

  /**
   * Update agent configuration
   * PUT /api/agents/:agentId/config
   */
  fastify.put<{
    Params: { agentId: string }
    Body: AgentConfigRequest
    Reply: AgentResponse
  }>('/:agentId/config', async (request, reply) => {
    const { agentId } = request.params
    const { config } = request.body
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      const updatedAgent = await agentService.updateAgentConfig(
        agentId,
        userId!,
        config
      )

      return reply.send({
        success: true,
        data: updatedAgent
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to update agent config')
      return reply.status(500).send({
        success: false,
        error: 'Failed to update agent configuration'
      })
    }
  })

  /**
   * Agent lifecycle actions (start/stop/restart)
   * POST /api/agents/:agentId/actions
   */
  fastify.post<{
    Params: { agentId: string }
    Body: AgentActionRequest
    Reply: { success: boolean; message?: string; error?: string }
  }>('/:agentId/actions', async (request, reply) => {
    const { agentId } = request.params
    const { action } = request.body
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      let message: string

      switch (action) {
        case 'start':
          await agentService.startAgent(agentId, userId!)
          message = 'Agent started successfully'
          break
        case 'stop':
          await agentService.stopAgent(agentId, userId!)
          message = 'Agent stopped successfully'
          break
        case 'restart':
          await agentService.restartAgent(agentId, userId!)
          message = 'Agent restarted successfully'
          break
        default:
          return reply.status(400).send({
            success: false,
            error: 'Invalid action. Use start, stop, or restart'
          })
      }

      return reply.send({
        success: true,
        message
      })
    } catch (error) {
      request.log.error({ error, agentId, action }, 'Agent action failed')
      return reply.status(500).send({
        success: false,
        error: `Failed to ${action} agent`
      })
    }
  })

  /**
   * Get agent metrics
   * GET /api/agents/:agentId/metrics
   */
  fastify.get<{
    Params: { agentId: string }
    Querystring: { 
      period?: 'hour' | 'day' | 'week' | 'month'
      from?: string
      to?: string
    }
    Reply: AgentMetricsResponse
  }>('/:agentId/metrics', async (request, reply) => {
    const { agentId } = request.params
    const { period = 'day', from, to } = request.query
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      const metrics = await agentService.getAgentMetrics(agentId, userId!, {
        period,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined
      })

      return reply.send({
        success: true,
        data: metrics
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to fetch agent metrics')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agent metrics'
      })
    }
  })

  /**
   * Get agent logs
   * GET /api/agents/:agentId/logs
   */
  fastify.get<{
    Params: { agentId: string }
    Querystring: {
      level?: 'debug' | 'info' | 'warn' | 'error'
      limit?: number
      offset?: number
      from?: string
      to?: string
    }
    Reply: AgentLogsResponse
  }>('/:agentId/logs', async (request, reply) => {
    const { agentId } = request.params
    const { 
      level, 
      limit = 50, 
      offset = 0, 
      from, 
      to 
    } = request.query
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      const logs = await agentService.getAgentLogs(agentId, userId!, {
        level,
        limit: Math.min(limit, 1000), // Cap at 1000
        offset,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined
      })

      return reply.send({
        success: true,
        data: logs.entries,
        meta: {
          total: logs.total,
          limit,
          offset,
          hasMore: logs.total > offset + limit
        }
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to fetch agent logs')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agent logs'
      })
    }
  })

  /**
   * Get agent health status
   * GET /api/agents/:agentId/health
   */
  fastify.get<{
    Params: { agentId: string }
    Reply: {
      success: boolean
      data?: {
        status: 'healthy' | 'degraded' | 'unhealthy'
        message?: string
        details?: Record<string, any>
        timestamp: string
      }
      error?: string
    }
  }>('/:agentId/health', async (request, reply) => {
    const { agentId } = request.params
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      const health = await agentService.getAgentHealth(agentId, userId!)

      return reply.send({
        success: true,
        data: {
          ...health,
          timestamp: health.timestamp.toISOString()
        }
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to check agent health')
      return reply.status(500).send({
        success: false,
        error: 'Failed to check agent health'
      })
    }
  })

  /**
   * Execute agent action (custom business logic)
   * POST /api/agents/:agentId/execute
   */
  fastify.post<{
    Params: { agentId: string }
    Body: {
      action: string
      data: any
      context?: Record<string, any>
    }
    Reply: {
      success: boolean
      data?: any
      error?: string
    }
  }>('/:agentId/execute', async (request, reply) => {
    const { agentId } = request.params
    const { action, data, context } = request.body
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      const result = await agentService.executeAgentAction(
        agentId,
        userId!,
        action,
        data,
        context
      )

      return reply.send({
        success: true,
        data: result
      })
    } catch (error) {
      request.log.error({ error, agentId, action }, 'Agent execution failed')
      return reply.status(500).send({
        success: false,
        error: 'Agent execution failed'
      })
    }
  })
}

export default agentRoutes