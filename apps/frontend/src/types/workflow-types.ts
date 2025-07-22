import { LucideIcon } from 'lucide-react';

// Core workflow types
export type WorkflowNodeType = 
  | 'trigger' 
  | 'action' 
  | 'condition' 
  | 'delay' 
  | 'webhook'
  | 'api-call' 
  | 'ai-agent' 
  | 'email' 
  | 'whatsapp' 
  | 'database'
  | 'transform' 
  | 'split' 
  | 'merge' 
  | 'end';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed';
export type WorkflowCategory = 'lead-management' | 'automation' | 'analytics' | 'custom';
export type NodeCategory = 'triggers' | 'actions' | 'conditions' | 'utilities' | 'logic' | 'integrations' | 'ai' | 'communications' | 'data';

export interface WorkflowNodeInput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

export interface WorkflowNodeOutput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export interface WorkflowNodeData {
  name: string;
  description: string;
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'completed' | 'failed' | 'waiting';
  executionTime?: number;
  stats?: {
    executions: number;
    successRate: number;
  };
  inputs?: WorkflowNodeInput[];
  outputs?: WorkflowNodeOutput[];
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  workflowId: string;
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  workflowId?: string;
  animated?: boolean;
  style?: Record<string, any>;
  label?: string;
  status?: 'active' | 'error' | 'waiting';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  status: WorkflowStatus;
  isTemplate: boolean;
  category: WorkflowCategory;
  tags: string[];
  metadata: Record<string, any>;
}

export interface WorkflowBuilderState {
  workflow: Workflow;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
  draggedNodeType: WorkflowNodeType | null;
  history: any[];
  historyIndex: number;
  maxHistorySize: number;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WorkflowConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface WorkflowNodeDefinition {
  name: string;
  description: string;
  category: 'triggers' | 'actions' | 'conditions' | 'utilities';
  icon: LucideIcon;
  color?: string;
  inputs?: WorkflowNodeInput[];
  outputs?: WorkflowNodeOutput[];
  configSchema?: WorkflowConfigField[];
  isDisabled?: boolean;
  type?: WorkflowNodeType;
  label?: string;
  requiredPermissions?: string[];
  isAvailable?: boolean;
}

// Node definitions
export const WORKFLOW_NODE_DEFINITIONS: Record<WorkflowNodeType, WorkflowNodeDefinition> = {
  trigger: {
    name: 'Trigger',
    description: 'Start a workflow when something happens',
    category: 'triggers',
    icon: require('lucide-react').Zap,
    color: '#10b981',
    type: 'trigger',
    label: 'Trigger',
    requiredPermissions: [],
    isAvailable: true,
    outputs: [{ id: 'output', name: 'Triggered', type: 'object' }]
  },
  action: {
    name: 'Action',
    description: 'Perform an action or task',
    category: 'actions',
    icon: require('lucide-react').Play,
    color: '#3b82f6',
    type: 'action',
    label: 'Action',
    requiredPermissions: [],
    isAvailable: true,
    inputs: [{ id: 'input', name: 'Input', type: 'object', required: true }],
    outputs: [{ id: 'output', name: 'Result', type: 'object' }]
  },
  condition: {
    name: 'Condition',
    description: 'Branch workflow based on conditions',
    category: 'conditions',
    icon: require('lucide-react').GitBranch,
    color: '#eab308',
    type: 'condition',
    label: 'Condition',
    requiredPermissions: [],
    isAvailable: true,
    inputs: [{ id: 'input', name: 'Input', type: 'object', required: true }],
    outputs: [
      { id: 'true', name: 'True', type: 'object' },
      { id: 'false', name: 'False', type: 'object' }
    ]
  },
  delay: {
    name: 'Delay',
    description: 'Wait for a specified amount of time',
    category: 'utilities',
    icon: require('lucide-react').Clock,
    color: '#6b7280',
    type: 'delay',
    label: 'Delay',
    requiredPermissions: [],
    isAvailable: true,
    configSchema: [
      { key: 'duration', label: 'Duration (seconds)', type: 'number', required: true }
    ]
  },
  webhook: {
    name: 'Webhook',
    description: 'Send HTTP request to external service',
    category: 'actions',
    icon: require('lucide-react').Webhook,
    color: '#8b5cf6',
    type: 'webhook',
    label: 'Webhook',
    requiredPermissions: [],
    isAvailable: true
  },
  'api-call': {
    name: 'API Call',
    description: 'Make API requests to external services',
    category: 'actions',
    icon: require('lucide-react').Globe,
    color: '#6366f1',
    type: 'api-call',
    label: 'API Call',
    requiredPermissions: [],
    isAvailable: true
  },
  'ai-agent': {
    name: 'AI Agent',
    description: 'Use AI to process and analyze data',
    category: 'actions',
    icon: require('lucide-react').Bot,
    color: '#ec4899',
    type: 'ai-agent',
    label: 'AI Agent',
    requiredPermissions: ['ai_features'],
    isAvailable: true
  },
  email: {
    name: 'Email',
    description: 'Send email notifications',
    category: 'actions',
    icon: require('lucide-react').Mail,
    color: '#ef4444',
    type: 'email',
    label: 'Email',
    requiredPermissions: [],
    isAvailable: true
  },
  whatsapp: {
    name: 'WhatsApp',
    description: 'Send WhatsApp messages',
    category: 'actions',
    icon: require('lucide-react').MessageSquare,
    color: '#25d366',
    type: 'whatsapp',
    label: 'WhatsApp',
    requiredPermissions: [],
    isAvailable: true
  },
  database: {
    name: 'Database',
    description: 'Read/write data from database',
    category: 'actions',
    icon: require('lucide-react').Database,
    color: '#64748b',
    type: 'database',
    label: 'Database',
    requiredPermissions: [],
    isAvailable: true
  },
  transform: {
    name: 'Transform',
    description: 'Transform and manipulate data',
    category: 'utilities',
    icon: require('lucide-react').RefreshCw,
    color: '#f97316',
    type: 'transform',
    label: 'Transform',
    requiredPermissions: [],
    isAvailable: true
  },
  split: {
    name: 'Split',
    description: 'Split workflow into parallel paths',
    category: 'utilities',
    icon: require('lucide-react').Split,
    color: '#14b8a6',
    type: 'split',
    label: 'Split',
    requiredPermissions: [],
    isAvailable: true
  },
  merge: {
    name: 'Merge',
    description: 'Merge parallel workflow paths',
    category: 'utilities',
    icon: require('lucide-react').Merge,
    color: '#06b6d4',
    type: 'merge',
    label: 'Merge',
    requiredPermissions: [],
    isAvailable: true
  },
  end: {
    name: 'End',
    description: 'End the workflow execution',
    category: 'utilities',
    icon: require('lucide-react').StopCircle,
    color: '#ef4444',
    type: 'end',
    label: 'End',
    requiredPermissions: [],
    isAvailable: true,
    inputs: [{ id: 'input', name: 'Input', type: 'object', required: true }]
  }
};