import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AIAgentFactory } from './ai-agent-factory';
import { WorkflowNode, WorkflowExecution, ExecutionContext } from './types';

export class WorkflowExecutor extends EventEmitter {
  private prisma: PrismaClient;
  private agentFactory: AIAgentFactory;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.agentFactory = new AIAgentFactory();
  }

  async executeWorkflow(workflowId: string, triggerData: any, leadId?: string): Promise<string> {
    // Get workflow definition
    const workflow = await this.prisma.agentWorkflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow || !workflow.isActive) {
      throw new Error('Workflow not found or inactive');
    }

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        id: uuidv4(),
        workflowId,
        leadId,
        status: 'RUNNING',
        context: JSON.stringify({
          trigger: triggerData,
          variables: {},
          currentStep: 0
        }),
        startedAt: new Date()
      }
    });

    // Parse workflow nodes
    const nodes: WorkflowNode[] = JSON.parse(workflow.nodes);
    const startNode = nodes.find(node => node.type === 'trigger');

    if (!startNode) {
      throw new Error('No trigger node found in workflow');
    }

    // Start execution
    this.activeExecutions.set(execution.id, {
      id: execution.id,
      workflowId,
      nodes,
      currentNode: startNode,
      context: {
        trigger: triggerData,
        variables: {},
        leadId,
        executionId: execution.id
      },
      status: 'RUNNING'
    });

    // Execute workflow asynchronously
    this.executeNode(execution.id, startNode.id);

    // Emit event
    this.emit('workflow:started', { executionId: execution.id, workflowId, leadId });

    return execution.id;
  }

  private async executeNode(executionId: string, nodeId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const node = execution.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    // Create execution step
    const step = await this.prisma.executionStep.create({
      data: {
        id: uuidv4(),
        executionId,
        nodeId,
        nodeType: node.type,
        status: 'RUNNING',
        input: JSON.stringify(execution.context),
        startedAt: new Date()
      }
    });

    try {
      let result: any;

      // Execute based on node type
      switch (node.type) {
        case 'trigger':
          result = await this.executeTrigger(node, execution.context);
          break;
        case 'ai_agent':
          result = await this.executeAIAgent(node, execution.context);
          break;
        case 'condition':
          result = await this.executeCondition(node, execution.context);
          break;
        case 'delay':
          result = await this.executeDelay(node, execution.context);
          break;
        case 'human_approval':
          result = await this.executeHumanApproval(node, execution.context);
          break;
        case 'send_message':
          result = await this.executeSendMessage(node, execution.context);
          break;
        case 'update_lead':
          result = await this.executeUpdateLead(node, execution.context);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Update step as completed
      await this.prisma.executionStep.update({
        where: { id: step.id },
        data: {
          status: 'COMPLETED',
          output: JSON.stringify(result),
          completedAt: new Date()
        }
      });

      // Update execution context
      execution.context = { ...execution.context, ...result };

      // Determine next node
      const nextNode = this.getNextNode(node, result, execution.nodes);
      
      if (nextNode) {
        // Continue to next node
        await this.executeNode(executionId, nextNode.id);
      } else {
        // Workflow completed
        await this.completeExecution(executionId, 'COMPLETED');
      }

    } catch (error) {
      // Update step as failed
      await this.prisma.executionStep.update({
        where: { id: step.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        }
      });

      // Fail execution
      await this.completeExecution(executionId, 'FAILED', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async executeTrigger(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    // Trigger nodes just pass through the trigger data
    return { triggered: true };
  }

  private async executeAIAgent(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const agent = this.agentFactory.createAgent(node.config.agentType);
    
    const input = {
      leadId: context.leadId,
      prompt: node.config.prompt,
      context: context.variables,
      settings: node.config.settings || {}
    };

    const result = await agent.execute(input);
    
    return {
      aiResponse: result.response,
      confidence: result.confidence,
      variables: { ...context.variables, [`${node.id}_result`]: result.response }
    };
  }

  private async executeCondition(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const condition = node.config.condition;
    const variables = context.variables;
    
    // Simple condition evaluation (in production, use a proper expression evaluator)
    let result = false;
    
    try {
      // Replace variables in condition string
      let conditionStr = condition;
      Object.keys(variables).forEach(key => {
        conditionStr = conditionStr.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
      });
      
      // Evaluate simple conditions like "confidence > 0.8"
      result = eval(conditionStr);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      result = false;
    }

    return { conditionResult: result };
  }

  private async executeDelay(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const delayMs = node.config.delay || 1000;
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ delayed: true });
      }, delayMs);
    });
  }

  private async executeHumanApproval(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    // Create approval request
    const approvalData = {
      executionId: context.executionId,
      nodeId: node.id,
      message: node.config.message || 'Approval required',
      context: context.variables
    };

    // Emit event for UI to show approval screen
    this.emit('approval:required', approvalData);

    // Return pending status - will be resumed when approval is given
    return { approvalPending: true, approvalId: node.id };
  }

  private async executeSendMessage(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    if (!context.leadId) {
      throw new Error('No lead ID available for sending message');
    }

    // Get lead information
    const lead = await this.prisma.lead.findUnique({
      where: { id: context.leadId }
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Replace variables in message template
    let message = node.config.message || '';
    Object.keys(context.variables).forEach(key => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), context.variables[key]);
    });

    // Create message record
    const messageRecord = await this.prisma.message.create({
      data: {
        id: uuidv4(),
        leadId: context.leadId,
        content: message,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        status: 'SENT',
        timestamp: new Date()
      }
    });

    // Emit event for actual message sending (WhatsApp, email, etc.)
    this.emit('message:send', {
      leadId: context.leadId,
      phone: lead.phone,
      message,
      messageId: messageRecord.id
    });

    return { 
      messageSent: true, 
      messageId: messageRecord.id,
      message 
    };
  }

  private async executeUpdateLead(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    if (!context.leadId) {
      throw new Error('No lead ID available for update');
    }

    const updates: any = {};
    
    // Apply updates from node config
    if (node.config.status) {
      updates.status = node.config.status;
    }
    if (node.config.priority) {
      updates.priority = node.config.priority;
    }
    if (node.config.aiScore !== undefined) {
      updates.aiScore = node.config.aiScore;
    }

    // Replace variables in update values
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'string') {
        Object.keys(context.variables).forEach(varKey => {
          updates[key] = updates[key].replace(new RegExp(`{{${varKey}}}`, 'g'), context.variables[varKey]);
        });
      }
    });

    // Update lead
    const updatedLead = await this.prisma.lead.update({
      where: { id: context.leadId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    // Create interaction record
    await this.prisma.interaction.create({
      data: {
        id: uuidv4(),
        leadId: context.leadId,
        type: 'STATUS_CHANGE',
        description: `Lead updated by workflow: ${JSON.stringify(updates)}`,
        completedAt: new Date()
      }
    });

    return { 
      leadUpdated: true, 
      updates,
      lead: updatedLead 
    };
  }

  private getNextNode(currentNode: WorkflowNode, result: any, nodes: WorkflowNode[]): WorkflowNode | null {
    // Handle different connection types
    if (currentNode.type === 'condition') {
      const nextNodeId = result.conditionResult ? currentNode.connections?.true : currentNode.connections?.false;
      return nextNodeId ? nodes.find(n => n.id === nextNodeId) || null : null;
    }

    // Default: follow the 'next' connection
    const nextNodeId = currentNode.connections?.next;
    return nextNodeId ? nodes.find(n => n.id === nextNodeId) || null : null;
  }

  private async completeExecution(executionId: string, status: string, error?: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        error,
        result: execution ? JSON.stringify(execution.context) : null,
        completedAt: new Date()
      }
    });

    if (execution) {
      execution.status = status;
      this.activeExecutions.delete(executionId);
    }

    // Emit completion event
    this.emit('workflow:completed', { 
      executionId, 
      status, 
      error,
      workflowId: execution?.workflowId 
    });
  }

  // Public method to handle approvals
  async approveWorkflowStep(executionId: string, nodeId: string, approved: boolean, modifiedData?: any): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    if (approved) {
      // Update context with approval data
      execution.context.variables = {
        ...execution.context.variables,
        [`${nodeId}_approved`]: true,
        ...modifiedData
      };

      // Find the node and continue execution
      const node = execution.nodes.find(n => n.id === nodeId);
      if (node) {
        const nextNode = this.getNextNode(node, { approved: true }, execution.nodes);
        if (nextNode) {
          await this.executeNode(executionId, nextNode.id);
        } else {
          await this.completeExecution(executionId, 'COMPLETED');
        }
      }
    } else {
      // Handle rejection
      await this.completeExecution(executionId, 'CANCELLED', 'Human approval rejected');
    }

    this.emit('approval:resolved', { executionId, nodeId, approved });
  }

  // Get active executions for monitoring
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  // Stop execution
  async stopExecution(executionId: string): Promise<void> {
    await this.completeExecution(executionId, 'CANCELLED', 'Execution stopped by user');
  }
}