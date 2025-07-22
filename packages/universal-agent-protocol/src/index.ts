/**
 * Universal Agent Protocol (UAP)
 * 
 * The standard interface for all AI agents to integrate with the CRM platform.
 * This protocol enables seamless discovery, installation, and operation of AI agents.
 */

import { Observable } from 'rxjs';

// Core Data Types
export interface CRMData {
  type: 'contact' | 'lead' | 'message' | 'task' | 'note' | 'custom';
  action: 'create' | 'update' | 'delete' | 'read';
  data: Record<string, any>;
  metadata: {
    businessId: string;
    userId: string;
    timestamp: Date;
    correlationId?: string;
  };
}

export interface AgentData {
  type: 'response' | 'suggestion' | 'action' | 'insight' | 'error';
  data: Record<string, any>;
  metadata: {
    agentId: string;
    timestamp: Date;
    correlationId?: string;
    confidence?: number;
  };
}

// Pricing Models
export type PricingModel = 
  | { model: 'free' }
  | { model: 'fixed'; price: number; period: 'monthly' | 'yearly' }
  | { model: 'usage-based'; rate: number; unit: string }
  | { model: 'tiered'; tiers: Array<{ limit: number; price: number }> }
  | { model: 'freemium'; freeLimit: number; paidRate: number };

// Permission Types
export type Permission = 
  | 'contacts:read' | 'contacts:write' 
  | 'messages:read' | 'messages:write'
  | 'leads:read' | 'leads:write'
  | 'tasks:read' | 'tasks:write'
  | 'analytics:read'
  | 'webhooks:create'
  | 'integrations:manage';

// UI Components
export interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  action: () => Promise<void>;
  visible?: (context: any) => boolean;
  enabled?: (context: any) => boolean;
}

export interface DataRenderer {
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

export interface UIComponents {
  configPanel?: React.ComponentType<any>;
  dashboardWidget?: React.ComponentType<any>;
  detailsPanel?: React.ComponentType<any>;
  actionButtons?: ActionButton[];
}

// Agent Manifest
export interface AgentManifest {
  // Identity
  id: string;
  name: string;
  version: string;
  provider: {
    name: string;
    website?: string;
    support?: string;
  };
  
  // Description
  description: string;
  longDescription?: string;
  icon: string;
  screenshots?: string[];
  
  // Capabilities
  capabilities: string[];
  category: 'communication' | 'sales' | 'marketing' | 'analytics' | 'data' | 'automation' | 'other';
  tags?: string[];
  
  // Requirements
  permissions: Permission[];
  dependencies?: string[];
  minimumCRMVersion?: string;
  
  // Commercial
  pricing: PricingModel;
  termsUrl?: string;
  privacyUrl?: string;
  
  // Technical
  runtime: 'nodejs' | 'browser' | 'external';
  endpoints?: {
    webhook?: string;
    api?: string;
    websocket?: string;
  };
  
  // UI Integration
  ui?: UIComponents;
}

// Resource Limits
export interface ResourceLimits {
  maxMemoryMB: number;
  maxCPUPercent: number;
  maxStorageMB: number;
  maxAPICallsPerMinute: number;
  maxConcurrentTasks: number;
}

export interface ResourceUsage {
  memoryMB: number;
  cpuPercent: number;
  storageMB: number;
  apiCallsLastMinute: number;
  activeTasks: number;
}

// Agent Instance
export interface AgentInstance {
  id: string;
  agentId: string;
  businessId: string;
  status: 'installing' | 'active' | 'paused' | 'error' | 'uninstalling';
  installedAt: Date;
  lastActiveAt: Date;
  config?: Record<string, any>;
  resourceUsage?: ResourceUsage;
}

// Configuration Schema
export interface ConfigField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: Array<{ value: any; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ConfigSchema {
  fields: ConfigField[];
  layout?: 'simple' | 'grouped' | 'wizard';
  groups?: Array<{
    id: string;
    label: string;
    fields: string[];
  }>;
}

// Main Agent Interface
export interface UniversalAgentAdapter {
  // Metadata
  getManifest(): AgentManifest;
  getConfigSchema(): ConfigSchema;
  
  // Lifecycle
  install(businessId: string, config?: Record<string, any>): Promise<void>;
  connect(instanceId: string): Promise<void>;
  disconnect(instanceId: string): Promise<void>;
  uninstall(instanceId: string): Promise<void>;
  
  // Health & Status
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details?: any }>;
  getStatus(): Promise<{ connected: boolean; activeConnections: number; uptime: number }>;
  
  // Configuration
  validateConfig(config: Record<string, any>): Promise<{ valid: boolean; errors?: string[] }>;
  updateConfig(instanceId: string, config: Record<string, any>): Promise<void>;
  
  // Data Flow
  sendToAgent(instanceId: string, data: CRMData): Promise<void>;
  receiveFromAgent(instanceId: string): Observable<AgentData>;
  
  // Event Handling
  handleWebhook?(payload: any, headers: Record<string, string>): Promise<void>;
  subscribeToEvents?(eventTypes: string[]): void;
  
  // UI Integration
  getConfigUI?(): React.ComponentType<{ config: any; onChange: (config: any) => void }>;
  getActionButtons?(context: any): ActionButton[];
  getDataDisplay?(data: any): DataRenderer;
  getDashboardWidget?(): React.ComponentType<any>;
  
  // Resource Management
  getResourceUsage?(): Promise<ResourceUsage>;
  setResourceLimits?(limits: ResourceLimits): Promise<void>;
}

// Agent Registry Interface
export interface AgentRegistry {
  // Discovery
  listAgents(filters?: {
    category?: string;
    capabilities?: string[];
    search?: string;
  }): Promise<AgentManifest[]>;
  
  getAgent(agentId: string): Promise<AgentManifest>;
  
  // Installation
  installAgent(businessId: string, agentId: string, config?: any): Promise<AgentInstance>;
  uninstallAgent(instanceId: string): Promise<void>;
  
  // Management
  listInstalledAgents(businessId: string): Promise<AgentInstance[]>;
  getAgentInstance(instanceId: string): Promise<AgentInstance>;
  updateAgentConfig(instanceId: string, config: any): Promise<void>;
  
  // Runtime
  startAgent(instanceId: string): Promise<void>;
  stopAgent(instanceId: string): Promise<void>;
  restartAgent(instanceId: string): Promise<void>;
}

// Event Types
export interface CRMEvent {
  id: string;
  type: string;
  businessId: string;
  userId: string;
  timestamp: Date;
  data: any;
  source: 'user' | 'system' | 'agent';
  agentId?: string;
}

// Error Types
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class AgentConfigError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'AgentConfigError';
  }
}

export class AgentRuntimeError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'RUNTIME_ERROR', details);
    this.name = 'AgentRuntimeError';
  }
}

export class AgentPermissionError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'PERMISSION_ERROR', details);
    this.name = 'AgentPermissionError';
  }
}