import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { cacheService } from './cache-service';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  type: 'n8n' | 'langgraph' | 'hybrid';
  status: 'active' | 'inactive' | 'draft';
  triggers: WorkflowTrigger[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
  };
  settings: {
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffType: 'fixed' | 'exponential';
      delay: number;
    };
    errorHandling: 'continue' | 'stop' | 'retry';
  };
}

export interface WorkflowTrigger {
  id: string;
  type: 'webhook' | 'schedule' | 'event' | 'manual';
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
}

export interface WorkflowNode {
  id: string;
  type: 'action' | 'condition' | 'transform' | 'ai' | 'integration';
  engine: 'n8n' | 'langgraph';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'in' | 'exists';
  value: any;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs: WorkflowLog[];
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  metadata: {
    triggeredBy: string;
    triggerType: string;
    parentExecutionId?: string;
  };
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  nodeId?: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Hybrid Workflow Orchestration Service
 * Manages both n8n and LangGraph workflows in a unified system
 */
export class WorkflowOrchestrator extends EventEmitter {
  private workflows = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();
  private activeExecutions = new Set<string>();

  constructor() {
    super();
    this.initializeOrchestrator();
  }

  private async initializeOrchestrator() {
    try {
      // Load workflows from cache/database
      await this.loadWorkflows();
      
      // Initialize n8n connection
      await this.initializeN8N();
      
      // Initialize LangGraph runtime
      await this.initializeLangGraph();
      
      logger.info('Workflow orchestrator initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize workflow orchestrator:', error);
      throw error;
    }
  }

  /**
   * Create a new workflow definition
   */
  async createWorkflow(workflow: Omit<WorkflowDefinition, 'id' | 'metadata'>): Promise<WorkflowDefinition> {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullWorkflow: WorkflowDefinition = {
      ...workflow,
      id: workflowId,
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system', // TODO: Get from auth context
        tags: workflow.type === 'n8n' ? ['business', 'automation'] : ['ai', 'intelligent']
      }
    };

    // Validate workflow definition
    this.validateWorkflow(fullWorkflow);

    // Store workflow
    this.workflows.set(workflowId, fullWorkflow);
    await this.persistWorkflow(fullWorkflow);

    // Deploy to appropriate engine
    await this.deployWorkflow(fullWorkflow);

    logger.info(`Created workflow: ${workflowId}`);
    this.emit('workflowCreated', fullWorkflow);

    return fullWorkflow;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string, 
    input: Record<string, any> = {},
    triggeredBy: string = 'manual'
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow is not active: ${workflowId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: new Date(),
      logs: [],
      input,
      metadata: {
        triggeredBy,
        triggerType: 'manual'
      }
    };

    this.executions.set(executionId, execution);
    this.activeExecutions.add(executionId);

    try {
      // Route to appropriate engine based on workflow type
      const result = await this.routeExecution(workflow, execution, input);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.output = result;

      logger.info(`Workflow execution completed: ${executionId}`);
      this.emit('executionCompleted', execution);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.error = error instanceof Error ? error.message : String(error);

      logger.error(`Workflow execution failed: ${executionId}`, error);
      this.emit('executionFailed', execution);
    } finally {
      this.activeExecutions.delete(executionId);
      await this.persistExecution(execution);
    }

    return execution;
  }

  /**
   * Route execution to appropriate engine
   */
  private async routeExecution(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    this.addExecutionLog(execution, 'info', undefined, `Starting ${workflow.type} workflow execution`);

    switch (workflow.type) {
      case 'n8n':
        return await this.executeN8NWorkflow(workflow, execution, input);
      
      case 'langgraph':
        return await this.executeLangGraphWorkflow(workflow, execution, input);
      
      case 'hybrid':
        return await this.executeHybridWorkflow(workflow, execution, input);
      
      default:
        throw new Error(`Unsupported workflow type: ${workflow.type}`);
    }
  }

  /**
   * Execute n8n workflow
   */
  private async executeN8NWorkflow(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    this.addExecutionLog(execution, 'info', undefined, 'Executing n8n workflow');
    
    // TODO: Implement actual n8n API integration
    // For now, simulate n8n execution
    await this.simulateWorkflowExecution(workflow, execution, input);
    
    return {
      success: true,
      processed: input,
      timestamp: new Date().toISOString(),
      engine: 'n8n'
    };
  }

  /**
   * Execute LangGraph workflow
   */
  private async executeLangGraphWorkflow(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    this.addExecutionLog(execution, 'info', undefined, 'Executing LangGraph workflow');
    
    // TODO: Implement actual LangGraph integration
    // For now, simulate AI workflow execution
    await this.simulateAIWorkflowExecution(workflow, execution, input);
    
    return {
      success: true,
      aiProcessed: input,
      insights: ['Generated AI insights', 'Automated response suggestions'],
      timestamp: new Date().toISOString(),
      engine: 'langgraph'
    };
  }

