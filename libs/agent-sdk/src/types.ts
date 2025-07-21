/**
 * Core Types and Interfaces
 * 
 * Defines all the TypeScript interfaces and types used throughout
 * the Agent SDK, ensuring type safety and developer experience.
 */

// Define core types that match the agent protocol
export interface AgentManifest {
  id: string
  name: string
  version: string
  provider: string
  description: string
  capabilities: AgentCapability[]
  permissions: Permission[]
  pricing: PricingModel
  ui: UIComponents
  supportedDataTypes: DataType[]
  icon?: string
}

export interface AgentCapability {
  id: string
  name: string
  description: string
  inputTypes: DataType[]
  outputTypes: DataType[]
  requiresApproval: boolean
}

export interface Permission {
  resource: string
  actions: string[]
  constraints?: {
    businessScope?: boolean
    userScope?: boolean
    [key: string]: any
  }
}

export type PricingModel = 
  | { model: 'free' }
  | { 
      model: 'subscription'
      subscription: {
        monthlyPrice: number
        yearlyPrice?: number
        limits: Record<string, number>
      }
    }
  | {
      model: 'usage'
      usage: {
        perCall?: number
        perMessage?: number
        perMinute?: number
        freeLimit?: number
      }
    }
  | {
      model: 'one-time'
      oneTime: {
        price: number
      }
    }

export interface UIComponents {
  configuration?: AgentUIConfiguration
  actionButtons?: ActionButton[]
  dataRenderers?: DataRenderer[]
}

export interface ActionButton {
  id: string
  label: string
  icon: string
  placement: string
  context: any
  action: any
  enabled?: boolean
  tooltip?: string
  shortcut?: string
}

export interface DataRenderer {
  type: string
  component?: string
  template?: string
  fields?: string[]
  transform?: (data: any) => any
}

export type DataType = 'message' | 'contact' | 'lead' | 'conversation' | 'call' | 'analytics' | 'custom'

export interface CRMData {
  type: DataType
  businessId: string
  data: any
  metadata?: Record<string, any>
}

export interface AgentData {
  type: string
  data: any
  confidence?: number
  requiresApproval?: boolean
  metadata?: Record<string, any>
}

export interface UniversalAgentAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  sendToAgent(data: CRMData): Promise<AgentData | null>
  receiveFromAgent(): any
  getConfigUI(): any
  getActionButtons(): ActionButton[]
  getDataDisplay(): DataRenderer[]
}

// Additional SDK-specific types

/**
 * Agent Configuration passed to handlers
 */
export interface AgentConfig {
  [key: string]: any
  businessId: string
  agentId: string
  userId: string
}

/**
 * Context provided to agent handlers
 */
export interface AgentContext {
  config: AgentConfig
  business: BusinessInfo
  user: UserInfo
  metadata: Record<string, any>
}

/**
 * Business information available to agents
 */
export interface BusinessInfo {
  id: string
  name: string
  industry?: string
  settings: Record<string, any>
  timezone: string
}

/**
 * User information available to agents
 */
export interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

/**
 * Message data structure
 */
export interface MessageData extends CRMData {
  type: 'message'
  data: {
    id: string
    content: string
    phone: string
    direction: 'inbound' | 'outbound'
    timestamp: Date
    messageType: 'text' | 'image' | 'document' | 'audio' | 'video'
    mediaUrl?: string
  }
}

/**
 * Contact data structure
 */
export interface ContactData extends CRMData {
  type: 'contact'
  data: {
    id: string
    name?: string
    phone: string
    email?: string
    tags: string[]
    customFields: Record<string, any>
    lastContact?: Date
    source?: string
  }
}

/**
 * Lead data structure
 */
export interface LeadData extends CRMData {
  type: 'lead'
  data: {
    id: string
    contactId: string
    stage: string
    value?: number
    source: string
    assignedTo?: string
    probability?: number
    expectedCloseDate?: Date
    notes?: string
  }
}

/**
 * Conversation data structure
 */
export interface ConversationData extends CRMData {
  type: 'conversation'
  data: {
    id: string
    contactId: string
    messages: MessageData[]
    status: 'active' | 'closed' | 'archived'
    assignedTo?: string
    tags: string[]
    lastActivity: Date
  }
}

