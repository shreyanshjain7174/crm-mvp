/**
 * Universal Agent Protocol (UAP) - Core Interfaces
 * 
 * These interfaces define how AI agents integrate with our CRM platform.
 * Every AI agent must implement these contracts to work with our system.
 */

import { Observable } from 'rxjs'
import type {
  AgentManifest,
  AgentConfig,
  AgentInstance,
  CRMData,
  AgentData,
  CRMEvent,
  AgentEvent,
  SecurityContext,
  ResourceLimits,
  ResourceUsage,
  UIComponents,
  ActionButton,
  DataDisplay,
  ConfigSchema
} from './types'

// =============================================================================
// Core Agent Interface - EVERY AGENT MUST IMPLEMENT
// =============================================================================

/**
 * Universal Agent Adapter
 * 
 * This is the main interface that ALL AI agents must implement to integrate
 * with our CRM platform. It provides:
 * - Lifecycle management (connect, disconnect, install, uninstall)
 * - Data flow (send to agent, receive from agent)
 * - UI integration (config forms, action buttons, data displays)
 * - Event handling (CRM events to agent events)
 */
export interface UniversalAgentAdapter {
  // =============================================================================
  // Agent Metadata & Identification
  // =============================================================================
  
  /** Get agent manifest with capabilities and requirements */
  getManifest(): AgentManifest
  
  /** Get current agent configuration */
  getConfig(): AgentConfig
  
  /** Get agent capabilities list */
  getCapabilities(): string[]
  
  // =============================================================================
  // Lifecycle Management
  // =============================================================================
  
  /** Initialize and connect the agent */
  connect(config: AgentConfig, context: SecurityContext): Promise<void>
  
  /** Gracefully disconnect the agent */
  disconnect(): Promise<void>
  
  /** Install the agent with initial configuration */
  install(config: Record<string, any>, context: SecurityContext): Promise<AgentInstance>
  
  /** Uninstall the agent and cleanup resources */
  uninstall(agentId: string): Promise<void>
  
  /** Update agent configuration */
  updateConfig(config: Record<string, any>): Promise<void>
  
  /** Health check - verify agent is operational */
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details?: string }>
  
  // =============================================================================
  // Data Flow - Core Platform Integration
  // =============================================================================
  
  /** Send data from CRM to agent */
  sendToAgent(data: CRMData): Promise<void>
  
  /** Receive data from agent as observable stream */
  receiveFromAgent(): Observable<AgentData>
  
  /** Process CRM event and potentially return agent actions */
  processEvent(event: CRMEvent): Promise<AgentEvent[]>
  
  /** Query agent for specific data or insights */
  query(query: string, context?: Record<string, any>): Promise<any>
  
  // =============================================================================
  // UI Integration - Native CRM Experience  
  // =============================================================================
  
  /** Get React component for agent configuration */
  getConfigUI(): string | null
  
  /** Get action buttons to show in CRM interface */
  getActionButtons(): ActionButton[]
  
  /** Get data display components for agent-specific data */
  getDataDisplay(): DataDisplay[]
  
  /** Get configuration schema for auto-generated forms */
  getConfigSchema(): ConfigSchema | null
  
  /** Handle UI action triggered by user */
  handleUIAction(action: string, context: Record<string, any>): Promise<any>
  
  // =============================================================================
  // Resource Management & Monitoring
  // =============================================================================
  
  /** Get current resource usage */
  getResourceUsage(): Promise<ResourceUsage>
  
  /** Set resource limits for this agent */
  setResourceLimits(limits: ResourceLimits): Promise<void>
  
  /** Get performance metrics */
  getMetrics(): Promise<Record<string, number>>
  
  // =============================================================================
  // Error Handling & Logging
  // =============================================================================
  
  /** Handle errors gracefully */
  onError(error: Error): Promise<void>
  
  /** Get recent logs */
  getLogs(limit?: number): Promise<string[]>
  
  /** Set log level */
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void
}

// =============================================================================
// Agent Registry - Platform Service Interface
// =============================================================================

/**
 * Agent Registry manages all installed agents and their lifecycle
 */
export interface AgentRegistry {
  /** Install a new agent */
  install(manifest: AgentManifest, config: Record<string, any>, businessId: string): Promise<AgentInstance>
  
  /** Uninstall an agent */
  uninstall(agentId: string, businessId: string): Promise<void>
  
  /** Get all installed agents for a business */
  getInstalledAgents(businessId: string): Promise<AgentInstance[]>
  
  /** Get specific agent instance */
  getAgent(agentId: string, businessId: string): Promise<AgentInstance | null>
  
  /** Update agent configuration */
  updateAgentConfig(agentId: string, businessId: string, config: Record<string, any>): Promise<void>
  
  /** Start an agent */
  startAgent(agentId: string, businessId: string): Promise<void>
  
  /** Stop an agent */
  stopAgent(agentId: string, businessId: string): Promise<void>
  
  /** Get agent status */
  getAgentStatus(agentId: string, businessId: string): Promise<'running' | 'stopped' | 'error'>
}

// =============================================================================
// Event Bus - Real-time Communication
// =============================================================================

