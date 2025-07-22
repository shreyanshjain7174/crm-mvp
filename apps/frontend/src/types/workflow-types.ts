export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  businessId: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isTemplate: boolean;
  category: WorkflowCategory;
  tags: string[];
}

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

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type WorkflowCategory = 'sales' | 'marketing' | 'support' | 'operations' | 'general';

export interface WorkflowNodeData {
  label: string;
  description?: string;
  config: Record<string, any>;
  icon?: string;
  color?: string;
}

export interface WorkflowInput {
  id: string;
  name: string;
  type: WorkflowDataType;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface WorkflowOutput {
  id: string;
  name: string;
  type: WorkflowDataType;
  description?: string;
}

export type WorkflowDataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'object'
  | 'array'
  | 'file'
  | 'contact'
  | 'message'
  | 'lead';

export interface WorkflowVariable {
  id: string;
  name: string;
  type: WorkflowDataType;
  value: any;
  scope: 'global' | 'local';
  description?: string;
}

export interface WorkflowTrigger {
  id: string;
  type: WorkflowTriggerType;
  config: Record<string, any>;
  enabled: boolean;
}

export type WorkflowTriggerType = 
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'contact-created'
  | 'message-received'
  | 'lead-status-changed'
  | 'ai-suggestion'
  | 'email-received';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  triggerData: any;
  currentNodeId?: string;
  logs: WorkflowExecutionLog[];
  error?: string;
  variables: Record<string, any>;
}

export type WorkflowExecutionStatus = 
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface WorkflowExecutionLog {
  id: string;
  nodeId: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  duration?: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  workflow: Omit<Workflow, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>;
  previewImage?: string;
  usageCount: number;
  rating: number;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
}

