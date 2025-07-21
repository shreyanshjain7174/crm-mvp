/**
 * Universal Agent Protocol (UAP) - Runtime System
 * 
 * This module provides the runtime environment for AI agents to run securely
 * within our CRM platform. It handles sandboxing, resource management, and
 * lifecycle orchestration.
 */

import { EventEmitter } from 'events'
import { Observable, Subject, BehaviorSubject } from 'rxjs'
import type {
  AgentInstance,
  AgentStatus,
  AgentManifest,
  AgentConfig,
  ResourceLimits,
  ResourceUsage,
  SecurityContext,
  CRMEvent,
  AgentEvent,
  CRMData,
  AgentData
} from './types'
import type {
  UniversalAgentAdapter,
  AgentRegistry,
  EventBus,
  PermissionManager
} from './interfaces'

// =============================================================================
// Agent Runtime Core - Manages Agent Execution
// =============================================================================

export class AgentRuntime extends EventEmitter {
  private agents: Map<string, AgentRuntimeInstance> = new Map()
  private eventBus: EventBus
  private permissionManager: PermissionManager
  private resourceMonitor: ResourceMonitor

  constructor(
    eventBus: EventBus,
    permissionManager: PermissionManager,
    resourceMonitor: ResourceMonitor
  ) {
    super()
    this.eventBus = eventBus
    this.permissionManager = permissionManager
    this.resourceMonitor = resourceMonitor
  }

  // =============================================================================
  // Lifecycle Management
  // =============================================================================

  /**
   * Install and initialize a new agent
   */
  async installAgent(
    manifest: AgentManifest,
    config: AgentConfig,
    adapter: UniversalAgentAdapter
  ): Promise<AgentInstance> {
    const agentId = `${manifest.id}-${config.businessId}`
    
    // Validate manifest
    this.validateManifest(manifest)
    
    // Create security context
    const securityContext = await this.permissionManager.createSecurityContext(
      manifest.id,
      config.businessId,
      config.userId || 'system'
    )

    // Create runtime instance
    const runtimeInstance = new AgentRuntimeInstance(
      manifest,
      config,
      adapter,
      securityContext,
      this.eventBus,
      this.resourceMonitor
    )

    // Install the agent
    const instance = await runtimeInstance.install()
    
    // Store in runtime
    this.agents.set(agentId, runtimeInstance)
    
    // Emit installation event
    this.emit('agent-installed', { agentId, instance })
    
    return instance
  }

  /**
   * Start an agent
   */
  async startAgent(agentId: string): Promise<void> {
    const runtime = this.agents.get(agentId)
    if (!runtime) {
      throw new Error(`Agent ${agentId} not found`)
    }

    await runtime.start()
    this.emit('agent-started', { agentId })
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId: string): Promise<void> {
    const runtime = this.agents.get(agentId)
    if (!runtime) {
      throw new Error(`Agent ${agentId} not found`)
    }

    await runtime.stop()
    this.emit('agent-stopped', { agentId })
  }

  /**
   * Uninstall an agent
   */
  async uninstallAgent(agentId: string): Promise<void> {
    const runtime = this.agents.get(agentId)
    if (!runtime) {
      throw new Error(`Agent ${agentId} not found`)
    }

    await runtime.uninstall()
    this.agents.delete(agentId)
    this.emit('agent-uninstalled', { agentId })
  }

  // =============================================================================
  // Communication & Events
  // =============================================================================

  /**
   * Send event to specific agent
   */
  async sendEventToAgent(agentId: string, event: CRMEvent): Promise<void> {
    const runtime = this.agents.get(agentId)
    if (!runtime) {
      throw new Error(`Agent ${agentId} not found`)
    }

    await runtime.processEvent(event)
  }

  /**
   * Send data to specific agent
   */
  async sendDataToAgent(agentId: string, data: CRMData): Promise<void> {
    const runtime = this.agents.get(agentId)
    if (!runtime) {
      throw new Error(`Agent ${agentId} not found`)
    }

    await runtime.sendData(data)
  }

  /**
   * Get agent event stream
   */
  getAgentEventStream(agentId: string): Observable<AgentEvent> {
    const runtime = this.agents.get(agentId)
    if (!runtime) {
      throw new Error(`Agent ${agentId} not found`)
    }

    return runtime.getEventStream()
  }

  // =============================================================================
  // Monitoring & Management
  // =============================================================================

  /**
   * Get all running agents
   */
  getRunningAgents(): AgentInstance[] {
    return Array.from(this.agents.values())
      .filter(runtime => runtime.getStatus() === 'running')
      .map(runtime => runtime.getInstance())
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): AgentStatus {
    const runtime = this.agents.get(agentId)
    return runtime ? runtime.getStatus() : 'stopped'
  }

