// AI Agent Types
export interface AgentTask {
  id: string;
  type: string;
  input: any;
  output?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface AgentCapabilities {
  canProcessText: boolean;
  canGenerateContent: boolean;
  canAnalyze: boolean;
  canDecide: boolean;
}

export interface AgentConfig {
  name: string;
  description: string;
  capabilities: AgentCapabilities;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface WorkflowContext {
  leadId?: string;
  messageId?: string;
  userId?: string;
  businessContext?: any;
  previousSteps?: any[];
  currentStep?: string;
  trigger?: any;
  variables?: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  requiresApproval?: boolean;
  dependencies?: string[];
  retryCount?: number;
  maxRetries?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  context: WorkflowContext;
  steps: WorkflowStep[];
  nodes: WorkflowNode[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  agentType?: string;
  config?: any;
  dependencies?: string[];
  position?: { x: number; y: number };
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: any;
  currentNode?: string;
  leadId?: string;
  userId?: string;
}

export enum AgentType {
  INTENT_RECOGNITION = 'intent_recognition',
  LEAD_QUALIFICATION = 'lead_qualification',
  RESPONSE_GENERATION = 'response_generation',
  FOLLOW_UP_SCHEDULER = 'follow_up_scheduler',
  CONTEXT_MEMORY = 'context_memory'
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  reasoning?: string;
}