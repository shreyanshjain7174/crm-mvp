/**
 * Agent Monitoring Service
 * 
 * Provides real-time monitoring, health checks, and performance analytics
 * for AI agents. Tracks metrics like success rates, response times, 
 * resource usage, and task execution patterns.
 */

import { db } from '../db/index'
import { logger } from '../utils/logger'

export interface AgentHealthCheck {
  agentId: string
  timestamp: Date
  connectivity: 'pass' | 'fail' | 'warning'
  authentication: 'pass' | 'fail' | 'warning'
  dependencies: 'pass' | 'fail' | 'warning'
  performance: 'pass' | 'fail' | 'warning'
  details: Record<string, any>
}

export interface AgentPerformanceMetrics {
  agentId: string
  businessId: string
  timestamp: Date
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

export interface TaskExecution {
  id: string
  businessId: string
  agentId: string
  taskType: string
  status: 'running' | 'completed' | 'failed' | 'queued'
  startTime: Date
  endTime?: Date
  duration?: number
  input?: Record<string, any>
  output?: Record<string, any>
  error?: string
  metadata?: Record<string, any>
}

export interface AgentAlert {
  id: string
  businessId: string
  agentId: string
  alertType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: Record<string, any>
  resolved: boolean
  createdAt: Date
  resolvedAt?: Date
}

class AgentMonitoringService {
  /**
   * Record agent health check results
   */
  async recordHealthCheck(healthCheck: Omit<AgentHealthCheck, 'timestamp'>): Promise<void> {
    try {
      await db.query(`
        INSERT INTO agent_health_checks (
          agent_id, connectivity, authentication, dependencies, performance, details
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        healthCheck.agentId,
        healthCheck.connectivity,
        healthCheck.authentication,
        healthCheck.dependencies,
        healthCheck.performance,
        JSON.stringify(healthCheck.details)
      ])

      // Check if we need to create alerts based on health check results
      await this.checkHealthAlerts(healthCheck)

      logger.info('Agent health check recorded', { agentId: healthCheck.agentId })
    } catch (error) {
      logger.error('Failed to record health check', { error, healthCheck })
      throw error
    }
  }

  /**
   * Record performance metrics
   */
  async recordPerformanceMetrics(metrics: Omit<AgentPerformanceMetrics, 'timestamp'>): Promise<void> {
    try {
      await db.query(`
        INSERT INTO agent_performance_metrics (
          agent_id, business_id, success_rate, avg_response_time, tasks_completed,
          tasks_per_minute, error_rate, uptime, resource_usage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        metrics.agentId,
        metrics.businessId,
        metrics.successRate,
        metrics.avgResponseTime,
        metrics.tasksCompleted,
        metrics.tasksPerMinute,
        metrics.errorRate,
        metrics.uptime,
        JSON.stringify(metrics.resourceUsage)
      ])

      // Check for performance-based alerts
      await this.checkPerformanceAlerts(metrics)

      logger.debug('Performance metrics recorded', { 
        agentId: metrics.agentId, 
        successRate: metrics.successRate,
        avgResponseTime: metrics.avgResponseTime
      })
    } catch (error) {
      logger.error('Failed to record performance metrics', { error, metrics })
      throw error
    }
  }

  /**
   * Start task execution tracking
   */
  async startTaskExecution(execution: Omit<TaskExecution, 'id' | 'startTime' | 'status'>): Promise<string> {
    try {
      const result = await db.query(`
        INSERT INTO agent_task_executions (
          business_id, agent_id, task_type, status, input, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        execution.businessId,
        execution.agentId,
        execution.taskType,
        'running',
        JSON.stringify(execution.input || {}),
        JSON.stringify(execution.metadata || {})
      ])

      const executionId = result.rows[0].id
      logger.info('Task execution started', { 
        executionId, 
        agentId: execution.agentId, 
        taskType: execution.taskType 
      })

      return executionId
    } catch (error) {
      logger.error('Failed to start task execution', { error, execution })
      throw error
    }
  }

  /**
   * Complete task execution tracking
   */
  async completeTaskExecution(
    executionId: string, 
    result: { 
      status: 'completed' | 'failed'
      output?: Record<string, any>
      error?: string 
    }
  ): Promise<void> {
    try {
      const now = new Date()
      
      // Get start time to calculate duration
      const executionResult = await db.query(`
        SELECT start_time FROM agent_task_executions WHERE id = $1
      `, [executionId])

      if (executionResult.rows.length === 0) {
        throw new Error(`Task execution not found: ${executionId}`)
      }

      const startTime = new Date(executionResult.rows[0].start_time)
      const duration = now.getTime() - startTime.getTime()

      await db.query(`
        UPDATE agent_task_executions 
        SET status = $1, end_time = $2, duration = $3, output = $4, error = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [
        result.status,
        now,
        duration,
        JSON.stringify(result.output || {}),
        result.error,
        executionId
      ])

      logger.info('Task execution completed', { 
        executionId, 
        status: result.status,
        duration
      })
    } catch (error) {
      logger.error('Failed to complete task execution', { error, executionId, result })
      throw error
    }
  }

