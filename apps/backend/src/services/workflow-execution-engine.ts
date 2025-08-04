import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { WorkflowDefinition, WorkflowExecution, WorkflowNode } from './workflow-orchestrator';
import { WebSocket } from 'ws';

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  currentNodeId: string;
  data: Record<string, any>;
  variables: Record<string, any>;
  metadata: {
    startTime: Date;
    currentStep: number;
    totalSteps: number;
    userId?: string;
  };
}

export interface NodeExecutionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  nextNodes?: string[];
  shouldContinue: boolean;
}

export interface TriggerEvent {
  type: string;
  data: Record<string, any>;
  source: string;
  timestamp: Date;
}

/**
 * Advanced Workflow Execution Engine
 * Handles real-time workflow execution with proper node sequencing and data flow
 */
export class WorkflowExecutionEngine extends EventEmitter {
  private executionContexts = new Map<string, ExecutionContext>();
  private nodeExecutors = new Map<string, (node: WorkflowNode, context: ExecutionContext) => Promise<NodeExecutionResult>>();
  private triggerListeners = new Map<string, ((event: TriggerEvent) => Promise<void>)[]>();
  private wsConnections = new Set<WebSocket>();

  constructor() {
    super();
    this.initializeNodeExecutors();
    this.initializeTriggerSystem();
  }

  /**
   * Initialize node execution handlers for different node types
   */
  private initializeNodeExecutors() {
    // Trigger nodes (entry points)
    this.nodeExecutors.set('trigger', async (node, context) => {
      logger.info(`Trigger node executed: ${node.name}`, { nodeId: node.id, executionId: context.executionId });
      
      return {
        success: true,
        data: { triggerData: node.config, timestamp: new Date() },
        shouldContinue: true,
        nextNodes: this.getConnectedNodes(node.id, context.workflowId)
      };
    });

    // Action nodes (CRM operations)
    this.nodeExecutors.set('action', async (node, context) => {
      logger.info(`Action node executing: ${node.name}`, { nodeId: node.id, executionId: context.executionId });
      
      try {
        const result = await this.executeActionNode(node, context);
        
        return {
          success: true,
          data: result,
          shouldContinue: true,
          nextNodes: this.getConnectedNodes(node.id, context.workflowId)
        };
      } catch (error) {
        logger.error(`Action node failed: ${node.name}`, { error, nodeId: node.id });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldContinue: false
        };
      }
    });

