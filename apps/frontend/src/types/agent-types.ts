/**
 * Agent Types for Frontend
 * Based on Universal Agent Protocol
 */

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
  icon?: string;
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
  
  // Marketplace specific
  rating?: number;
  reviews?: string;
  installs?: string;
  featured?: boolean;
  trending?: boolean;
  
  // Technical
  runtime?: 'nodejs' | 'browser' | 'external';
  endpoints?: {
    webhook?: string;
    api?: string;
    websocket?: string;
  };
}

export type Permission = 
  | 'contacts:read' | 'contacts:write' 
  | 'messages:read' | 'messages:write'
  | 'leads:read' | 'leads:write'
  | 'tasks:read' | 'tasks:write'
  | 'analytics:read'
  | 'webhooks:create'
  | 'integrations:manage';

export type PricingModel = 
  | { model: 'free' }
  | { model: 'fixed'; price: number; period: 'monthly' | 'yearly' }
  | { model: 'usage-based'; rate: number; unit: string }
  | { model: 'tiered'; tiers: Array<{ limit: number; price: number }> }
  | { model: 'freemium'; freeLimit: number; paidRate: number };

export interface AgentInstance {
  id: string;
  agentId: string;
  businessId: string;
  status: 'installing' | 'active' | 'paused' | 'error' | 'uninstalling';
  installedAt: Date;
  lastActiveAt: Date;
  config?: Record<string, any>;
}