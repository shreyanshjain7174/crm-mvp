import { Pool } from 'pg';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AIAgentFactory } from './ai-agent-factory';
import { WorkflowNode, WorkflowExecution, ExecutionContext } from './types';

export class WorkflowExecutor extends EventEmitter {
  private db: Pool;
  private agentFactory: AIAgentFactory;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor(db: Pool) {
    super();
    this.db = db;
    this.agentFactory = new AIAgentFactory(db);
  }

  async executeWorkflow(workflowId: string, triggerData: any, leadId?: string): Promise<string> {
    // Create execution record
    const executionId = uuidv4();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      context: {
        leadId,
        trigger: triggerData,
        variables: {}
      },
      steps: [],
      nodes: [],
      startTime: new Date()
    };

    // Store execution
    this.activeExecutions.set(executionId, execution);
    
    // Update status to running
    execution.status = 'running';
    
    try {
      // Execute workflow steps
      await this.executeSteps(execution);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      this.emit('workflow:completed', execution);
      
      return executionId;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date();
      
      this.emit('workflow:failed', execution);
      
      throw error;
    } finally {
      // Clean up after some time
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 60000); // 1 minute
    }
  }

  private async executeSteps(execution: WorkflowExecution): Promise<void> {
    // Simple sequential execution for now
    for (const node of execution.nodes) {
      await this.executeNode(execution, node);
    }
  }

  private async executeNode(execution: WorkflowExecution, node: WorkflowNode): Promise<void> {
    if (!node.agentType) {
      throw new Error(`Node ${node.id} has no agent type`);
    }

    try {
      const agent = await this.agentFactory.createAgent(node.agentType as any, node.config);
      const result = await agent.execute({
        context: execution.context,
        nodeConfig: node.config
      });

      if (!result.success) {
        throw new Error(result.error || 'Agent execution failed');
      }

      // Store result in context
      if (!execution.context.variables) {
        execution.context.variables = {};
      }
      execution.context.variables[node.id] = result.data;

      this.emit('node:completed', { execution, node, result });
    } catch (error) {
      this.emit('node:failed', { execution, node, error });
      throw error;
    }
  }

  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    return this.activeExecutions.get(executionId) || null;
  }

  async getActiveExecutions(): Promise<WorkflowExecution[]> {
    return Array.from(this.activeExecutions.values());
  }

  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = 'paused';
      this.emit('workflow:paused', execution);
    }
  }

  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = 'running';
      this.emit('workflow:resumed', execution);
    }
  }

  async stopExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = 'failed';
      execution.error = 'Stopped by user';
      execution.endTime = new Date();
      this.emit('workflow:stopped', execution);
      this.activeExecutions.delete(executionId);
    }
  }

  // Default workflow templates
  getDefaultWorkflows(): any[] {
    return [
      {
        id: 'lead_qualification',
        name: 'Lead Qualification & Response',
        description: 'Analyze and qualify incoming leads with automated response',
        nodes: [
          {
            id: 'intent_recognition',
            type: 'agent',
            name: 'Intent Recognition',
            agentType: 'intent_recognition',
            position: { x: 100, y: 100 }
          },
          {
            id: 'lead_qualification',
            type: 'agent',
            name: 'Lead Qualification',
            agentType: 'lead_qualification',
            position: { x: 300, y: 100 }
          },
          {
            id: 'response_generation',
            type: 'agent',
            name: 'Response Generation',
            agentType: 'response_generation',
            position: { x: 500, y: 100 }
          }
        ]
      },
      {
        id: 'follow_up_sequence',
        name: 'Automated Follow-up Sequence',
        description: 'Schedule and execute follow-up messages',
        nodes: [
          {
            id: 'context_analysis',
            type: 'agent',
            name: 'Context Analysis',
            agentType: 'context_memory',
            position: { x: 100, y: 200 }
          },
          {
            id: 'follow_up_scheduler',
            type: 'agent',
            name: 'Follow-up Scheduler',
            agentType: 'follow_up_scheduler',
            position: { x: 300, y: 200 }
          }
        ]
      }
    ];
  }
}