/**
 * Call data structure for voice agents
 */
export interface CallData extends CRMData {
  type: 'call'
  data: {
    id: string
    phoneNumber: string
    direction: 'inbound' | 'outbound'
    status: 'ringing' | 'answered' | 'busy' | 'failed'
    startTime: Date
    businessInfo: BusinessInfo
  }
}

/**
 * Event handler function types
 */
export type MessageHandler = (message: MessageData, context: AgentContext) => Promise<AgentData>
export type ContactHandler = (contact: ContactData, context: AgentContext) => Promise<AgentData>
export type LeadHandler = (lead: LeadData, context: AgentContext) => Promise<AgentData>
export type ConversationHandler = (conversation: ConversationData, context: AgentContext) => Promise<AgentData>
export type CallHandler = (call: CallData, context: AgentContext) => Promise<AgentData>

/**
 * Generic event handler
 */
export type EventHandler<T extends CRMData = CRMData> = (data: T, context: AgentContext) => Promise<AgentData>

/**
 * Agent lifecycle hooks
 */
export interface AgentLifecycleHooks {
  onInstall?: (config: AgentConfig) => Promise<void>
  onUninstall?: (config: AgentConfig) => Promise<void>
  onStart?: (config: AgentConfig) => Promise<void>
  onStop?: (config: AgentConfig) => Promise<void>
  onConfigChange?: (oldConfig: AgentConfig, newConfig: AgentConfig) => Promise<void>
}

/**
 * Agent health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  details?: Record<string, any>
  timestamp: Date
}

/**
 * Agent metrics for monitoring
 */
export interface AgentMetrics {
  callsProcessed: number
  successRate: number
  averageResponseTime: number
  errorsToday: number
  lastActivity: Date
}

/**
 * External service configuration
 */
export interface ExternalServiceConfig {
  name: string
  apiKey?: string
  baseUrl?: string
  webhook?: string
  headers?: Record<string, string>
  authentication?: {
    type: 'bearer' | 'basic' | 'apikey'
    credentials: Record<string, string>
  }
}

/**
 * Configuration field definition for UI
 */
export interface ConfigField {
  name: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'time' | 'url' | 'email' | 'password' | 'object'
  label: string
  description?: string
  placeholder?: string
  required?: boolean
  default?: any
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  properties?: Record<string, ConfigField> // For object type
  dependent?: {
    field: string
    value: any
    show: boolean
  }
}

/**
 * UI Configuration for agent settings
 */
export interface AgentUIConfiguration {
  fields: ConfigField[]
  sections?: {
    name: string
    title: string
    description?: string
    fields: string[]
  }[]
  advanced?: {
    enabled: boolean
    fields: string[]
  }
}

/**
 * Action button that appears in CRM UI
 */
export interface AgentActionButton {
  id: string
  label: string
  icon: string
  placement: 'contact-detail' | 'conversation' | 'lead-detail' | 'dashboard' | 'toolbar'
  onClick: (context: AgentContext) => Promise<AgentData>
  enabled?: (context: AgentContext) => boolean
  tooltip?: string
  shortcut?: string
}

/**
 * Data display configuration
 */
export interface AgentDataRenderer {
  type: 'message' | 'contact' | 'lead' | 'analytics' | 'custom'
  component?: string // React component name
  template?: string // Template string
  fields?: string[] // Fields to display
  transform?: (data: any) => any // Data transformation function
}

/**
 * Agent error types
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AgentError'
  }
}

export class ValidationError extends AgentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class ConfigurationError extends AgentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', details)
    this.name = 'ConfigurationError'
  }
}

export class ExternalServiceError extends AgentError {
  constructor(message: string, service: string, details?: Record<string, any>) {
    super(message, 'EXTERNAL_SERVICE_ERROR', { service, ...details })
    this.name = 'ExternalServiceError'
  }
}

/**
 * SDK Configuration
 */
export interface SDKConfig {
  platformUrl?: string
  apiKey?: string
  debug?: boolean
  timeout?: number
  retries?: number
}

/**
 * Agent build result
 */
export interface BuiltAgent {
  manifest: AgentManifest
  handlers: Map<string, EventHandler>
  lifecycle: AgentLifecycleHooks
  adapter: UniversalAgentAdapter
}