/**
 * Event Bus handles real-time communication between CRM and agents
 */
export interface EventBus {
  /** Publish CRM event to all subscribed agents */
  publishCRMEvent(event: CRMEvent): Promise<void>
  
  /** Publish agent event to CRM */
  publishAgentEvent(event: AgentEvent): Promise<void>
  
  /** Subscribe agent to specific event types */
  subscribe(agentId: string, eventTypes: string[]): Promise<void>
  
  /** Unsubscribe agent from events */
  unsubscribe(agentId: string): Promise<void>
  
  /** Get event stream for agent */
  getEventStream(agentId: string): Observable<CRMEvent>
  
  /** Get agent event stream for CRM */
  getAgentEventStream(businessId: string): Observable<AgentEvent>
}

// =============================================================================
// Data Sync - Universal Data Layer
// =============================================================================

/**
 * Data Sync ensures all agents have consistent view of CRM data
 */
export interface DataSyncService {
  /** Sync data to agent */
  syncToAgent(agentId: string, dataType: string, data: any): Promise<void>
  
  /** Sync data from agent to CRM */
  syncFromAgent(agentId: string, dataType: string, data: any): Promise<void>
  
  /** Get latest data for agent */
  getLatestData(agentId: string, dataType: string): Promise<any>
  
  /** Handle data conflicts between agents */
  resolveConflict(dataType: string, conflicts: any[]): Promise<any>
  
  /** Start real-time sync for agent */
  startSync(agentId: string, dataTypes: string[]): Promise<void>
  
  /** Stop sync for agent */
  stopSync(agentId: string): Promise<void>
}

// =============================================================================
// Permission Manager - Security & Access Control
// =============================================================================

/**
 * Permission Manager handles access control for agents
 */
export interface PermissionManager {
  /** Check if agent has permission for action */
  hasPermission(agentId: string, action: string, resource: string): Promise<boolean>
  
  /** Grant permission to agent */
  grantPermission(agentId: string, action: string, resource: string): Promise<void>
  
  /** Revoke permission from agent */
  revokePermission(agentId: string, action: string, resource: string): Promise<void>
  
  /** Get all permissions for agent */
  getPermissions(agentId: string): Promise<string[]>
  
  /** Create security context for agent */
  createSecurityContext(agentId: string, businessId: string, userId: string): Promise<SecurityContext>
  
  /** Validate security context */
  validateContext(context: SecurityContext): Promise<boolean>
}

// =============================================================================
// Agent Marketplace - Discovery & Installation
// =============================================================================

/**
 * Agent Marketplace provides discovery and installation UI
 */
export interface AgentMarketplace {
  /** Search for agents */
  searchAgents(query: string, filters?: Record<string, any>): Promise<AgentManifest[]>
  
  /** Get featured agents */
  getFeaturedAgents(): Promise<AgentManifest[]>
  
  /** Get agent categories */
  getCategories(): Promise<string[]>
  
  /** Get agents in category */
  getAgentsByCategory(category: string): Promise<AgentManifest[]>
  
  /** Get agent details */
  getAgentDetails(agentId: string): Promise<AgentManifest>
  
  /** Install agent from marketplace */
  installFromMarketplace(agentId: string, businessId: string, config: Record<string, any>): Promise<AgentInstance>
  
  /** Get installation statistics */
  getInstallStats(agentId: string): Promise<{ installs: number, rating: number, reviews: number }>
}

// =============================================================================
// Billing & Usage Tracking
// =============================================================================

/**
 * Billing Service handles usage tracking and payments
 */
export interface BillingService {
  /** Track agent usage */
  trackUsage(agentId: string, businessId: string, usage: Record<string, number>): Promise<void>
  
  /** Get usage summary */
  getUsageSummary(agentId: string, businessId: string, period: 'day' | 'week' | 'month'): Promise<ResourceUsage>
  
  /** Calculate bill for agent */
  calculateBill(agentId: string, businessId: string, period: 'month' | 'year'): Promise<number>
  
  /** Process payment */
  processPayment(businessId: string, amount: number, agentId?: string): Promise<boolean>
  
  /** Get billing history */
  getBillingHistory(businessId: string): Promise<any[]>
}

// =============================================================================
// Developer SDK - For Agent Developers
// =============================================================================

/**
 * Developer SDK provides tools for building agents
 */
export interface DeveloperSDK {
  /** Create new agent template */
  createAgentTemplate(type: 'webhook' | 'polling' | 'realtime'): string
  
  /** Validate agent manifest */
  validateManifest(manifest: AgentManifest): { valid: boolean, errors: string[] }
  
  /** Test agent locally */
  testAgent(adapter: UniversalAgentAdapter, testData: CRMData[]): Promise<{ success: boolean, results: any[] }>
  
  /** Generate UI components */
  generateUI(schema: ConfigSchema): string
  
  /** Deploy agent to marketplace */
  deployAgent(manifest: AgentManifest, adapter: UniversalAgentAdapter): Promise<{ agentId: string, status: string }>
  
  /** Get development tools */
  getDevTools(): Promise<{ debugger: any, logger: any, monitor: any }>
}