  /**
   * Execute hybrid workflow (combination of n8n and LangGraph)
   */
  private async executeHybridWorkflow(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    this.addExecutionLog(execution, 'info', undefined, 'Executing hybrid workflow');
    
    const results: Record<string, any> = {};
    
    // Execute n8n nodes first (business logic)
    const n8nNodes = workflow.nodes.filter(node => node.engine === 'n8n');
    if (n8nNodes.length > 0) {
      this.addExecutionLog(execution, 'info', undefined, 'Processing business logic nodes');
      const n8nResult = await this.executeN8NWorkflow(workflow, execution, input);
      results.businessLogic = n8nResult;
    }
    
    // Execute LangGraph nodes (AI processing)
    const langGraphNodes = workflow.nodes.filter(node => node.engine === 'langgraph');
    if (langGraphNodes.length > 0) {
      this.addExecutionLog(execution, 'info', undefined, 'Processing AI nodes');
      const aiResult = await this.executeLangGraphWorkflow(workflow, execution, { ...input, ...results });
      results.aiProcessing = aiResult;
    }
    
    return {
      success: true,
      hybrid: true,
      results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List all workflows
   */
  listWorkflows(filters?: { type?: string; status?: string; tags?: string[] }): WorkflowDefinition[] {
    let workflows = Array.from(this.workflows.values());
    
    if (filters) {
      if (filters.type) {
        workflows = workflows.filter(w => w.type === filters.type);
      }
      if (filters.status) {
        workflows = workflows.filter(w => w.status === filters.status);
      }
      if (filters.tags?.length) {
        workflows = workflows.filter(w => 
          filters.tags!.some(tag => w.metadata.tags.includes(tag))
        );
      }
    }
    
    return workflows;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * List executions for a workflow
   */
  listExecutions(workflowId?: string, limit: number = 100): WorkflowExecution[] {
    let executions = Array.from(this.executions.values());
    
    if (workflowId) {
      executions = executions.filter(e => e.workflowId === workflowId);
    }
    
    return executions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(): Promise<Record<string, any>> {
    const workflows = Array.from(this.workflows.values());
    const executions = Array.from(this.executions.values());
    
    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'active').length,
      workflowsByType: {
        n8n: workflows.filter(w => w.type === 'n8n').length,
        langgraph: workflows.filter(w => w.type === 'langgraph').length,
        hybrid: workflows.filter(w => w.type === 'hybrid').length
      },
      totalExecutions: executions.length,
      runningExecutions: this.activeExecutions.size,
      executionsByStatus: {
        completed: executions.filter(e => e.status === 'completed').length,
        failed: executions.filter(e => e.status === 'failed').length,
        running: executions.filter(e => e.status === 'running').length
      },
      averageExecutionTime: this.calculateAverageExecutionTime(executions)
    };
  }

  // Private helper methods
  private validateWorkflow(workflow: WorkflowDefinition) {
    if (!workflow.name?.trim()) {
      throw new Error('Workflow name is required');
    }
    if (!workflow.nodes?.length) {
      throw new Error('Workflow must have at least one node');
    }
    if (!workflow.triggers?.length) {
      throw new Error('Workflow must have at least one trigger');
    }
  }

  private async loadWorkflows() {
    // TODO: Load from database
    logger.info('Loading workflows from storage');
  }

  private async initializeN8N() {
    // TODO: Initialize n8n connection
    logger.info('Initializing n8n integration');
  }

  private async initializeLangGraph() {
    // TODO: Initialize LangGraph runtime
    logger.info('Initializing LangGraph integration');
  }

  private async deployWorkflow(workflow: WorkflowDefinition) {
    // TODO: Deploy to appropriate engine
    logger.info(`Deploying workflow to ${workflow.type}: ${workflow.id}`);
  }

  private async persistWorkflow(workflow: WorkflowDefinition) {
    const cacheKey = `workflow:${workflow.id}`;
    await cacheService.set(cacheKey, workflow, { ttl: 3600 });
  }

  private async persistExecution(execution: WorkflowExecution) {
    const cacheKey = `execution:${execution.id}`;
    await cacheService.set(cacheKey, execution, { ttl: 86400 });
  }

  private addExecutionLog(
    execution: WorkflowExecution,
    level: 'info' | 'warn' | 'error' | 'debug',
    nodeId: string | undefined,
    message: string,
    data?: Record<string, any>
  ) {
    const log: WorkflowLog = {
      timestamp: new Date(),
      level,
      nodeId,
      message,
      data
    };
    
    execution.logs.push(log);
    logger[level](`[${execution.id}] ${message}`, data);
  }

  private async simulateWorkflowExecution(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    _input: Record<string, any>
  ) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate node execution
    for (const node of workflow.nodes) {
      this.addExecutionLog(execution, 'info', node.id, `Processing node: ${node.name}`);
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    }
  }

  private async simulateAIWorkflowExecution(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    _input: Record<string, any>
  ) {
    // Simulate AI processing time (longer for AI operations)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simulate AI node execution
    for (const node of workflow.nodes.filter(n => n.engine === 'langgraph')) {
      this.addExecutionLog(execution, 'info', node.id, `Processing AI node: ${node.name}`);
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    }
  }

  private calculateAverageExecutionTime(executions: WorkflowExecution[]): number {
    const completedExecutions = executions.filter(e => e.duration);
    if (completedExecutions.length === 0) return 0;
    
    const totalTime = completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0);
    return Math.round(totalTime / completedExecutions.length);
  }
}

// Singleton instance
export const workflowOrchestrator = new WorkflowOrchestrator();