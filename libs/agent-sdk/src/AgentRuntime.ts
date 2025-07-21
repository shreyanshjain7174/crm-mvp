/**
 * Agent Runtime
 * 
 * Manages the execution environment for agents, handles event processing,
 * lifecycle management, and communication with the CRM platform.
 */

import { EventEmitter } from 'eventemitter3'
import { 
  AgentManifest,
  EventHandler,
  AgentLifecycleHooks,
  CRMData,
  AgentData,
  AgentContext,
  AgentConfig,
  HealthCheckResult,
  AgentMetrics,
  AgentError
} from './types'
import { CRMLogger } from './logging'

export class AgentRuntime extends EventEmitter {
  private isRunning = false
  private metrics: AgentMetrics = {
    callsProcessed: 0,
    successRate: 100,
    averageResponseTime: 0,
    errorsToday: 0,
    lastActivity: new Date()
  }
  private responseTimes: number[] = []
  private logger: CRMLogger

  constructor(
    private manifest: AgentManifest,
    private handlers: Map<string, EventHandler>,
    private lifecycle: AgentLifecycleHooks
  ) {
    super()
    this.logger = new CRMLogger(manifest.id)
  }

  /**
   * Start the agent runtime
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent is already running')
      return
    }

    try {
      this.logger.info('Starting agent runtime')
      
      // Call lifecycle hook if provided
      if (this.lifecycle.onStart) {
        await this.lifecycle.onStart({} as AgentConfig)
      }

      this.isRunning = true
      this.emit('started')
      
      this.logger.info('Agent runtime started successfully')
    } catch (error) {
      this.logger.error('Failed to start agent runtime', error)
      throw new AgentError('Failed to start agent', 'RUNTIME_START_ERROR', { error })
    }
  }

  /**
   * Stop the agent runtime
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Agent is not running')
      return
    }

    try {
      this.logger.info('Stopping agent runtime')

      // Call lifecycle hook if provided
      if (this.lifecycle.onStop) {
        await this.lifecycle.onStop({} as AgentConfig)
      }

      this.isRunning = false
      this.emit('stopped')
      
      this.logger.info('Agent runtime stopped successfully')
    } catch (error) {
      this.logger.error('Failed to stop agent runtime', error)
      throw new AgentError('Failed to stop agent', 'RUNTIME_STOP_ERROR', { error })
    }
  }

  /**
   * Process incoming CRM data event
   */
  async processEvent(data: CRMData, context?: Partial<AgentContext>): Promise<AgentData | null> {
    if (!this.isRunning) {
      throw new AgentError('Agent is not running', 'AGENT_NOT_RUNNING')
    }

    const startTime = Date.now()

    try {
      // Get handler for this data type
      const handler = this.handlers.get(data.type)
      if (!handler) {
        this.logger.debug(`No handler found for event type: ${data.type}`)
        return null
      }

      // Build agent context
      const agentContext = this.buildContext(data, context)

      this.logger.info(`Processing ${data.type} event`, { 
        businessId: data.businessId,
        dataType: data.type 
      })

      // Execute handler
      const result = await handler(data, agentContext)

      // Update metrics
      const responseTime = Date.now() - startTime
      this.updateMetrics(responseTime, true)

      this.emit('event-processed', {
        type: data.type,
        result,
        responseTime
      })

      this.logger.info(`Successfully processed ${data.type} event`, {
        responseTime,
        resultType: result.type
      })

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.updateMetrics(responseTime, false)

      this.logger.error(`Failed to process ${data.type} event`, error)
      
      this.emit('event-error', {
        type: data.type,
        error,
        responseTime
      })

      throw new AgentError(
        `Failed to process ${data.type} event`,
        'EVENT_PROCESSING_ERROR',
        { eventType: data.type, error }
      )
    }
  }

  /**
   * Get the event stream for real-time updates
   */
  getEventStream() {
    // Return an observable-like interface
    return {
      subscribe: (callback: (data: AgentData) => void) => {
        this.on('event-processed', (event) => {
          callback(event.result)
        })
      },
      unsubscribe: () => {
        this.removeAllListeners('event-processed')
      }
    }
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date()
    }

    try {
      // Check if agent is running
      if (!this.isRunning) {
        result.status = 'unhealthy'
        result.message = 'Agent is not running'
        return result
      }

      // Check error rate
      if (this.metrics.successRate < 50) {
        result.status = 'degraded'
        result.message = 'High error rate detected'
      }

      // Check response time
      if (this.metrics.averageResponseTime > 5000) {
        result.status = 'degraded'
        result.message = 'High response time detected'
      }

      // Add metrics to details
      result.details = {
        metrics: this.metrics,
        manifest: {
          name: this.manifest.name,
          version: this.manifest.version,
          provider: this.manifest.provider
        }
      }

      return result
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      }
    }
  }

  /**
   * Get current agent metrics
   */
  getMetrics(): AgentMetrics {
    return { ...this.metrics }
  }

  /**
   * Get agent manifest
   */
  getManifest(): AgentManifest {
    return this.manifest
  }

  /**
   * Check if agent is running
   */
  isAgentRunning(): boolean {
    return this.isRunning
  }

  /**
   * Build agent context for handlers
   */
  private buildContext(data: CRMData, partialContext?: Partial<AgentContext>): AgentContext {
    return {
      config: {
        businessId: data.businessId,
        agentId: this.manifest.id,
        userId: 'system', // TODO: Get from actual context
        ...partialContext?.config
      },
      business: {
        id: data.businessId,
        name: 'Business Name', // TODO: Get from actual data
        timezone: 'Asia/Kolkata',
        settings: {},
        ...partialContext?.business
      },
      user: {
        id: 'system',
        name: 'System User',
        email: 'system@crm-platform.com',
        role: 'agent',
        ...partialContext?.user
      },
      metadata: {
        agentVersion: this.manifest.version,
        timestamp: new Date().toISOString(),
        ...data.metadata,
        ...partialContext?.metadata
      }
    }
  }

  /**
   * Update runtime metrics
   */
  private updateMetrics(responseTime: number, success: boolean): void {
    this.metrics.callsProcessed++
    this.metrics.lastActivity = new Date()

    // Update response times
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100) // Keep last 100
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length

    // Update success rate
    if (!success) {
      this.metrics.errorsToday++
    }
    
    this.metrics.successRate = 
      ((this.metrics.callsProcessed - this.metrics.errorsToday) / this.metrics.callsProcessed) * 100

    this.emit('metrics-updated', this.metrics)
  }
}