  /**
   * Get agent monitoring dashboard data
   */
  async getAgentMetrics(businessId: string, agentId?: string): Promise<any[]> {
    try {
      const whereClause = agentId ? 'AND ai.agent_id = $2' : ''
      const params = agentId ? [businessId, agentId] : [businessId]

      const result = await db.query(`
        SELECT 
          ai.agent_id,
          ai.agent_name,
          ai.agent_provider,
          ai.status,
          COALESCE(latest_health.connectivity, 'fail') as connectivity,
          COALESCE(latest_health.authentication, 'fail') as authentication,
          COALESCE(latest_health.dependencies, 'fail') as dependencies,
          COALESCE(latest_health.performance, 'fail') as performance,
          COALESCE(latest_metrics.success_rate, 0) as success_rate,
          COALESCE(latest_metrics.avg_response_time, 0) as avg_response_time,
          COALESCE(latest_metrics.tasks_completed, 0) as tasks_completed,
          COALESCE(latest_metrics.tasks_per_minute, 0) as tasks_per_minute,
          COALESCE(latest_metrics.error_rate, 0) as error_rate,
          COALESCE(latest_metrics.uptime, 0) as uptime,
          COALESCE(latest_metrics.resource_usage, '{}') as resource_usage,
          COALESCE(task_counts.running_tasks, 0) as running_tasks,
          latest_health.created_at as last_health_check
        FROM agent_installations ai
        LEFT JOIN LATERAL (
          SELECT * FROM agent_health_checks ahc 
          WHERE ahc.agent_id = ai.agent_id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) latest_health ON true
        LEFT JOIN LATERAL (
          SELECT * FROM agent_performance_metrics apm
          WHERE apm.agent_id = ai.agent_id AND apm.business_id = ai.business_id
          ORDER BY created_at DESC
          LIMIT 1
        ) latest_metrics ON true
        LEFT JOIN (
          SELECT agent_id, COUNT(*) as running_tasks
          FROM agent_task_executions
          WHERE status = 'running' AND business_id = $1
          GROUP BY agent_id
        ) task_counts ON task_counts.agent_id = ai.agent_id
        WHERE ai.business_id = $1 ${whereClause}
        ORDER BY ai.agent_name
      `, params)

      return result.rows.map(row => ({
        id: row.agent_id,
        name: row.agent_name,
        provider: row.agent_provider,
        status: row.status,
        performance: {
          successRate: parseFloat(row.success_rate || '0'),
          avgResponseTime: parseInt(row.avg_response_time || '0'),
          tasksCompleted: parseInt(row.tasks_completed || '0'),
          tasksPerMinute: parseFloat(row.tasks_per_minute || '0'),
          errorRate: parseFloat(row.error_rate || '0'),
          uptime: parseFloat(row.uptime || '0')
        },
        resources: {
          ...JSON.parse(row.resource_usage || '{}'),
          concurrentTasks: parseInt(row.running_tasks || '0')
        },
        healthChecks: {
          connectivity: row.connectivity,
          authentication: row.authentication,
          dependencies: row.dependencies,
          performance: row.performance
        },
        lastHealthCheck: row.last_health_check
      }))
    } catch (error) {
      logger.error('Failed to get agent metrics', { error, businessId, agentId })
      throw error
    }
  }

  /**
   * Get recent task executions
   */
  async getRecentTaskExecutions(businessId: string, limit: number = 50): Promise<TaskExecution[]> {
    try {
      const result = await db.query(`
        SELECT 
          ate.*,
          ai.agent_name
        FROM agent_task_executions ate
        JOIN agent_installations ai ON ai.agent_id = ate.agent_id AND ai.business_id = ate.business_id
        WHERE ate.business_id = $1
        ORDER BY ate.start_time DESC
        LIMIT $2
      `, [businessId, limit])

      return result.rows.map(row => ({
        id: row.id,
        businessId: row.business_id,
        agentId: row.agent_id,
        agentName: row.agent_name,
        taskType: row.task_type,
        status: row.status,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration,
        input: row.input ? JSON.parse(row.input) : undefined,
        output: row.output ? JSON.parse(row.output) : undefined,
        error: row.error,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      }))
    } catch (error) {
      logger.error('Failed to get recent task executions', { error, businessId })
      throw error
    }
  }

