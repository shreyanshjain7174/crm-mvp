/**
 * Universal Agent Protocol (UAP) - Agent Registry
 * 
 * This module provides the central registry for all AI agents in the platform.
 * It handles discovery, installation, lifecycle management, and marketplace integration.
 */

import type {
  AgentManifest,
  AgentConfig,
  AgentInstance,
  AgentStatus,
  ResourceUsage,
  SecurityContext
} from './types'
import type {
  AgentRegistry,
  UniversalAgentAdapter,
  AgentMarketplace,
  PermissionManager,
  BillingService
} from './interfaces'
import { AgentRuntime } from './runtime'

// =============================================================================
// Agent Registry Implementation
// =============================================================================

export class AgentRegistryService implements AgentRegistry {
  private runtime: AgentRuntime
  private marketplace: AgentMarketplace
  private permissionManager: PermissionManager
  private billingService: BillingService
  private installedAgents: Map<string, AgentInstance> = new Map()
  private agentAdapters: Map<string, UniversalAgentAdapter> = new Map()

  constructor(
    runtime: AgentRuntime,
    marketplace: AgentMarketplace,
    permissionManager: PermissionManager,
    billingService: BillingService
  ) {
    this.runtime = runtime
    this.marketplace = marketplace
    this.permissionManager = permissionManager
    this.billingService = billingService
  }

  // =============================================================================
  // Agent Installation & Management
  // =============================================================================