// Workflow Builder State
export interface WorkflowBuilderState {
  workflow: Workflow;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isExecuting: boolean;
  executionId: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
  mode: 'edit' | 'view' | 'debug';
  showMinimap: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// Node Definitions for Drag & Drop Palette
export interface WorkflowNodeDefinition {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: NodeCategory;
  defaultConfig: Record<string, any>;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  isAvailable: boolean;
  requiredPermissions: string[];
}

export type NodeCategory = 
  | 'triggers'
  | 'actions'
  | 'logic'
  | 'integrations'
  | 'ai'
  | 'communications'
  | 'data';

// Predefined node configurations
export const WORKFLOW_NODE_DEFINITIONS: Record<WorkflowNodeType, WorkflowNodeDefinition> = {
  'trigger': {
    type: 'trigger',
    label: 'Trigger',
    description: 'Start point for the workflow',
    icon: 'Play',
    color: '#10B981',
    category: 'triggers',
    defaultConfig: { triggerType: 'manual' },
    inputs: [],
    outputs: [{ id: 'output', name: 'Triggered', type: 'object' }],
    isAvailable: true,
    requiredPermissions: []
  },
  'action': {
    type: 'action',
    label: 'Action',
    description: 'Perform a specific action',
    icon: 'Zap',
    color: '#3B82F6',
    category: 'actions',
    defaultConfig: { actionType: 'custom' },
    inputs: [{ id: 'input', name: 'Input', type: 'object', required: true }],
    outputs: [{ id: 'output', name: 'Result', type: 'object' }],
    isAvailable: true,
    requiredPermissions: []
  },
  'condition': {
    type: 'condition',
    label: 'Condition',
    description: 'Branch based on conditions',
    icon: 'GitBranch',
    color: '#F59E0B',
    category: 'logic',
    defaultConfig: { operator: 'equals', value: '' },
    inputs: [{ id: 'input', name: 'Input', type: 'object', required: true }],
    outputs: [
      { id: 'true', name: 'True', type: 'object' },
      { id: 'false', name: 'False', type: 'object' }
    ],
    isAvailable: true,
    requiredPermissions: []
  },
  'delay': {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for a specified time',
    icon: 'Clock',
    color: '#8B5CF6',
    category: 'logic',
    defaultConfig: { duration: 60, unit: 'seconds' },
    inputs: [{ id: 'input', name: 'Input', type: 'object', required: true }],
    outputs: [{ id: 'output', name: 'After Delay', type: 'object' }],
    isAvailable: true,
    requiredPermissions: []
  },
  'webhook': {
    type: 'webhook',
    label: 'Webhook',
    description: 'Call external webhook',
    icon: 'Webhook',
    color: '#EF4444',
    category: 'integrations',
    defaultConfig: { url: '', method: 'POST', headers: {} },
    inputs: [{ id: 'input', name: 'Payload', type: 'object', required: false }],
    outputs: [{ id: 'output', name: 'Response', type: 'object' }],
    isAvailable: true,
    requiredPermissions: ['webhooks:send']
  },
  'api-call': {
    type: 'api-call',
    label: 'API Call',
    description: 'Make HTTP API requests',
    icon: 'Globe',
    color: '#06B6D4',
    category: 'integrations',
    defaultConfig: { endpoint: '', method: 'GET', authentication: 'none' },
    inputs: [{ id: 'input', name: 'Parameters', type: 'object', required: false }],
    outputs: [{ id: 'output', name: 'Response', type: 'object' }],
    isAvailable: true,
    requiredPermissions: ['api:call']
  },
  'ai-agent': {
    type: 'ai-agent',
    label: 'AI Agent',
    description: 'Process with AI intelligence',
    icon: 'Brain',
    color: '#EC4899',
    category: 'ai',
    defaultConfig: { model: 'gpt-4', prompt: '', temperature: 0.7 },
    inputs: [{ id: 'input', name: 'Context', type: 'object', required: true }],
    outputs: [{ id: 'output', name: 'AI Response', type: 'object' }],
    isAvailable: true,
    requiredPermissions: ['ai:process']
  },
  'email': {
    type: 'email',
    label: 'Send Email',
    description: 'Send email messages',
    icon: 'Mail',
    color: '#DC2626',
    category: 'communications',
    defaultConfig: { template: '', subject: '', to: '' },
    inputs: [
      { id: 'contact', name: 'Contact', type: 'contact', required: true },
      { id: 'data', name: 'Template Data', type: 'object', required: false }
    ],
    outputs: [{ id: 'output', name: 'Sent', type: 'object' }],
    isAvailable: true,
    requiredPermissions: ['email:send']
  },
  'whatsapp': {
    type: 'whatsapp',
    label: 'WhatsApp Message',
    description: 'Send WhatsApp messages',
    icon: 'MessageCircle',
    color: '#16A34A',
    category: 'communications',
    defaultConfig: { template: '', message: '' },
    inputs: [
      { id: 'contact', name: 'Contact', type: 'contact', required: true },
      { id: 'message', name: 'Message', type: 'string', required: true }
    ],
    outputs: [{ id: 'output', name: 'Sent', type: 'object' }],
    isAvailable: true,
    requiredPermissions: ['whatsapp:send']
  },
  'database': {
    type: 'database',
    label: 'Database Query',
    description: 'Query or update database',
    icon: 'Database',
    color: '#7C3AED',
    category: 'data',
    defaultConfig: { operation: 'select', table: '', conditions: {} },
    inputs: [{ id: 'input', name: 'Query Data', type: 'object', required: false }],
    outputs: [{ id: 'output', name: 'Result', type: 'array' }],
    isAvailable: true,
    requiredPermissions: ['database:query']
  },
  'transform': {
    type: 'transform',
    label: 'Transform Data',
    description: 'Transform and map data',
    icon: 'Shuffle',
    color: '#059669',
    category: 'data',
    defaultConfig: { transformations: [] },
    inputs: [{ id: 'input', name: 'Data', type: 'object', required: true }],
    outputs: [{ id: 'output', name: 'Transformed', type: 'object' }],
    isAvailable: true,
    requiredPermissions: []
  },
  'split': {
    type: 'split',
    label: 'Split Flow',
    description: 'Split into parallel paths',
    icon: 'Split',
    color: '#D97706',
    category: 'logic',
    defaultConfig: { paths: 2 },
    inputs: [{ id: 'input', name: 'Input', type: 'object', required: true }],
    outputs: [
      { id: 'path1', name: 'Path 1', type: 'object' },
      { id: 'path2', name: 'Path 2', type: 'object' }
    ],
    isAvailable: true,
    requiredPermissions: []
  },
  'merge': {
    type: 'merge',
    label: 'Merge Flows',
    description: 'Merge parallel paths',
    icon: 'Merge',
    color: '#7C2D12',
    category: 'logic',
    defaultConfig: { strategy: 'wait-all' },
    inputs: [
      { id: 'input1', name: 'Input 1', type: 'object', required: true },
      { id: 'input2', name: 'Input 2', type: 'object', required: true }
    ],
    outputs: [{ id: 'output', name: 'Merged', type: 'object' }],
    isAvailable: true,
    requiredPermissions: []
  },
  'end': {
    type: 'end',
    label: 'End',
    description: 'End point of the workflow',
    icon: 'Square',
    color: '#6B7280',
    category: 'logic',
    defaultConfig: {},
    inputs: [{ id: 'input', name: 'Final Data', type: 'object', required: false }],
    outputs: [],
    isAvailable: true,
    requiredPermissions: []
  }
};

// Workflow validation
export interface WorkflowValidationResult {
  isValid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

export interface WorkflowValidationError {
  id: string;
  type: 'missing-trigger' | 'disconnected-node' | 'invalid-config' | 'circular-dependency';
  nodeId?: string;
  message: string;
}

export interface WorkflowValidationWarning {
  id: string;
  type: 'unused-node' | 'missing-end' | 'performance' | 'best-practice';
  nodeId?: string;
  message: string;
}