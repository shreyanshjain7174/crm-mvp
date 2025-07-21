/**
 * Agent Builder
 * 
 * Fluent API for building AI agents that integrate with the CRM platform.
 * Provides a simple, chainable interface for defining agent capabilities,
 * permissions, and event handlers.
 */

import { EventEmitter } from 'eventemitter3'
import { 
  AgentManifest,
  AgentCapability,
  Permission,
  PricingModel,
  MessageHandler,
  ContactHandler,
  LeadHandler,
  ConversationHandler,
  CallHandler,
  EventHandler,
  AgentLifecycleHooks,
  AgentUIConfiguration,
  AgentActionButton,
  ExternalServiceConfig,
  BuiltAgent,
  ConfigurationError,
  AgentContext,
  CRMData,
  AgentData,
  ActionButton,
  DataType
} from './types'

import { AgentRuntime } from './AgentRuntime'

export class AgentBuilder {
  private manifest: Partial<AgentManifest> = {}
  private handlers = new Map<string, EventHandler>()
  private lifecycle: AgentLifecycleHooks = {}
  private actionButtons: ActionButton[] = []
  private externalServices: ExternalServiceConfig[] = []
  private uiConfig: AgentUIConfiguration = { fields: [] }

  /**
   * Set the agent name
   */
  withName(name: string): AgentBuilder {
    this.manifest.name = name
    return this
  }

  /**
   * Set the agent version
   */
  withVersion(version: string): AgentBuilder {
    this.manifest.version = version
    return this
  }

  /**
   * Set the agent provider/company name
   */
  withProvider(provider: string): AgentBuilder {
    this.manifest.provider = provider
    return this
  }

  /**
   * Set the agent description
   */
  withDescription(description: string): AgentBuilder {
    this.manifest.description = description
    return this
  }

  /**
   * Add a capability to the agent
   */
  withCapability(capability: AgentCapability): AgentBuilder {
    if (!this.manifest.capabilities) {
      this.manifest.capabilities = []
    }
    this.manifest.capabilities.push(capability)
    return this
  }

  /**
   * Add a permission requirement
   */
  withPermission(permission: Permission): AgentBuilder {
    if (!this.manifest.permissions) {
      this.manifest.permissions = []
    }
    this.manifest.permissions.push(permission)
    return this
  }

  /**
   * Set the pricing model
   */
  withPricing(pricing: PricingModel): AgentBuilder {
    this.manifest.pricing = pricing
    return this
  }

  /**
   * Configure the agent's UI settings interface
   */
  withConfigUI(config: AgentUIConfiguration): AgentBuilder {
    this.uiConfig = config
    this.manifest.ui = {
      configuration: config,
      actionButtons: this.actionButtons,
      dataRenderers: []
    }
    return this
  }

  /**
   * Add an action button to the CRM interface
   */
  withActionButton(button: AgentActionButton): AgentBuilder {
    const actionButton: ActionButton = {
      id: button.id,
      label: button.label,
      icon: button.icon,
      placement: button.placement,
      context: {}, // Empty context for now
      action: button.onClick,  // Map onClick to action
      enabled: true, // Static enabled for now
      tooltip: button.tooltip,
      shortcut: button.shortcut
    }
    this.actionButtons.push(actionButton)
    if (this.manifest.ui) {
      this.manifest.ui.actionButtons = this.actionButtons
    }
    return this
  }

  /**
   * Configure external service integration
   */
  withExternalService(service: ExternalServiceConfig): AgentBuilder {
    this.externalServices.push(service)
    return this
  }

  /**
   * Set supported data types
   */
  withSupportedDataTypes(types: DataType[]): AgentBuilder {
    this.manifest.supportedDataTypes = types
    return this
  }

  /**
   * Handle incoming messages
   */
  onMessage(handler: MessageHandler): AgentBuilder {
    this.handlers.set('message', handler as EventHandler)
    return this
  }

  /**
   * Handle contact updates
   */
  onContact(handler: ContactHandler): AgentBuilder {
    this.handlers.set('contact', handler as EventHandler)
    return this
  }

  /**
   * Handle lead changes
   */
  onLead(handler: LeadHandler): AgentBuilder {
    this.handlers.set('lead', handler as EventHandler)
    return this
  }