  async install(
    manifest: AgentManifest,
    config: Record<string, any>,
    businessId: string,
    userId?: string
  ): Promise<AgentInstance> {
    const agentKey = `${manifest.id}-${businessId}`

    // Check if already installed
    if (this.installedAgents.has(agentKey)) {
      throw new Error(`Agent ${manifest.name} is already installed for this business`)
    }

    // Validate permissions
    await this.validateInstallPermissions(manifest, businessId, userId)

    // Create agent configuration
    const agentConfig: AgentConfig = {
      agentId: manifest.id,
      businessId,
      config,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Get agent adapter
    const adapter = await this.getAgentAdapter(manifest.id)
    if (!adapter) {
      throw new Error(`Agent adapter not found for ${manifest.id}`)
    }

    try {
      // Install via runtime
      const instance = await this.runtime.installAgent(manifest, agentConfig, adapter)

      // Store in registry
      this.installedAgents.set(agentKey, instance)
      this.agentAdapters.set(agentKey, adapter)

      // Set up billing tracking
      await this.setupBillingTracking(instance, manifest)

      // Auto-start if configured
      if (config.autoStart !== false) {
        await this.startAgent(manifest.id, businessId)
      }

      return instance

    } catch (error) {
      // Cleanup on failure
      this.installedAgents.delete(agentKey)
      this.agentAdapters.delete(agentKey)
      throw error
    }
  }

  async uninstall(agentId: string, businessId: string): Promise<void> {
    const agentKey = `${agentId}-${businessId}`
    const instance = this.installedAgents.get(agentKey)

    if (!instance) {
      throw new Error(`Agent ${agentId} is not installed for this business`)
    }

    try {
      // Stop if running
      if (instance.status === 'running') {
        await this.stopAgent(agentId, businessId)
      }

      // Uninstall via runtime
      await this.runtime.uninstallAgent(instance.id)

      // Remove from registry
      this.installedAgents.delete(agentKey)
      this.agentAdapters.delete(agentKey)

      // Clean up billing
      await this.cleanupBilling(instance)

    } catch (error) {
      console.error(`Error uninstalling agent ${agentId}:`, error)
      throw error
    }
  }

  // =============================================================================
  // Agent Lifecycle Management
  // =============================================================================

  async startAgent(agentId: string, businessId: string): Promise<void> {
    const agentKey = `${agentId}-${businessId}`
    const instance = this.installedAgents.get(agentKey)

    if (!instance) {
      throw new Error(`Agent ${agentId} is not installed for this business`)
    }

    if (instance.status === 'running') {
      return // Already running
    }

    // Check resource limits before starting
    await this.checkResourceLimits(instance)

    // Start via runtime
    await this.runtime.startAgent(instance.id)

    // Update instance status
    instance.status = 'running'
    instance.metadata.startedAt = new Date()
  }

  async stopAgent(agentId: string, businessId: string): Promise<void> {
    const agentKey = `${agentId}-${businessId}`
    const instance = this.installedAgents.get(agentKey)

    if (!instance) {
      throw new Error(`Agent ${agentId} is not installed for this business`)
    }

    if (instance.status === 'stopped') {
      return // Already stopped
    }

    // Stop via runtime
    await this.runtime.stopAgent(instance.id)

    // Update instance status
    instance.status = 'stopped'
  }

  async updateAgentConfig(
    agentId: string,
    businessId: string,
    config: Record<string, any>
  ): Promise<void> {
    const agentKey = `${agentId}-${businessId}`
    const instance = this.installedAgents.get(agentKey)
    const adapter = this.agentAdapters.get(agentKey)

    if (!instance || !adapter) {
      throw new Error(`Agent ${agentId} is not installed for this business`)
    }

    // Update configuration via adapter
    await adapter.updateConfig(config)

    // Update instance
    instance.config = { ...instance.config, ...config }
    instance.metadata.updatedAt = new Date()
  }

  // =============================================================================
  // Agent Information & Status
  // =============================================================================

  async getInstalledAgents(businessId: string): Promise<AgentInstance[]> {
    const agents: AgentInstance[] = []

    for (const [key, instance] of this.installedAgents.entries()) {
      if (key.endsWith(`-${businessId}`)) {
        // Get latest status from runtime
        const currentStatus = this.runtime.getAgentStatus(instance.id)
        const updatedInstance = { ...instance, status: currentStatus }
        agents.push(updatedInstance)
      }
    }

    return agents
  }

  async getAgent(agentId: string, businessId: string): Promise<AgentInstance | null> {
    const agentKey = `${agentId}-${businessId}`
    const instance = this.installedAgents.get(agentKey)

    if (!instance) {
      return null
    }

    // Get latest status from runtime
    const currentStatus = this.runtime.getAgentStatus(instance.id)
    return { ...instance, status: currentStatus }
  }

  async getAgentStatus(agentId: string, businessId: string): Promise<AgentStatus> {
    const agentKey = `${agentId}-${businessId}`
    const instance = this.installedAgents.get(agentKey)

    if (!instance) {
      return 'stopped'
    }

    return this.runtime.getAgentStatus(instance.id)
  }

  // =============================================================================
  // Marketplace Integration
  // =============================================================================

  async installFromMarketplace(
    marketplaceAgentId: string,
    businessId: string,
    config: Record<string, any>,
    userId?: string
  ): Promise<AgentInstance> {
    // Get agent manifest from marketplace
    const manifest = await this.marketplace.getAgentDetails(marketplaceAgentId)

    // Install the agent
    const instance = await this.install(manifest, config, businessId, userId)

    // Track installation stats
    await this.trackInstallation(manifest.id, businessId)

    return instance
  }

  async searchMarketplace(
    query: string,
    businessId: string,
    filters?: Record<string, any>
  ): Promise<AgentManifest[]> {
    const allAgents = await this.marketplace.searchAgents(query, filters)
    const installedAgentIds = await this.getInstalledAgentIds(businessId)

    // Mark which agents are already installed
    return allAgents.map(agent => ({
      ...agent,
      metadata: {
        ...agent.metadata,
        isInstalled: installedAgentIds.includes(agent.id)
      }
    }))
  }

  async getFeaturedAgents(businessId: string): Promise<AgentManifest[]> {
    const featuredAgents = await this.marketplace.getFeaturedAgents()
    const installedAgentIds = await this.getInstalledAgentIds(businessId)

    return featuredAgents.map(agent => ({
      ...agent,
      metadata: {
        ...agent.metadata,
        isInstalled: installedAgentIds.includes(agent.id)
      }
    }))
  }

  // =============================================================================
  // Resource Management
  // =============================================================================

  async getResourceUsage(businessId: string): Promise<ResourceUsage[]> {
    const agents = await this.getInstalledAgents(businessId)
    const usages: ResourceUsage[] = []

    for (const agent of agents) {
      if (agent.status === 'running') {
        usages.push(agent.resourceUsage)
      }
    }

    return usages
  }

  async getTotalResourceUsage(businessId: string): Promise<ResourceUsage['current']> {
    const usages = await this.getResourceUsage(businessId)

    return usages.reduce(
      (total, usage) => ({
        apiCalls: total.apiCalls + usage.current.apiCalls,
        messages: total.messages + usage.current.messages,
        processingMinutes: total.processingMinutes + usage.current.processingMinutes,
        storage: total.storage + usage.current.storage
      }),
      { apiCalls: 0, messages: 0, processingMinutes: 0, storage: 0 }
    )
  }

  // =============================================================================
  // Health Monitoring
  // =============================================================================

  async checkAgentHealth(agentId: string, businessId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details?: string
  }> {
    const agentKey = `${agentId}-${businessId}`
    const adapter = this.agentAdapters.get(agentKey)

    if (!adapter) {
      return { status: 'unhealthy', details: 'Agent not found' }
    }

    try {
      return await adapter.healthCheck()
    } catch (error) {
      return {
        status: 'unhealthy',
        details: (error as Error).message
      }
    }
  }

  async healthCheckAll(businessId: string): Promise<Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy'
    details?: string
  }>> {
    const agents = await this.getInstalledAgents(businessId)
    const results: Record<string, any> = {}

    await Promise.all(
      agents.map(async (agent) => {
        const health = await this.checkAgentHealth(agent.agentId, businessId)
        results[agent.agentId] = health
      })
    )

    return results
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private async validateInstallPermissions(
    manifest: AgentManifest,
    businessId: string,
    userId?: string
  ): Promise<void> {
    // Check if user has permission to install agents
    if (userId) {
      const hasPermission = await this.permissionManager.hasPermission(
        userId,
        'install',
        'agent'
      )
      
      if (!hasPermission) {
        throw new Error('User does not have permission to install agents')
      }
    }

    // Validate required permissions for the agent
    for (const permission of manifest.permissions) {
      // Check if business allows this type of permission
      const isAllowed = await this.permissionManager.hasPermission(
        businessId,
        permission.actions.join(','),
        permission.resource
      )

      if (!isAllowed) {
        throw new Error(
          `Agent requires permission for ${permission.actions.join(', ')} on ${permission.resource}`
        )
      }
    }
  }

  private async getAgentAdapter(agentId: string): Promise<UniversalAgentAdapter | null> {
    // TODO: Implement adapter loading
    // This would load the adapter from marketplace or local registry
    // For now, return null to indicate adapter not found
    return null
  }

  private async setupBillingTracking(
    instance: AgentInstance,
    manifest: AgentManifest
  ): Promise<void> {
    // Set up billing tracking based on pricing model
    if (manifest.pricing.usage) {
      // Track usage-based billing
      await this.billingService.trackUsage(
        instance.agentId,
        instance.businessId,
        { apiCalls: 0, messages: 0 }
      )
    }
  }

  private async cleanupBilling(instance: AgentInstance): Promise<void> {
    // TODO: Implement billing cleanup
    // This would finalize billing and generate final invoice
  }

  private async checkResourceLimits(instance: AgentInstance): Promise<void> {
    const usage = instance.resourceUsage.current
    const limits = instance.resourceUsage.limits

    if (limits.apiCalls && usage.apiCalls >= limits.apiCalls) {
      throw new Error('API call limit exceeded')
    }

    if (limits.messages && usage.messages >= limits.messages) {
      throw new Error('Message limit exceeded')
    }

    if (limits.processingMinutes && usage.processingMinutes >= limits.processingMinutes) {
      throw new Error('Processing time limit exceeded')
    }
  }

  private async getInstalledAgentIds(businessId: string): Promise<string[]> {
    const agents = await this.getInstalledAgents(businessId)
    return agents.map(agent => agent.agentId)
  }

  private async trackInstallation(agentId: string, businessId: string): Promise<void> {
    // TODO: Track installation analytics
    // This would update marketplace statistics
  }
}

// =============================================================================
// Agent Configuration Validator
// =============================================================================

export class AgentConfigValidator {
  static validate(config: Record<string, any>, schema: any): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // TODO: Implement JSON schema validation
    // This would validate agent configuration against provided schema

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// =============================================================================
// Agent Version Manager
// =============================================================================

export class AgentVersionManager {
  private versions: Map<string, string[]> = new Map()

  async getAvailableVersions(agentId: string): Promise<string[]> {
    return this.versions.get(agentId) || []
  }

  async upgradeAgent(
    agentId: string,
    businessId: string,
    targetVersion: string,
    registry: AgentRegistryService
  ): Promise<void> {
    // Get current agent
    const currentAgent = await registry.getAgent(agentId, businessId)
    if (!currentAgent) {
      throw new Error('Agent not found')
    }

    // TODO: Implement version upgrade
    // This would:
    // 1. Download new version
    // 2. Backup current configuration
    // 3. Stop current agent
    // 4. Install new version
    // 5. Migrate configuration
    // 6. Start new version
    // 7. Rollback if issues
  }
}