/**
 * Agent Monitoring API Routes
 * 
 * Provides endpoints for agent monitoring, health checks, performance metrics,
 * task execution tracking, and alerting.
 */

import { FastifyInstance } from 'fastify'
import { agentMonitoringService } from '../services/agent-monitoring-service'
import { authenticate } from '../middleware/auth'
import { logger } from '../utils/logger'

export async function agentMonitoringRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', authenticate)

    /**
     * Get agent metrics and dashboard data
     */
    fastify.get('/businesses/:businessId/agents/metrics', async (request, reply) => {
      const { businessId } = request.params as { businessId: string }
      const { agentId } = request.query as { agentId?: string }

      try {
        const metrics = await agentMonitoringService.getAgentMetrics(businessId, agentId)
        reply.send({ success: true, data: metrics })
      } catch (error) {
        logger.error('Failed to get agent metrics', { error, businessId, agentId })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to retrieve agent metrics' 
        })
      }
    })

    /**
     * Record agent health check
     */
    fastify.post('/agents/:agentId/health-check', async (request, reply) => {
      const { agentId } = request.params as { agentId: string }
      const healthCheck = request.body as {
        connectivity: 'pass' | 'fail' | 'warning'
        authentication: 'pass' | 'fail' | 'warning'
        dependencies: 'pass' | 'fail' | 'warning'
        performance: 'pass' | 'fail' | 'warning'
        details?: Record<string, any>
      }

      try {
        await agentMonitoringService.recordHealthCheck({
          agentId,
          connectivity: healthCheck.connectivity,
          authentication: healthCheck.authentication,
          dependencies: healthCheck.dependencies,
          performance: healthCheck.performance,
          details: healthCheck.details || {}
        })

        reply.send({ success: true, message: 'Health check recorded' })
      } catch (error) {
        logger.error('Failed to record health check', { error, agentId, healthCheck })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to record health check' 
        })
      }
    })

    /**
     * Record agent performance metrics
     */
    fastify.post('/businesses/:businessId/agents/:agentId/metrics', async (request, reply) => {
      const { businessId, agentId } = request.params as { businessId: string, agentId: string }
      const metrics = request.body as {
        successRate: number
        avgResponseTime: number
        tasksCompleted: number
        tasksPerMinute: number
        errorRate: number
        uptime: number
        resourceUsage: {
          cpuUsage: number
          memoryUsage: number
          concurrentTasks: number
          maxConcurrentTasks: number
        }
      }

      try {
        await agentMonitoringService.recordPerformanceMetrics({
          businessId,
          agentId,
          successRate: metrics.successRate,
          avgResponseTime: metrics.avgResponseTime,
          tasksCompleted: metrics.tasksCompleted,
          tasksPerMinute: metrics.tasksPerMinute,
          errorRate: metrics.errorRate,
          uptime: metrics.uptime,
          resourceUsage: metrics.resourceUsage
        })

        reply.send({ success: true, message: 'Performance metrics recorded' })
      } catch (error) {
        logger.error('Failed to record performance metrics', { error, businessId, agentId, metrics })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to record performance metrics' 
        })
      }
    })

    /**
     * Start task execution tracking
     */
    fastify.post('/businesses/:businessId/agents/:agentId/tasks', async (request, reply) => {
      const { businessId, agentId } = request.params as { businessId: string, agentId: string }
      const task = request.body as {
        taskType: string
        input?: Record<string, any>
        metadata?: Record<string, any>
      }

      try {
        const executionId = await agentMonitoringService.startTaskExecution({
          businessId,
          agentId,
          taskType: task.taskType,
          input: task.input,
          metadata: task.metadata
        })

        reply.send({ 
          success: true, 
          data: { executionId },
          message: 'Task execution started' 
        })
      } catch (error) {
        logger.error('Failed to start task execution', { error, businessId, agentId, task })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to start task execution' 
        })
      }
    })

    /**
     * Complete task execution
     */
    fastify.put('/tasks/:executionId/complete', async (request, reply) => {
      const { executionId } = request.params as { executionId: string }
      const result = request.body as {
        status: 'completed' | 'failed'
        output?: Record<string, any>
        error?: string
      }

      try {
        await agentMonitoringService.completeTaskExecution(executionId, result)
        reply.send({ success: true, message: 'Task execution completed' })
      } catch (error) {
        logger.error('Failed to complete task execution', { error, executionId, result })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to complete task execution' 
        })
      }
    })

    /**
     * Get recent task executions
     */
    fastify.get('/businesses/:businessId/agents/tasks', async (request, reply) => {
      const { businessId } = request.params as { businessId: string }
      const { limit = 50 } = request.query as { limit?: number }

      try {
        const tasks = await agentMonitoringService.getRecentTaskExecutions(
          businessId, 
          Math.min(limit, 100)
        )
        reply.send({ success: true, data: tasks })
      } catch (error) {
        logger.error('Failed to get recent task executions', { error, businessId })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to retrieve task executions' 
        })
      }
    })

    /**
     * Get agent alerts
     */
    fastify.get('/businesses/:businessId/agents/alerts', async (request, reply) => {
      const { businessId } = request.params as { businessId: string }
      const { resolved = false } = request.query as { resolved?: boolean }

      try {
        const alerts = await agentMonitoringService.getAgentAlerts(businessId, resolved)
        reply.send({ success: true, data: alerts })
      } catch (error) {
        logger.error('Failed to get agent alerts', { error, businessId })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to retrieve agent alerts' 
        })
      }
    })

    /**
     * Resolve alert
     */
    fastify.put('/alerts/:alertId/resolve', async (request, reply) => {
      const { alertId } = request.params as { alertId: string }

      try {
        await agentMonitoringService.resolveAlert(alertId)
        reply.send({ success: true, message: 'Alert resolved' })
      } catch (error) {
        logger.error('Failed to resolve alert', { error, alertId })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to resolve alert' 
        })
      }
    })

    /**
     * Get performance trends
     */
    fastify.get('/businesses/:businessId/agents/:agentId/trends', async (request, reply) => {
      const { businessId, agentId } = request.params as { businessId: string, agentId: string }
      const { hours = 24 } = request.query as { hours?: number }

      try {
        const trends = await agentMonitoringService.getPerformanceTrends(
          businessId, 
          agentId, 
          Math.min(hours, 168) // Max 1 week
        )
        reply.send({ success: true, data: trends })
      } catch (error) {
        logger.error('Failed to get performance trends', { error, businessId, agentId })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to retrieve performance trends' 
        })
      }
    })

    /**
     * Agent monitoring webhook for external systems
     */
    fastify.post('/webhooks/agent-monitoring', async (request, reply) => {
      const webhook = request.body as {
        agentId: string
        eventType: 'health_check' | 'performance_metrics' | 'task_started' | 'task_completed' | 'task_failed'
        data: Record<string, any>
        timestamp?: string
      }

      try {
        // Process webhook based on event type
        switch (webhook.eventType) {
          case 'health_check':
            await agentMonitoringService.recordHealthCheck({
              agentId: webhook.agentId,
              connectivity: webhook.data.connectivity || 'pass',
              authentication: webhook.data.authentication || 'pass', 
              dependencies: webhook.data.dependencies || 'pass',
              performance: webhook.data.performance || 'pass',
              details: webhook.data.details || {}
            })
            break
          
          case 'performance_metrics':
            await agentMonitoringService.recordPerformanceMetrics({
              agentId: webhook.agentId,
              businessId: webhook.data.businessId,
              successRate: webhook.data.successRate || 0,
              avgResponseTime: webhook.data.avgResponseTime || 0,
              tasksCompleted: webhook.data.tasksCompleted || 0,
              tasksPerMinute: webhook.data.tasksPerMinute || 0,
              errorRate: webhook.data.errorRate || 0,
              uptime: webhook.data.uptime || 0,
              resourceUsage: webhook.data.resourceUsage || {}
            })
            break
          
          case 'task_started':
            await agentMonitoringService.startTaskExecution({
              agentId: webhook.agentId,
              businessId: webhook.data.businessId,
              taskType: webhook.data.taskType,
              input: webhook.data.input,
              metadata: webhook.data.metadata
            })
            break
          
          case 'task_completed':
          case 'task_failed':
            if (webhook.data.executionId) {
              await agentMonitoringService.completeTaskExecution(
                webhook.data.executionId,
                {
                  status: webhook.eventType === 'task_completed' ? 'completed' : 'failed',
                  output: webhook.data.output,
                  error: webhook.data.error
                }
              )
            }
            break
        }

        reply.send({ success: true, message: 'Webhook processed' })
      } catch (error) {
        logger.error('Failed to process monitoring webhook', { error, webhook })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to process webhook' 
        })
      }
    })

    /**
     * Get agent monitoring dashboard summary
     */
    fastify.get('/businesses/:businessId/agents/monitoring/summary', async (request, reply) => {
      const { businessId } = request.params as { businessId: string }

      try {
        const [agents, tasks, alerts] = await Promise.all([
          agentMonitoringService.getAgentMetrics(businessId),
          agentMonitoringService.getRecentTaskExecutions(businessId, 10),
          agentMonitoringService.getAgentAlerts(businessId, false)
        ])

        const summary = {
          totalAgents: agents.length,
          activeAgents: agents.filter((a: any) => a.status === 'active').length,
          avgSuccessRate: agents.length > 0 
            ? agents.reduce((sum: number, a: any) => sum + (a.performance?.successRate || 0), 0) / agents.length
            : 0,
          totalTasksToday: tasks.filter(t => 
            new Date(t.startTime).toDateString() === new Date().toDateString()
          ).length,
          activeAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
          recentTasks: tasks.slice(0, 5),
          topAlerts: alerts.slice(0, 3)
        }

        reply.send({ success: true, data: summary })
      } catch (error) {
        logger.error('Failed to get monitoring summary', { error, businessId })
        reply.status(500).send({ 
          success: false, 
          error: 'Failed to retrieve monitoring summary' 
        })
      }
    })
  })
}