  /**
   * Handle conversation events
   */
  onConversation(handler: ConversationHandler): AgentBuilder {
    this.handlers.set('conversation', handler as EventHandler)
    return this
  }

  /**
   * Handle voice calls (for voice agents)
   */
  onCall(handler: CallHandler): AgentBuilder {
    this.handlers.set('call', handler as EventHandler)
    return this
  }

  /**
   * Handle custom events
   */
  on(eventType: string, handler: EventHandler): AgentBuilder {
    this.handlers.set(eventType, handler)
    return this
  }

  /**
   * Agent lifecycle hooks
   */
  onInstall(handler: (config: any) => Promise<void>): AgentBuilder {
    this.lifecycle.onInstall = handler
    return this
  }

  onUninstall(handler: (config: any) => Promise<void>): AgentBuilder {
    this.lifecycle.onUninstall = handler
    return this
  }

  onStart(handler: (config: any) => Promise<void>): AgentBuilder {
    this.lifecycle.onStart = handler
    return this
  }

  onStop(handler: (config: any) => Promise<void>): AgentBuilder {
    this.lifecycle.onStop = handler
    return this
  }

  onConfigChange(handler: (oldConfig: any, newConfig: any) => Promise<void>): AgentBuilder {
    this.lifecycle.onConfigChange = handler
    return this
  }

  /**
   * Build and return the completed agent
   */
  build(): BuiltAgent {
    this.validateManifest()
    
    // Generate agent ID if not set
    if (!this.manifest.id) {
      this.manifest.id = this.generateAgentId()
    }

    // Set default pricing if not specified
    if (!this.manifest.pricing) {
      this.manifest.pricing = { model: 'free' } as PricingModel
    }

    // Set default UI config if not specified
    if (!this.manifest.ui) {
      this.manifest.ui = {
        configuration: this.uiConfig,
        actionButtons: this.actionButtons,
        dataRenderers: []
      }
    }

    // Set default supported data types
    if (!this.manifest.supportedDataTypes) {
      this.manifest.supportedDataTypes = Array.from(this.handlers.keys()) as DataType[]
    }

    const completeManifest = this.manifest as AgentManifest

    // Create the Universal Agent Adapter
    const adapter = this.createAdapter(completeManifest)

    return {
      manifest: completeManifest,
      handlers: this.handlers,
      lifecycle: this.lifecycle,
      adapter
    }
  }

  /**
   * Validate the agent manifest
   */
  private validateManifest(): void {
    const required = ['name', 'version', 'provider', 'description']
    
    for (const field of required) {
      if (!this.manifest[field as keyof AgentManifest]) {
        throw new ConfigurationError(`Agent ${field} is required`)
      }
    }

    if (!this.manifest.capabilities || this.manifest.capabilities.length === 0) {
      throw new ConfigurationError('Agent must have at least one capability')
    }

    if (!this.manifest.permissions || this.manifest.permissions.length === 0) {
      throw new ConfigurationError('Agent must declare at least one permission')
    }

    if (this.handlers.size === 0) {
      throw new ConfigurationError('Agent must have at least one event handler')
    }
  }

  /**
   * Generate a unique agent ID based on name and provider
   */
  private generateAgentId(): string {
    const name = this.manifest.name!.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const provider = this.manifest.provider!.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `${provider}-${name}`
  }

  /**
   * Create the Universal Agent Adapter
   */
  private createAdapter(manifest: AgentManifest) {
    const runtime = new AgentRuntime(manifest, this.handlers, this.lifecycle)
    
    return {
      connect: () => runtime.start(),
      disconnect: () => runtime.stop(),
      sendToAgent: (data: CRMData) => runtime.processEvent(data),
      receiveFromAgent: () => runtime.getEventStream(),
      getConfigUI: () => manifest.ui?.configuration || { fields: [] },
      getActionButtons: () => manifest.ui?.actionButtons || [],
      getDataDisplay: () => manifest.ui?.dataRenderers || []
    }
  }
}

/**
 * Convenience function to create a new agent builder
 */
export function createAgent(): AgentBuilder {
  return new AgentBuilder()
}