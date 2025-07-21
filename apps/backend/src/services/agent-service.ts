/**
 * Agent Service
 * 
 * Core business logic for managing AI agents including installation,
 * configuration, monitoring, and lifecycle operations.
 */

import { 
  InstalledAgent,
  AgentInstallOptions,
  AgentMetrics,
  AgentMetricsOptions,
  AgentLogEntry,
  AgentLogsOptions,
  AgentLogsResult,
  AgentHealthCheck,
  AgentInstallationRecord,
  AgentMetricsRecord,
  AgentLogRecord,
  AgentError,
  AgentNotFoundError,
  AgentAlreadyInstalledError,
  AgentInstallationError,
  HealthCheckItem
} from '../types/agent-types'
import { db } from '../db'
import { socketService } from './socket-service'
import { v4 as uuidv4 } from 'uuid'

class AgentService {
  /**
   * Get all installed agents for a business/user
   */
  async getInstalledAgents(businessId: string): Promise<InstalledAgent[]> {
    const query = `
      SELECT 
        id,
        agent_id,
        name,
        provider,
        version,
        status,
        business_id,
        user_id,
        config,
        installed_at,
        updated_at,
        metadata,
        (
          SELECT timestamp 
          FROM agent_logs 
          WHERE agent_installation_id = ai.id 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) as last_activity
      FROM agent_installations ai
      WHERE business_id = $1
      ORDER BY installed_at DESC
    `

    const result = await db.query<AgentInstallationRecord & { last_activity?: Date }>(
      query, 
      [businessId]
    )

    return result.rows.map(this.mapToInstalledAgent)
  }

