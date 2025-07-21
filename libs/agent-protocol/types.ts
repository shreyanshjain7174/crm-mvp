/**
 * Universal Agent Protocol (UAP) - Core Types
 * 
 * This file defines the fundamental types and interfaces that ALL AI agents
 * must implement to integrate with our CRM platform.
 */

// =============================================================================
// Agent Manifest & Metadata
// =============================================================================

export interface AgentManifest {
  /** Unique identifier for the agent */
  id: string
  /** Human-readable name */
  name: string
  /** Semantic version */
  version: string
  /** Provider/developer name */
  provider: string
  /** Brief description of what the agent does */
  description: string
  /** Detailed description or markdown content */
  longDescription?: string
  /** Agent icon URL or base64 */
  icon?: string
  /** List of capabilities this agent provides */
  capabilities: AgentCapability[]
  /** Required permissions to function */
  permissions: Permission[]
  /** Pricing model */
  pricing: PricingModel
  /** UI components and integration points */
  ui: UIComponents
  /** Supported data types */
  supportedDataTypes: DataType[]
  /** Webhook endpoints */
  webhooks?: WebhookConfig[]
  /** Configuration schema */
  configSchema?: ConfigSchema
}

export interface AgentCapability {
  /** Capability identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Description of what this capability does */
  description: string
  /** Input data types this capability accepts */
  inputTypes: DataType[]
  /** Output data types this capability produces */
  outputTypes: DataType[]
  /** Whether this capability requires human approval */
  requiresApproval?: boolean
}

// =============================================================================
// Data Types & Schemas
// =============================================================================

export type DataType = 
  | 'contact'
  | 'message'
  | 'lead' 
  | 'conversation'
  | 'template'
  | 'task'
  | 'analytics'
  | 'webhook'
  | 'custom'

export interface CRMData {
  type: DataType
  id: string
  businessId: string
  userId: string
  data: any
  metadata?: Record<string, any>
  timestamp: Date
}

export interface AgentData {
  type: DataType
  agentId: string
  action: AgentAction
  data: any
  confidence?: number
  requiresApproval?: boolean
  metadata?: Record<string, any>
  timestamp: Date
}

export type AgentAction = 
  | 'create'
  | 'update' 
  | 'delete'
  | 'read'
  | 'analyze'
  | 'suggest'
  | 'execute'
  | 'notify'

// =============================================================================
// Permissions & Security
// =============================================================================

export interface Permission {
  /** Resource type */
  resource: DataType | 'all'
  /** Actions allowed on this resource */
  actions: AgentAction[]
  /** Additional constraints */
  constraints?: {
    /** Only access own business data */
    businessScope?: boolean
    /** Only read, no write */
    readOnly?: boolean
    /** Requires human approval for actions */
    requiresApproval?: boolean
  }
}

export interface SecurityContext {
  businessId: string
  userId: string
  agentId: string
  permissions: Permission[]
  sessionId: string
  expiresAt: Date
}

// =============================================================================
// Pricing & Billing
// =============================================================================

export type PricingModel = 'free' | 'subscription' | 'usage' | 'one-time'

export interface PricingConfig {
  model: PricingModel
  free?: {
    /** Free tier limits */
    limits: UsageLimits
  }
  subscription?: {
    /** Monthly cost in cents */
    monthlyPrice: number
    /** Annual cost in cents (if different) */
    annualPrice?: number
    /** Usage limits */
    limits: UsageLimits
  }
  usage?: {
    /** Cost per API call in cents */
    perCall?: number
    /** Cost per message processed in cents */
    perMessage?: number
    /** Cost per minute of processing in cents */
    perMinute?: number
  }
  oneTime?: {
    /** One-time cost in cents */
    price: number
  }
}

export interface UsageLimits {
  /** API calls per month */
  apiCalls?: number
  /** Messages processed per month */
  messages?: number
  /** Processing minutes per month */
  processingMinutes?: number
  /** Data storage in MB */
  storage?: number
}

// =============================================================================
// UI Integration
// =============================================================================

export interface UIComponents {
  /** Configuration UI component */
  configComponent?: string
  /** Action buttons to show in CRM */
  actionButtons?: ActionButton[]
  /** Custom data display components */
  dataDisplays?: DataDisplay[]
  /** Dashboard widgets */
  dashboardWidgets?: DashboardWidget[]
}

export interface ActionButton {
  id: string
  label: string
  icon?: string
  /** Where to show this button */
  context: 'contact' | 'message' | 'lead' | 'global'
  /** Action to execute */
  action: string
  /** Button style */
  style?: 'primary' | 'secondary' | 'danger'
}

export interface DataDisplay {
  /** Data type this display handles */
  dataType: DataType
  /** React component name */
  component: string
  /** Where to show this display */
  context: 'sidebar' | 'modal' | 'inline'
}

export interface DashboardWidget {
  id: string
  title: string
  /** Widget type */
  type: 'chart' | 'metric' | 'list' | 'custom'
  /** Size on dashboard grid */
  size: 'small' | 'medium' | 'large'
  /** React component name */
  component: string
}

// =============================================================================
// Communication & Events
// =============================================================================

export interface CRMEvent {
  id: string
  type: string
  /** Business that triggered the event */
  businessId: string
  /** User who triggered the event */
  userId: string
  /** Event payload */
  data: any
  /** Event metadata */
  metadata?: Record<string, any>
  timestamp: Date
}

export interface AgentEvent {
  id: string
  agentId: string
  type: string
  /** Response to CRM event */
  inResponseTo?: string
  /** Event payload */
  data: any
  /** Whether this requires human approval */
  requiresApproval?: boolean
  timestamp: Date
}

// =============================================================================
// Configuration
// =============================================================================

export interface ConfigSchema {
  /** JSON Schema for agent configuration */
  schema: any
  /** UI hints for rendering config form */
  uiSchema?: any
  /** Default configuration values */
  defaultValues?: Record<string, any>
}

export interface AgentConfig {
  agentId: string
  businessId: string
  /** Agent-specific configuration */
  config: Record<string, any>
  /** Whether agent is enabled */
  enabled: boolean
  /** Created timestamp */
  createdAt: Date
  /** Last updated timestamp */
  updatedAt: Date
}

// =============================================================================
// Webhooks
// =============================================================================

export interface WebhookConfig {
  /** Webhook endpoint path */
  path: string
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Description of what this webhook does */
  description: string
  /** Expected payload schema */
  payloadSchema?: any
}

// =============================================================================
// Resource Management
// =============================================================================

export interface ResourceLimits {
  /** Max CPU usage percentage */
  cpu?: number
  /** Max memory usage in MB */
  memory?: number
  /** Max storage usage in MB */
  storage?: number
  /** Max API calls per minute */
  apiCallsPerMinute?: number
  /** Max concurrent operations */
  maxConcurrency?: number
}

export interface ResourceUsage {
  agentId: string
  businessId: string
  /** Current period usage */
  current: {
    apiCalls: number
    messages: number
    processingMinutes: number
    storage: number
  }
  /** Usage limits */
  limits: UsageLimits
  /** Billing period */
  billingPeriod: {
    start: Date
    end: Date
  }
}

// =============================================================================
// Runtime Status
// =============================================================================

export type AgentStatus = 'installing' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

export interface AgentInstance {
  id: string
  agentId: string
  businessId: string
  status: AgentStatus
  /** Current configuration */
  config: Record<string, any>
  /** Runtime metadata */
  metadata: {
    version: string
    startedAt?: Date
    lastActivity?: Date
    errorCount: number
    lastError?: string
  }
  /** Resource usage */
  resourceUsage: ResourceUsage
}