    // Condition nodes (decision points)
    this.nodeExecutors.set('condition', async (node, context) => {
      logger.info(`Condition node evaluating: ${node.name}`, { nodeId: node.id, executionId: context.executionId });
      
      try {
        const conditionResult = await this.evaluateCondition(node, context);
        const nextNodes = this.getConditionalNextNodes(node.id, context.workflowId, conditionResult);
        
        return {
          success: true,
          data: { conditionResult, evaluatedAt: new Date() },
          shouldContinue: true,
          nextNodes
        };
      } catch (error) {
        logger.error(`Condition evaluation failed: ${node.name}`, { error, nodeId: node.id });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Condition evaluation failed',
          shouldContinue: false
        };
      }
    });

    // Delay nodes (wait/pause execution)
    this.nodeExecutors.set('delay', async (node, context) => {
      logger.info(`Delay node executing: ${node.name}`, { nodeId: node.id, executionId: context.executionId });
      
      const delayMs = node.config.delay || 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return {
        success: true,
        data: { delayMs, resumedAt: new Date() },
        shouldContinue: true,
        nextNodes: this.getConnectedNodes(node.id, context.workflowId)
      };
    });

    // AI nodes (LangGraph integration)
    this.nodeExecutors.set('ai', async (node, context) => {
      logger.info(`AI node executing: ${node.name}`, { nodeId: node.id, executionId: context.executionId });
      
      try {
        const aiResult = await this.executeAINode(node, context);
        
        return {
          success: true,
          data: aiResult,
          shouldContinue: true,
          nextNodes: this.getConnectedNodes(node.id, context.workflowId)
        };
      } catch (error) {
        logger.error(`AI node failed: ${node.name}`, { error, nodeId: node.id });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'AI processing failed',
          shouldContinue: false
        };
      }
    });
  }

  /**
   * Initialize trigger system for different event types
   */
  private initializeTriggerSystem() {
    // Contact added trigger
    this.registerTriggerListener('contact_added', async (event) => {
      await this.handleTriggerEvent('contact_added', event);
    });

    // Message received trigger
    this.registerTriggerListener('message_received', async (event) => {
      await this.handleTriggerEvent('message_received', event);
    });

    // Lead score change trigger
    this.registerTriggerListener('lead_score_change', async (event) => {
      await this.handleTriggerEvent('lead_score_change', event);
    });

    // Pipeline stage change trigger
    this.registerTriggerListener('pipeline_stage_change', async (event) => {
      await this.handleTriggerEvent('pipeline_stage_change', event);
    });

    // Manual trigger
    this.registerTriggerListener('manual', async (event) => {
      await this.handleTriggerEvent('manual', event);
    });

    // Webhook trigger
    this.registerTriggerListener('webhook', async (event) => {
      await this.handleTriggerEvent('webhook', event);
    });

    // Scheduled trigger
    this.registerTriggerListener('schedule', async (event) => {
      await this.handleTriggerEvent('schedule', event);
    });
  }

  /**
   * Execute a complete workflow from a trigger event
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    triggerData: Record<string, any>,
    triggeredBy: string = 'manual'
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      logs: [],
      input: triggerData,
      metadata: {
        triggeredBy,
        triggerType: 'execution'
      }
    };

    // Create execution context
    const context: ExecutionContext = {
      workflowId: workflow.id,
      executionId,
      currentNodeId: '',
      data: triggerData,
      variables: {},
      metadata: {
        startTime: new Date(),
        currentStep: 0,
        totalSteps: workflow.nodes.length,
        userId: triggeredBy
      }
    };

    this.executionContexts.set(executionId, context);

    try {
      // Find trigger nodes (entry points)
      const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger');
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow');
      }

      // Start execution from trigger nodes
      for (const triggerNode of triggerNodes) {
        await this.executeNodeSequence(triggerNode, workflow, context, execution);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.output = context.data;

      logger.info(`Workflow execution completed: ${executionId}`);
      this.emit('executionCompleted', execution);
      this.broadcastExecutionUpdate(execution);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.error = error instanceof Error ? error.message : String(error);

      logger.error(`Workflow execution failed: ${executionId}`, error);
      this.emit('executionFailed', execution);
      this.broadcastExecutionUpdate(execution);
    } finally {
      this.executionContexts.delete(executionId);
    }

    return execution;
  }

  /**
   * Execute a sequence of connected nodes
   */
  private async executeNodeSequence(
    startNode: WorkflowNode,
    workflow: WorkflowDefinition,
    context: ExecutionContext,
    execution: WorkflowExecution
  ): Promise<void> {
    const visited = new Set<string>();
    const nodeQueue = [startNode];

    while (nodeQueue.length > 0) {
      const currentNode = nodeQueue.shift()!;
      
      if (visited.has(currentNode.id)) {
        continue; // Prevent infinite loops
      }
      
      visited.add(currentNode.id);
      context.currentNodeId = currentNode.id;
      context.metadata.currentStep++;

      // Execute the current node
      const executor = this.nodeExecutors.get(currentNode.type);
      if (!executor) {
        throw new Error(`No executor found for node type: ${currentNode.type}`);
      }

      const result = await executor(currentNode, context);
      
      // Log execution step
      execution.logs.push({
        timestamp: new Date(),
        level: result.success ? 'info' : 'error',
        nodeId: currentNode.id,
        message: `Node ${currentNode.name} ${result.success ? 'completed' : 'failed'}`,
        data: result.data
      });

      // Update context data with result
      if (result.data) {
        context.data = { ...context.data, ...result.data };
      }

      // Broadcast real-time update
      this.broadcastNodeUpdate(execution.id, currentNode.id, result);

      // Stop execution if node failed and shouldn't continue
      if (!result.success || !result.shouldContinue) {
        if (!result.success) {
          throw new Error(result.error || `Node ${currentNode.name} failed`);
        }
        break;
      }

      // Queue next nodes for execution
      if (result.nextNodes) {
        const nextNodes = result.nextNodes
          .map(nodeId => workflow.nodes.find(n => n.id === nodeId))
          .filter((node): node is WorkflowNode => node !== undefined);
        
        nodeQueue.push(...nextNodes);
      }
    }
  }

  /**
   * Execute action node (CRM operations)
   */
  private async executeActionNode(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
    const actionType = node.config.actionType || 'generic';
    
    switch (actionType) {
      case 'send_message':
        return await this.executeSendMessageAction(node, context);
      
      case 'update_contact':
        return await this.executeUpdateContactAction(node, context);
      
      case 'create_task':
        return await this.executeCreateTaskAction(node, context);
      
      case 'send_notification':
        return await this.executeSendNotificationAction(node, context);
      
      case 'update_lead_score':
        return await this.executeUpdateLeadScoreAction(node, context);
      
      default:
        // Generic action execution
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
        return {
          actionType,
          processed: true,
          timestamp: new Date().toISOString(),
          nodeConfig: node.config
        };
    }
  }

  /**
   * Execute AI node (LangGraph integration)
   */
  private async executeAINode(node: WorkflowNode, _context: ExecutionContext): Promise<Record<string, any>> {
    const aiTask = node.config.task || 'generic';
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    switch (aiTask) {
      case 'sentiment_analysis':
        return {
          sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
          confidence: Math.random(),
          analysis: 'AI-generated sentiment analysis'
        };
      
      case 'lead_scoring':
        return {
          score: Math.floor(Math.random() * 100),
          factors: ['engagement', 'profile_completeness', 'activity'],
          recommendation: 'AI-generated scoring recommendation'
        };
      
      case 'personalization':
        return {
          personalizedContent: 'AI-generated personalized content',
          personalizationFactors: ['previous_interactions', 'preferences', 'behavior'],
          confidence: Math.random()
        };
      
      default:
        return {
          aiTask,
          result: 'AI processing completed',
          timestamp: new Date().toISOString(),
          model: node.config.model || 'default'
        };
    }
  }

  /**
   * Evaluate condition node
   */
  private async evaluateCondition(node: WorkflowNode, context: ExecutionContext): Promise<boolean> {
    const condition = node.config.condition || {};
    
    // Simple condition evaluation logic
    const { field, operator, value } = condition;
    const fieldValue = this.getFieldValue(field, context);
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'greater':
        return Number(fieldValue) > Number(value);
      case 'less':
        return Number(fieldValue) < Number(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return true; // Default to true for unknown operators
    }
  }

  /**
   * Get field value from context data
   */
  private getFieldValue(field: string, context: ExecutionContext): any {
    const parts = field.split('.');
    let value: any = context.data;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Get connected nodes from workflow edges
   */
  private getConnectedNodes(_nodeId: string, _workflowId: string): string[] {
    // This would typically query the workflow edges from the database
    // For now, we'll use a simple lookup
    return [];
  }

  /**
   * Get conditional next nodes based on condition result
   */
  private getConditionalNextNodes(_nodeId: string, _workflowId: string, _conditionResult: boolean): string[] {
    // This would typically find Yes/No paths from condition nodes
    return [];
  }

  /**
   * Register trigger event listener
   */
  private registerTriggerListener(triggerType: string, handler: (event: TriggerEvent) => Promise<void>) {
    if (!this.triggerListeners.has(triggerType)) {
      this.triggerListeners.set(triggerType, []);
    }
    this.triggerListeners.get(triggerType)!.push(handler);
  }

  /**
   * Handle trigger event
   */
  private async handleTriggerEvent(triggerType: string, event: TriggerEvent) {
    logger.info(`Trigger event received: ${triggerType}`, { event });
    
    // Find workflows that should be triggered by this event
    // This would typically query active workflows with matching triggers
    
    this.emit('triggerEvent', { triggerType, event });
  }

  /**
   * Trigger event from external source
   */
  async triggerEvent(triggerType: string, data: Record<string, any>, source: string = 'system') {
    const event: TriggerEvent = {
      type: triggerType,
      data,
      source,
      timestamp: new Date()
    };

    const listeners = this.triggerListeners.get(triggerType) || [];
    
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error) {
        logger.error(`Trigger listener failed for ${triggerType}:`, error);
      }
    }
  }

  /**
   * Action implementations
   */
  private async executeSendMessageAction(node: WorkflowNode, _context: ExecutionContext) {
    logger.info('Executing send message action', { nodeId: node.id });
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      action: 'send_message',
      recipient: node.config.recipient || 'default',
      message: node.config.message || 'Default message',
      sent: true,
      timestamp: new Date().toISOString()
    };
  }

  private async executeUpdateContactAction(node: WorkflowNode, context: ExecutionContext) {
    logger.info('Executing update contact action', { nodeId: node.id });
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      action: 'update_contact',
      contactId: context.data.contactId || 'unknown',
      updates: node.config.updates || {},
      updated: true,
      timestamp: new Date().toISOString()
    };
  }

  private async executeCreateTaskAction(node: WorkflowNode, _context: ExecutionContext) {
    logger.info('Executing create task action', { nodeId: node.id });
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      action: 'create_task',
      taskId: `task_${Date.now()}`,
      title: node.config.title || 'Generated task',
      description: node.config.description || 'Auto-generated task',
      created: true,
      timestamp: new Date().toISOString()
    };
  }

  private async executeSendNotificationAction(node: WorkflowNode, _context: ExecutionContext) {
    logger.info('Executing send notification action', { nodeId: node.id });
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      action: 'send_notification',
      notificationId: `notif_${Date.now()}`,
      title: node.config.title || 'Workflow notification',
      message: node.config.message || 'Notification from workflow',
      sent: true,
      timestamp: new Date().toISOString()
    };
  }

  private async executeUpdateLeadScoreAction(node: WorkflowNode, context: ExecutionContext) {
    logger.info('Executing update lead score action', { nodeId: node.id });
    await new Promise(resolve => setTimeout(resolve, 300));
    const scoreChange = node.config.scoreChange || 5;
    return {
      action: 'update_lead_score',
      leadId: context.data.leadId || 'unknown',
      scoreChange,
      newScore: (context.data.currentScore || 50) + scoreChange,
      updated: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * WebSocket management for real-time updates
   */
  addWebSocketConnection(ws: WebSocket) {
    this.wsConnections.add(ws);
    ws.on('close', () => {
      this.wsConnections.delete(ws);
    });
  }

  private broadcastExecutionUpdate(execution: WorkflowExecution) {
    const message = JSON.stringify({
      type: 'execution_update',
      data: execution
    });

    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  private broadcastNodeUpdate(executionId: string, nodeId: string, result: NodeExecutionResult) {
    const message = JSON.stringify({
      type: 'node_update',
      data: {
        executionId,
        nodeId,
        result,
        timestamp: new Date().toISOString()
      }
    });

    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Singleton instance
export const workflowExecutionEngine = new WorkflowExecutionEngine();