  /**
   * Get resource usage for all agents
   */
  async getResourceUsage(): Promise<ResourceUsage[]> {
    const usages: ResourceUsage[] = []
    
    for (const runtime of this.agents.values()) {
      const usage = await runtime.getResourceUsage()
      usages.push(usage)
    }
    
    return usages
  }

  /**
   * Shutdown all agents
   */
  async shutdown(): Promise<void> {
    const shutdownPromises: Promise<void>[] = []
    
    for (const [agentId, runtime] of this.agents.entries()) {
      shutdownPromises.push(
        runtime.stop().catch(err => {
          console.error(`Error stopping agent ${agentId}:`, err)
        })
      )
    }
    
    await Promise.all(shutdownPromises)
    this.agents.clear()
    this.emit('runtime-shutdown')
  }

  // =============================================================================
  // Validation & Security
  // =============================================================================

  private validateManifest(manifest: AgentManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid manifest: missing required fields')
    }

    if (!Array.isArray(manifest.capabilities)) {
      throw new Error('Invalid manifest: capabilities must be an array')
    }

    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Invalid manifest: permissions must be an array')
    }
  }
}

// =============================================================================
// Agent Runtime Instance - Individual Agent Execution
// =============================================================================

export class AgentRuntimeInstance extends EventEmitter {
  private manifest: AgentManifest
  private config: AgentConfig
  private adapter: UniversalAgentAdapter
  private securityContext: SecurityContext
  private eventBus: EventBus
  private resourceMonitor: ResourceMonitor
  
  private status: BehaviorSubject<AgentStatus>
  private eventStream: Subject<AgentEvent>
  private dataStream: Subject<AgentData>
  private instance: AgentInstance
  
  private resourceLimits?: ResourceLimits
  private errorCount: number = 0
  private lastError?: Error