  /**
   * Get agent alerts
   */
  async getAgentAlerts(businessId: string, resolved: boolean = false): Promise<AgentAlert[]> {
    try {
      const result = await db.query(`
        SELECT * FROM agent_alerts 
        WHERE business_id = $1 AND resolved = $2
        ORDER BY created_at DESC
        LIMIT 100
      `, [businessId, resolved])

      return result.rows.map(row => ({
        id: row.id,
        businessId: row.business_id,
        agentId: row.agent_id,
        alertType: row.alert_type,
        severity: row.severity,
        message: row.message,
        details: JSON.parse(row.details || '{}'),
        resolved: row.resolved,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at
      }))
    } catch (error) {
      logger.error('Failed to get agent alerts', { error, businessId })
      throw error
    }
  }

  /**
   * Check health-based alerts
   */
  private async checkHealthAlerts(healthCheck: Omit<AgentHealthCheck, 'timestamp'>): Promise<void> {
    const criticalChecks = ['connectivity', 'authentication']
    const failedChecks = Object.entries(healthCheck)
      .filter(([key, value]) => criticalChecks.includes(key) && value === 'fail')

    for (const [checkType] of failedChecks) {
      await this.createAlert({
        agentId: healthCheck.agentId,
        alertType: 'health_check_failure',
        severity: 'critical',
        message: `Agent health check failed: ${checkType}`,
        details: { checkType, healthCheck }
      })
    }
  }

  /**
   * Check performance-based alerts
   */
  private async checkPerformanceAlerts(metrics: Omit<AgentPerformanceMetrics, 'timestamp'>): Promise<void> {
    // Alert on low success rate
    if (metrics.successRate < 80) {
      await this.createAlert({
        agentId: metrics.agentId,
        alertType: 'low_success_rate',
        severity: metrics.successRate < 60 ? 'critical' : 'high',
        message: `Agent success rate dropped to ${metrics.successRate}%`,
        details: { successRate: metrics.successRate, threshold: 80 }
      })
    }

    // Alert on high response time
    if (metrics.avgResponseTime > 5000) {
      await this.createAlert({
        agentId: metrics.agentId,
        alertType: 'high_response_time',
        severity: metrics.avgResponseTime > 10000 ? 'critical' : 'medium',
        message: `Agent response time elevated to ${metrics.avgResponseTime}ms`,
        details: { avgResponseTime: metrics.avgResponseTime, threshold: 5000 }
      })
    }
  }

  /**
   * Create alert
   */
  private async createAlert(alert: {
    agentId: string
    alertType: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    details: Record<string, any>
  }): Promise<void> {
    // Check for duplicate alerts in the last hour
    const existing = await db.query(`
      SELECT id FROM agent_alerts 
      WHERE agent_id = $1 AND alert_type = $2 AND resolved = false
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    `, [alert.agentId, alert.alertType])

    if (existing.rows.length > 0) {
      logger.debug('Duplicate alert suppressed', { agentId: alert.agentId, alertType: alert.alertType })
      return
    }

    // Get business ID from agent installation
    const agentResult = await db.query(`
      SELECT business_id FROM agent_installations WHERE agent_id = $1
    `, [alert.agentId])

    if (agentResult.rows.length === 0) return

    const businessId = agentResult.rows[0].business_id

    await db.query(`
      INSERT INTO agent_alerts (
        business_id, agent_id, alert_type, severity, message, details
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      businessId,
      alert.agentId,
      alert.alertType,
      alert.severity,
      alert.message,
      JSON.stringify(alert.details)
    ])

    logger.info('Agent alert created', {
      businessId,
      agentId: alert.agentId,
      alertType: alert.alertType,
      severity: alert.severity
    })
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await db.query(`
        UPDATE agent_alerts 
        SET resolved = true, resolved_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [alertId])

      logger.info('Agent alert resolved', { alertId })
    } catch (error) {
      logger.error('Failed to resolve alert', { error, alertId })
      throw error
    }
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    businessId: string, 
    agentId: string, 
    hours: number = 24
  ): Promise<any[]> {
    try {
      const result = await db.query(`
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          AVG(success_rate) as avg_success_rate,
          AVG(avg_response_time) as avg_response_time,
          AVG(tasks_per_minute) as avg_tasks_per_minute,
          AVG(error_rate) as avg_error_rate
        FROM agent_performance_metrics
        WHERE business_id = $1 AND agent_id = $2
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
        GROUP BY hour
        ORDER BY hour DESC
      `, [businessId, agentId])

      return result.rows
    } catch (error) {
      logger.error('Failed to get performance trends', { error, businessId, agentId })
      throw error
    }
  }
}

export const agentMonitoringService = new AgentMonitoringService()