  /**
   * Get specific agent by ID
   */
  async getAgent(agentId: string, userId: string): Promise<InstalledAgent | null> {
    const query = `
      SELECT 
        ai.*,
        (
          SELECT timestamp 
          FROM agent_logs 
          WHERE agent_installation_id = ai.id 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) as last_activity
      FROM agent_installations ai
      WHERE ai.id = $1 AND (ai.user_id = $2 OR ai.business_id = $2)
    `

    const result = await db.query<AgentInstallationRecord & { last_activity?: Date }>(
      query, 
      [agentId, userId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapToInstalledAgent(result.rows[0])
  }

  /**
   * Install a new agent
   */
  async installAgent(options: AgentInstallOptions): Promise<InstalledAgent> {
    const { agentId, businessId, userId, config = {} } = options

    // Check if agent is already installed
    const existingQuery = `
      SELECT id FROM agent_installations 
      WHERE agent_id = $1 AND business_id = $2
    `
    const existing = await db.query(existingQuery, [agentId, businessId])
    
    if (existing.rows.length > 0) {
      throw new AgentAlreadyInstalledError(agentId, businessId)
    }

    // Get agent metadata from marketplace (mock for now)
    const agentMetadata = await this.getAgentMetadata(agentId)
    
    if (!agentMetadata) {
      throw new AgentInstallationError(agentId, 'Agent not found in marketplace')
    }

    const installationId = uuidv4()
    const now = new Date()

    try {
      // Insert agent installation record
      const insertQuery = `
        INSERT INTO agent_installations (
          id, agent_id, name, provider, version, 
          business_id, user_id, status, config, 
          installed_at, updated_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `

      const result = await db.query<AgentInstallationRecord>(insertQuery, [
        installationId,
        agentId,
        agentMetadata.name,
        agentMetadata.provider,
        agentMetadata.version,
        businessId,
        userId,
        'installing',
        JSON.stringify(config),
        now,
        now,
        JSON.stringify(agentMetadata)
      ])

      const installation = result.rows[0]

      // Initialize agent (simulate async installation)
      this.initializeAgent(installation).catch(error => {
        console.error('Agent initialization failed:', error)
      })

      // Emit installation event
      socketService.emitToUser(userId, 'agent-installed', {
        agentId: installationId,
        status: 'installing'
      })

      return this.mapToInstalledAgent(installation)
    } catch (error) {
      throw new AgentInstallationError(
        agentId,
        'Database insertion failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Uninstall an agent
   */
  async uninstallAgent(agentId: string, userId: string): Promise<void> {
    const agent = await this.getAgent(agentId, userId)
    if (!agent) {
      throw new AgentNotFoundError(agentId)
    }

    // Stop agent if running
    if (agent.status === 'running') {
      await this.stopAgent(agentId, userId)
    }

    // Delete agent installation and related data
    await db.query('BEGIN')
    
    try {
      // Delete logs
      await db.query(
        'DELETE FROM agent_logs WHERE agent_installation_id = $1',
        [agentId]
      )

      // Delete metrics
      await db.query(
        'DELETE FROM agent_metrics WHERE agent_installation_id = $1',
        [agentId]
      )

      // Delete installation
      await db.query(
        'DELETE FROM agent_installations WHERE id = $1',
        [agentId]
      )

      await db.query('COMMIT')

      // Emit uninstallation event
      socketService.emitToUser(userId, 'agent-uninstalled', {
        agentId
      })
    } catch (error) {
      await db.query('ROLLBACK')
      throw new AgentError(
        'Failed to uninstall agent',
        'UNINSTALL_ERROR',
        agentId,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgentConfig(
    agentId: string, 
    userId: string, 
    config: Record<string, any>
  ): Promise<InstalledAgent> {
    const agent = await this.getAgent(agentId, userId)
    if (!agent) {
      throw new AgentNotFoundError(agentId)
    }

    const updateQuery = `
      UPDATE agent_installations 
      SET config = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `

    const result = await db.query<AgentInstallationRecord>(updateQuery, [
      JSON.stringify(config),
      new Date(),
      agentId
    ])

    const updatedAgent = this.mapToInstalledAgent(result.rows[0])

    // Emit config update event
    socketService.emitToUser(userId, 'agent-config-updated', {
      agentId,
      config
    })

    return updatedAgent
  }

  /**
   * Start an agent
   */
  async startAgent(agentId: string, userId: string): Promise<void> {
    await this.updateAgentStatus(agentId, userId, 'running')
    await this.logAgentActivity(agentId, 'info', 'Agent started by user')

    socketService.emitToUser(userId, 'agent-status-changed', {
      agentId,
      status: 'running',
      timestamp: new Date()
    })
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId: string, userId: string): Promise<void> {
    await this.updateAgentStatus(agentId, userId, 'stopped')
    await this.logAgentActivity(agentId, 'info', 'Agent stopped by user')

    socketService.emitToUser(userId, 'agent-status-changed', {
      agentId,
      status: 'stopped',
      timestamp: new Date()
    })
  }

  /**
   * Restart an agent
   */
  async restartAgent(agentId: string, userId: string): Promise<void> {
    await this.stopAgent(agentId, userId)
    
    // Wait a moment before starting
    setTimeout(async () => {
      await this.startAgent(agentId, userId)
    }, 1000)
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(
    agentId: string, 
    userId: string, 
    options: AgentMetricsOptions
  ): Promise<AgentMetrics> {
    const agent = await this.getAgent(agentId, userId)
    if (!agent) {
      throw new AgentNotFoundError(agentId)
    }

    const { period, from, to } = options
    const timeRange = this.getTimeRange(period, from, to)

    const query = `
      SELECT 
        timestamp,
        calls_processed,
        successful_calls,
        failed_calls,
        response_time_ms,
        cost_cents,
        savings_cents
      FROM agent_metrics
      WHERE agent_installation_id = $1 
        AND timestamp >= $2 
        AND timestamp <= $3
      ORDER BY timestamp ASC
    `

    const result = await db.query<AgentMetricsRecord>(query, [
      agentId,
      timeRange.from,
      timeRange.to
    ])

    const records = result.rows

    // Calculate aggregated metrics
    const totalCalls = records.reduce((sum, r) => sum + r.calls_processed, 0)
    const successfulCalls = records.reduce((sum, r) => sum + r.successful_calls, 0)
    const failedCalls = records.reduce((sum, r) => sum + r.failed_calls, 0)
    const avgResponseTime = records.length > 0 
      ? records.reduce((sum, r) => sum + r.response_time_ms, 0) / records.length
      : 0
    const totalCost = records.reduce((sum, r) => sum + r.cost_cents, 0)
    const totalSavings = records.reduce((sum, r) => sum + r.savings_cents, 0)

    return {
      agentId,
      period,
      callsProcessed: totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime: Math.round(avgResponseTime),
      totalCost: totalCost / 100, // Convert cents to currency
      totalSavings: totalSavings / 100,
      data: records.map(r => ({
        timestamp: r.timestamp,
        calls: r.calls_processed,
        successRate: r.calls_processed > 0 
          ? (r.successful_calls / r.calls_processed) * 100 
          : 100,
        responseTime: r.response_time_ms,
        cost: r.cost_cents / 100,
        savings: r.savings_cents / 100
      }))
    }
  }

  /**
   * Get agent logs
   */
  async getAgentLogs(
    agentId: string, 
    userId: string, 
    options: AgentLogsOptions
  ): Promise<AgentLogsResult> {
    const agent = await this.getAgent(agentId, userId)
    if (!agent) {
      throw new AgentNotFoundError(agentId)
    }

    const { level, limit, offset, from, to } = options

    let whereClause = 'WHERE agent_installation_id = $1'
    const params: any[] = [agentId]
    let paramIndex = 2

    if (level) {
      whereClause += ` AND level = $${paramIndex}`
      params.push(level)
      paramIndex++
    }

    if (from) {
      whereClause += ` AND timestamp >= $${paramIndex}`
      params.push(from)
      paramIndex++
    }

    if (to) {
      whereClause += ` AND timestamp <= $${paramIndex}`
      params.push(to)
      paramIndex++
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM agent_logs ${whereClause}`
    const countResult = await db.query<{ count: string }>(countQuery, params)
    const total = parseInt(countResult.rows[0].count)

    // Get logs
    const logsQuery = `
      SELECT 
        id, agent_installation_id as agentId, timestamp, level,
        message, context, error, duration_ms, action
      FROM agent_logs 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    params.push(limit, offset)

    const result = await db.query<AgentLogRecord>(logsQuery, params)

    const entries: AgentLogEntry[] = result.rows.map(row => ({
      id: row.id,
      agentId: row.agent_installation_id,
      timestamp: row.timestamp,
      level: row.level as 'debug' | 'info' | 'warn' | 'error',
      message: row.message,
      context: row.context ? JSON.parse(row.context) : undefined,
      error: row.error || undefined,
      duration: row.duration_ms || undefined,
      action: row.action || undefined
    }))

    return { entries, total }
  }

  /**
   * Get agent health status
   */
  async getAgentHealth(agentId: string, userId: string): Promise<AgentHealthCheck> {
    const agent = await this.getAgent(agentId, userId)
    if (!agent) {
      throw new AgentNotFoundError(agentId)
    }

    const checks: HealthCheckItem[] = []

    // Check agent status
    checks.push({
      name: 'Agent Status',
      status: agent.status === 'running' ? 'pass' : agent.status === 'error' ? 'fail' : 'warn',
      message: `Agent is ${agent.status}`
    })

    // Check recent activity
    const hasRecentActivity = agent.lastActivity && 
      (Date.now() - agent.lastActivity.getTime()) < 5 * 60 * 1000 // 5 minutes
    
    checks.push({
      name: 'Recent Activity',
      status: hasRecentActivity ? 'pass' : 'warn',
      message: agent.lastActivity 
        ? `Last activity: ${agent.lastActivity.toISOString()}`
        : 'No recent activity'
    })

    // Check error rate (mock check)
    checks.push({
      name: 'Error Rate',
      status: 'pass',
      message: 'Error rate within acceptable limits'
    })

    // Determine overall health
    const failCount = checks.filter(c => c.status === 'fail').length
    const warnCount = checks.filter(c => c.status === 'warn').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    let message: string

    if (failCount > 0) {
      overallStatus = 'unhealthy'
      message = `${failCount} critical issue${failCount > 1 ? 's' : ''} detected`
    } else if (warnCount > 0) {
      overallStatus = 'degraded'
      message = `${warnCount} warning${warnCount > 1 ? 's' : ''} detected`
    } else {
      overallStatus = 'healthy'
      message = 'All systems operational'
    }

    return {
      status: overallStatus,
      message,
      timestamp: new Date(),
      checks,
      details: {
        agentStatus: agent.status,
        lastActivity: agent.lastActivity?.toISOString(),
        uptime: this.calculateUptime(agent.installedAt)
      }
    }
  }

  /**
   * Execute custom agent action
   */
  async executeAgentAction(
    agentId: string,
    userId: string,
    action: string,
    data: any,
    context?: Record<string, any>
  ): Promise<any> {
    const agent = await this.getAgent(agentId, userId)
    if (!agent) {
      throw new AgentNotFoundError(agentId)
    }

    if (agent.status !== 'running') {
      throw new AgentError(
        'Agent must be running to execute actions',
        'AGENT_NOT_RUNNING',
        agentId
      )
    }

    // Log the action
    await this.logAgentActivity(
      agentId,
      'info',
      `Executing action: ${action}`,
      { action, data, context }
    )

    // Mock execution result
    const result = {
      action,
      status: 'completed',
      result: data,
      timestamp: new Date(),
      executionTime: Math.random() * 1000 + 100 // Mock execution time
    }

    // Emit execution event
    socketService.emitToUser(userId, 'agent-action-executed', {
      agentId,
      action,
      result
    })

    return result
  }

  // Private helper methods

  private mapToInstalledAgent(
    record: AgentInstallationRecord & { last_activity?: Date }
  ): InstalledAgent {
    return {
      id: record.id,
      agentId: record.agent_id,
      name: record.name,
      provider: record.provider,
      version: record.version,
      status: record.status as 'running' | 'stopped' | 'error' | 'installing',
      businessId: record.business_id,
      userId: record.user_id,
      config: JSON.parse(record.config),
      installedAt: record.installed_at,
      lastActivity: record.last_activity,
      health: this.determineHealth(record.status, record.last_activity),
      metadata: JSON.parse(record.metadata)
    }
  }

  private determineHealth(
    status: string, 
    lastActivity?: Date
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (status === 'error') return 'unhealthy'
    if (status !== 'running') return 'degraded'
    
    if (lastActivity) {
      const timeSinceActivity = Date.now() - lastActivity.getTime()
      if (timeSinceActivity > 10 * 60 * 1000) return 'degraded' // 10 minutes
    }
    
    return 'healthy'
  }

  private async getAgentMetadata(agentId: string) {
    // Mock agent metadata - in production, this would fetch from marketplace
    const mockAgents: Record<string, any> = {
      'whatsapp-ai-responder': {
        name: 'WhatsApp AI Responder',
        provider: 'Local AI Co.',
        version: '2.1.0',
        description: 'Automatically respond to WhatsApp messages'
      },
      'cozmox-voice-agent': {
        name: 'Cozmox Voice Assistant',
        provider: 'Cozmox AI',
        version: '1.5.2',
        description: 'Handle voice calls with AI'
      }
    }

    return mockAgents[agentId] || null
  }

  private async initializeAgent(installation: AgentInstallationRecord) {
    // Simulate agent initialization
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update status to running
    await db.query(
      'UPDATE agent_installations SET status = $1, updated_at = $2 WHERE id = $3',
      ['running', new Date(), installation.id]
    )

    // Log initialization
    await this.logAgentActivity(
      installation.id,
      'info',
      'Agent initialized successfully'
    )

    // Emit status change
    socketService.emitToUser(installation.user_id, 'agent-status-changed', {
      agentId: installation.id,
      status: 'running',
      timestamp: new Date()
    })
  }

  private async updateAgentStatus(
    agentId: string, 
    userId: string, 
    status: string
  ): Promise<void> {
    const agent = await this.getAgent(agentId, userId)
    if (!agent) {
      throw new AgentNotFoundError(agentId)
    }

    await db.query(
      'UPDATE agent_installations SET status = $1, updated_at = $2 WHERE id = $3',
      [status, new Date(), agentId]
    )
  }

  private async logAgentActivity(
    agentId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, any>,
    error?: string,
    duration?: number,
    action?: string
  ): Promise<void> {
    const logQuery = `
      INSERT INTO agent_logs (
        id, agent_installation_id, timestamp, level, message,
        context, error, duration_ms, action, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `

    await db.query(logQuery, [
      uuidv4(),
      agentId,
      new Date(),
      level,
      message,
      context ? JSON.stringify(context) : null,
      error || null,
      duration || null,
      action || null,
      new Date()
    ])
  }

  private getTimeRange(
    period: 'hour' | 'day' | 'week' | 'month',
    from?: Date,
    to?: Date
  ): { from: Date; to: Date } {
    const now = new Date()
    
    if (from && to) {
      return { from, to }
    }

    let fromTime: Date

    switch (period) {
      case 'hour':
        fromTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        fromTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        fromTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        fromTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    return { from: fromTime, to: now }
  }

  private calculateUptime(installedAt: Date): string {
    const uptimeMs = Date.now() - installedAt.getTime()
    const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else {
      return `${hours}h`
    }
  }
}

export const agentService = new AgentService()