  constructor(
    manifest: AgentManifest,
    config: AgentConfig,
    adapter: UniversalAgentAdapter,
    securityContext: SecurityContext,
    eventBus: EventBus,
    resourceMonitor: ResourceMonitor
  ) {
    super()
    
    this.manifest = manifest
    this.config = config
    this.adapter = adapter
    this.securityContext = securityContext
    this.eventBus = eventBus
    this.resourceMonitor = resourceMonitor
    
    this.status = new BehaviorSubject<AgentStatus>('stopped')
    this.eventStream = new Subject<AgentEvent>()
    this.dataStream = new Subject<AgentData>()
    
    this.instance = {
      id: `${manifest.id}-${config.businessId}`,
      agentId: manifest.id,
      businessId: config.businessId,
      status: 'stopped',
      config: config.config,
      metadata: {
        version: manifest.version,
        errorCount: 0
      },
      resourceUsage: {
        agentId: manifest.id,
        businessId: config.businessId,
        current: {
          apiCalls: 0,
          messages: 0,
          processingMinutes: 0,
          storage: 0
        },
        limits: manifest.pricing.free?.limits || {
          apiCalls: 1000,
          messages: 500,
          processingMinutes: 60,
          storage: 100
        },
        billingPeriod: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    }
  }

  // =============================================================================
  // Lifecycle Operations
  // =============================================================================

  async install(): Promise<AgentInstance> {
    this.status.next('installing')
    
    try {
      // Install via adapter
      const installedInstance = await this.adapter.install(this.config.config, this.securityContext)
      
      // Update our instance
      this.instance = { ...this.instance, ...installedInstance }
      this.status.next('stopped')
      
      this.emit('installed', this.instance)
      return this.instance
      
    } catch (error) {
      this.status.next('error')
      this.handleError(error as Error)
      throw error
    }
  }

  async start(): Promise<void> {
    if (this.status.value !== 'stopped') {
      throw new Error(`Cannot start agent in status: ${this.status.value}`)
    }

    this.status.next('starting')
    
    try {
      // Connect the adapter
      await this.adapter.connect(this.config, this.securityContext)
      
      // Set up data flow
      this.setupDataFlow()
      
      // Start resource monitoring
      this.startResourceMonitoring()
      
      // Update instance
      this.instance.status = 'running'
      this.instance.metadata.startedAt = new Date()
      this.status.next('running')
      
      this.emit('started')
      
    } catch (error) {
      this.status.next('error')
      this.handleError(error as Error)
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.status.value === 'stopped') {
      return
    }

    this.status.next('stopping')
    
    try {
      // Disconnect adapter
      await this.adapter.disconnect()
      
      // Stop monitoring
      this.stopResourceMonitoring()
      
      // Clean up streams
      this.eventStream.complete()
      this.dataStream.complete()
      
      // Update instance
      this.instance.status = 'stopped'
      this.status.next('stopped')
      
      this.emit('stopped')
      
    } catch (error) {
      this.status.next('error')
      this.handleError(error as Error)
      throw error
    }
  }

  async uninstall(): Promise<void> {
    // Stop first if running
    if (this.status.value === 'running') {
      await this.stop()
    }

    try {
      // Uninstall via adapter
      await this.adapter.uninstall(this.instance.id)
      
      this.emit('uninstalled')
      
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  // =============================================================================
  // Data & Event Processing
  // =============================================================================

  async processEvent(event: CRMEvent): Promise<void> {
    if (this.status.value !== 'running') {
      return
    }

    try {
      const agentEvents = await this.adapter.processEvent(event)
      
      for (const agentEvent of agentEvents) {
        this.eventStream.next(agentEvent)
        await this.eventBus.publishAgentEvent(agentEvent)
      }
      
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  async sendData(data: CRMData): Promise<void> {
    if (this.status.value !== 'running') {
      throw new Error('Agent is not running')
    }

    try {
      await this.adapter.sendToAgent(data)
      
      // Track API call
      this.instance.resourceUsage.current.apiCalls++
      
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  // =============================================================================
  // Monitoring & Status
  // =============================================================================

  getStatus(): AgentStatus {
    return this.status.value
  }

  getInstance(): AgentInstance {
    return { ...this.instance }
  }

  getEventStream(): Observable<AgentEvent> {
    return this.eventStream.asObservable()
  }

  async getResourceUsage(): Promise<ResourceUsage> {
    return { ...this.instance.resourceUsage }
  }

  async healthCheck(): Promise<{ status: string, details?: string }> {
    try {
      const health = await this.adapter.healthCheck()
      return health
    } catch (error) {
      return {
        status: 'unhealthy',
        details: (error as Error).message
      }
    }
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private setupDataFlow(): void {
    // Subscribe to agent data stream
    this.adapter.receiveFromAgent().subscribe({
      next: (data: AgentData) => {
        this.dataStream.next(data)
        this.instance.metadata.lastActivity = new Date()
      },
      error: (error: Error) => {
        this.handleError(error)
      }
    })
  }

  private startResourceMonitoring(): void {
    // TODO: Implement resource monitoring
    // This would track CPU, memory, storage usage
  }

  private stopResourceMonitoring(): void {
    // TODO: Stop resource monitoring
  }

  private handleError(error: Error): void {
    this.errorCount++
    this.lastError = error
    
    this.instance.metadata.errorCount = this.errorCount
    this.instance.metadata.lastError = error.message
    
    this.emit('error', error)
    
    // Auto-stop if too many errors
    if (this.errorCount > 10) {
      this.stop().catch(() => {
        // Ignore errors during error handling
      })
    }
  }
}

// =============================================================================
// Resource Monitor - Tracks Agent Resource Usage
// =============================================================================

export class ResourceMonitor {
  private usageMap: Map<string, ResourceUsage> = new Map()
  
  async trackUsage(agentId: string, usage: Partial<ResourceUsage['current']>): Promise<void> {
    const current = this.usageMap.get(agentId)?.current || {
      apiCalls: 0,
      messages: 0,
      processingMinutes: 0,
      storage: 0
    }
    
    // Update usage
    Object.assign(current, usage)
  }
  
  async getUsage(agentId: string): Promise<ResourceUsage['current']> {
    return this.usageMap.get(agentId)?.current || {
      apiCalls: 0,
      messages: 0,
      processingMinutes: 0,
      storage: 0
    }
  }
  
  async enforceLimit(agentId: string, limits: ResourceLimits): Promise<void> {
    // TODO: Implement resource limit enforcement
    // This would throttle or stop agents that exceed limits
  }
}

// =============================================================================
// Sandbox Environment - Secure Agent Execution
// =============================================================================

export class AgentSandbox {
  private agentId: string
  private limits: ResourceLimits
  
  constructor(agentId: string, limits: ResourceLimits) {
    this.agentId = agentId
    this.limits = limits
  }
  
  async execute(fn: () => Promise<any>): Promise<any> {
    // TODO: Implement sandboxed execution
    // This would:
    // 1. Set resource limits
    // 2. Isolate execution context
    // 3. Monitor resource usage
    // 4. Kill execution if limits exceeded
    
    try {
      return await fn()
    } catch (error) {
      throw new Error(`Sandbox execution failed: ${(error as Error).message}`)
    }
  }
}