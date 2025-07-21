/**
 * Agent API Types
 * 
 * TypeScript type definitions for agent-related API requests and responses.
 * These types ensure type safety across the agent lifecycle management system.
 */

// Request Types

export interface AgentInstallRequest {
  agentId: string
  businessId?: string
  config?: Record<string, any>
}

export interface AgentConfigRequest {
  config: Record<string, any>
}

export interface AgentActionRequest {
  action: 'start' | 'stop' | 'restart'
}

// Core Data Types

export interface InstalledAgent {
  id: string
  agentId: string
  name: string
  provider: string
  version: string
  status: 'running' | 'stopped' | 'error' | 'installing'
  businessId: string
  userId: string
  config: Record<string, any>
  installedAt: Date
  lastActivity?: Date
  health: 'healthy' | 'degraded' | 'unhealthy'
  metadata: Record<string, any>
}

export interface AgentMetrics {
  agentId: string
  period: 'hour' | 'day' | 'week' | 'month'
  callsProcessed: number
  successfulCalls: number
  failedCalls: number
  averageResponseTime: number
  totalCost: number
  totalSavings: number
  peakUsageTime?: Date
  data: MetricDataPoint[]
}

export interface MetricDataPoint {
  timestamp: Date
  calls: number
  successRate: number
  responseTime: number
  cost: number
  savings: number
}

export interface AgentLogEntry {
  id: string
  agentId: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, any>
  error?: string
  duration?: number
  action?: string
}

export interface AgentHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  details?: Record<string, any>
  timestamp: Date
  checks: HealthCheckItem[]
}

export interface HealthCheckItem {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message?: string
  responseTime?: number
  details?: Record<string, any>
}

// Response Types

export interface AgentResponse {
  success: boolean
  data?: InstalledAgent
  error?: string
}

export interface AgentListResponse {
  success: boolean
  data?: InstalledAgent[]
  meta?: {
    total: number
    businessId: string
  }
  error?: string
}

export interface AgentMetricsResponse {
  success: boolean
  data?: AgentMetrics
  error?: string
}

export interface AgentLogsResponse {
  success: boolean
  data?: AgentLogEntry[]
  meta?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  error?: string
}

// Service Interface Types

export interface AgentInstallOptions {
  agentId: string
  businessId: string
  userId: string
  config?: Record<string, any>
}

export interface AgentMetricsOptions {
  period: 'hour' | 'day' | 'week' | 'month'
  from?: Date
  to?: Date
}

export interface AgentLogsOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  limit: number
  offset: number
  from?: Date
  to?: Date
}

export interface AgentLogsResult {
  entries: AgentLogEntry[]
  total: number
}

// Database Schema Types

export interface AgentInstallationRecord {
  id: string
  agent_id: string
  name: string
  provider: string
  version: string
  business_id: string
  user_id: string
  status: string
  config: string // JSON string
  installed_at: Date
  updated_at: Date
  metadata: string // JSON string
}

export interface AgentMetricsRecord {
  id: string
  agent_installation_id: string
  timestamp: Date
  calls_processed: number
  successful_calls: number
  failed_calls: number
  response_time_ms: number
  cost_cents: number
  savings_cents: number
  created_at: Date
}

export interface AgentLogRecord {
  id: string
  agent_installation_id: string
  timestamp: Date
  level: string
  message: string
  context: string | null // JSON string
  error: string | null
  duration_ms: number | null
  action: string | null
  created_at: Date
}

// Marketplace Types (for future integration)

export interface MarketplaceAgent {
  id: string
  name: string
  provider: string
  version: string
  description: string
  category: string
  pricing: AgentPricing
  features: string[]
  requirements: AgentRequirements
  screenshots: string[]
  rating: number
  reviewCount: number
  installCount: number
  lastUpdated: Date
  status: 'active' | 'deprecated' | 'maintenance'
}

export interface AgentPricing {
  model: 'free' | 'subscription' | 'usage' | 'one-time'
  free?: boolean
  subscription?: {
    monthly: number
    yearly?: number
    limits: Record<string, number>
  }
  usage?: {
    perCall?: number
    perMessage?: number
    perMinute?: number
    freeLimit?: number
  }
  oneTime?: {
    price: number
  }
}

export interface AgentRequirements {
  permissions: string[]
  minimumPlan?: 'basic' | 'pro' | 'enterprise'
  integrations?: string[]
  resourceLimits?: {
    memory: number
    cpu: number
    storage: number
  }
}

// WebSocket Event Types

export interface AgentStatusEvent {
  type: 'agent-status'
  agentId: string
  status: 'running' | 'stopped' | 'error' | 'installing'
  timestamp: Date
  message?: string
}

export interface AgentMetricsEvent {
  type: 'agent-metrics'
  agentId: string
  metrics: Partial<AgentMetrics>
  timestamp: Date
}

export interface AgentLogEvent {
  type: 'agent-log'
  agentId: string
  log: AgentLogEntry
}

export interface AgentHealthEvent {
  type: 'agent-health'
  agentId: string
  health: AgentHealthCheck
}

export type AgentWebSocketEvent = 
  | AgentStatusEvent 
  | AgentMetricsEvent 
  | AgentLogEvent 
  | AgentHealthEvent

// Error Types

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentId?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AgentError'
  }
}

export class AgentNotFoundError extends AgentError {
  constructor(agentId: string) {
    super(`Agent not found: ${agentId}`, 'AGENT_NOT_FOUND', agentId)
    this.name = 'AgentNotFoundError'
  }
}

export class AgentAlreadyInstalledError extends AgentError {
  constructor(agentId: string, businessId: string) {
    super(
      `Agent ${agentId} is already installed for business ${businessId}`,
      'AGENT_ALREADY_INSTALLED',
      agentId,
      { businessId }
    )
    this.name = 'AgentAlreadyInstalledError'
  }
}

export class AgentInstallationError extends AgentError {
  constructor(agentId: string, reason: string, details?: Record<string, any>) {
    super(
      `Failed to install agent ${agentId}: ${reason}`,
      'AGENT_INSTALLATION_ERROR',
      agentId,
      details
    )
    this.name = 'AgentInstallationError'
  }
}

export class AgentConfigurationError extends AgentError {
  constructor(agentId: string, field: string, reason: string) {
    super(
      `Invalid configuration for agent ${agentId}: ${field} - ${reason}`,
      'AGENT_CONFIGURATION_ERROR',
      agentId,
      { field, reason }
    )
    this.name = 'AgentConfigurationError'
  }
}

export class AgentExecutionError extends AgentError {
  constructor(agentId: string, action: string, reason: string, details?: Record<string, any>) {
    super(
      `Agent execution failed: ${agentId}/${action} - ${reason}`,
      'AGENT_EXECUTION_ERROR',
      agentId,
      { action, reason, ...details }
    )
    this.name = 'AgentExecutionError'
  }
}