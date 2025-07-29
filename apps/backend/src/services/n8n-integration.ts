import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { WorkflowDefinition, WorkflowExecution } from './workflow-orchestrator';

interface N8NWorkflowData {
  id: string;
  name: string;
  active: boolean;
  nodes: N8NNode[];
  connections: Record<string, any>;
  settings: Record<string, any>;
  staticData: Record<string, any>;
}

interface N8NNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

interface N8NExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'canceled';
  startedAt: string;
  stoppedAt?: string;
  mode: 'manual' | 'trigger' | 'webhook';
  data: {
    resultData: {
      runData: Record<string, any>;
    };
  };
}

/**
 * n8n Integration Service
 * Handles communication with n8n workflows for business automation
 */
export class N8NIntegration {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey?: string;
  private isConnected = false;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey })
      }
    });

    this.initializeConnection();
  }

  /**
   * Initialize connection to n8n
   */
  private async initializeConnection() {
    try {
      await this.testConnection();
      this.isConnected = true;
      logger.info('n8n integration initialized successfully');
    } catch (error) {
      logger.warn('n8n not available, will use simulation mode:', error);
      this.isConnected = false;
    }
  }

  /**
   * Test connection to n8n
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/rest/active-workflows');
      return response.status === 200;
    } catch (error) {
      logger.error('n8n connection test failed:', error);
      return false;
    }
  }

  /**
   * Create workflow in n8n
   */
  async createWorkflow(workflow: WorkflowDefinition): Promise<string> {
    if (!this.isConnected) {
      return this.simulateWorkflowCreation(workflow);
    }

    try {
      const n8nWorkflow = this.convertToN8NFormat(workflow);
      
      const response = await this.client.post('/rest/workflows', n8nWorkflow);
      const workflowId = response.data.id;
      
      // Activate the workflow if it should be active
      if (workflow.status === 'active') {
        await this.activateWorkflow(workflowId);
      }
      
      logger.info(`Created n8n workflow: ${workflowId}`);
      return workflowId;
      
    } catch (error) {
      logger.error('Failed to create n8n workflow:', error);
      throw new Error(`n8n workflow creation failed: ${error}`);
    }
  }

  /**
   * Execute workflow in n8n
   */
  async executeWorkflow(
    workflowId: string, 
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    if (!this.isConnected) {
      return this.simulateWorkflowExecution(workflowId, input);
    }

    try {
      const response = await this.client.post(`/rest/workflows/${workflowId}/execute`, {
        data: input
      });
      
      const execution = response.data;
      
      // Wait for execution to complete
      const result = await this.waitForExecution(execution.id);
      
      return {
        success: result.status === 'success',
        executionId: execution.id,
        data: result.data?.resultData || {},
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Failed to execute n8n workflow:', error);
      throw new Error(`n8n workflow execution failed: ${error}`);
    }
  }

  /**
   * Get workflow from n8n
   */
  async getWorkflow(workflowId: string): Promise<N8NWorkflowData | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await this.client.get(`/rest/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get n8n workflow:', error);
      return null;
    }
  }

  /**
   * List all workflows from n8n
   */
  async listWorkflows(): Promise<N8NWorkflowData[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const response = await this.client.get('/rest/workflows');
      return response.data;
    } catch (error) {
      logger.error('Failed to list n8n workflows:', error);
      return [];
    }
  }

  /**
   * Activate workflow in n8n
   */
  async activateWorkflow(workflowId: string): Promise<boolean> {
    if (!this.isConnected) {
      return true;
    }

    try {
      await this.client.post(`/rest/workflows/${workflowId}/activate`);
      logger.info(`Activated n8n workflow: ${workflowId}`);
      return true;
    } catch (error) {
      logger.error('Failed to activate n8n workflow:', error);
      return false;
    }
  }

  /**
   * Deactivate workflow in n8n
   */
  async deactivateWorkflow(workflowId: string): Promise<boolean> {
    if (!this.isConnected) {
      return true;
    }

    try {
      await this.client.post(`/rest/workflows/${workflowId}/deactivate`);
      logger.info(`Deactivated n8n workflow: ${workflowId}`);
      return true;
    } catch (error) {
      logger.error('Failed to deactivate n8n workflow:', error);
      return false;
    }
  }

  /**
   * Get execution status from n8n
   */
  async getExecution(executionId: string): Promise<N8NExecution | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await this.client.get(`/rest/executions/${executionId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get n8n execution:', error);
      return null;
    }
  }

  /**
   * Wait for execution to complete
   */
  private async waitForExecution(
    executionId: string, 
    maxWaitTime: number = 60000
  ): Promise<N8NExecution> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const execution = await this.getExecution(executionId);
      
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }
      
      if (execution.status !== 'running') {
        return execution;
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Execution timeout: ${executionId}`);
  }

  /**
   * Convert workflow definition to n8n format
   */
  private convertToN8NFormat(workflow: WorkflowDefinition): N8NWorkflowData {
    const n8nNodes: N8NNode[] = workflow.nodes
      .filter(node => node.engine === 'n8n')
      .map(node => ({
        id: node.id,
        name: node.name,
        type: this.mapNodeTypeToN8N(node.type),
        position: [node.position.x, node.position.y] as [number, number],
        parameters: node.config || {}
      }));

    // Add start trigger node if not present
    if (!n8nNodes.find(n => n.type === 'n8n-nodes-base.manualTrigger')) {
      n8nNodes.unshift({
        id: 'trigger',
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: [0, 0],
        parameters: {}
      });
    }

    const connections = this.buildN8NConnections(workflow.edges, n8nNodes);

    return {
      id: workflow.id,
      name: workflow.name,
      active: workflow.status === 'active',
      nodes: n8nNodes,
      connections,
      settings: workflow.settings || {},
      staticData: {}
    };
  }

  /**
   * Map workflow node types to n8n node types
   */
  private mapNodeTypeToN8N(nodeType: string): string {
    const typeMap: Record<string, string> = {
      'action': 'n8n-nodes-base.function',
      'condition': 'n8n-nodes-base.if',
      'transform': 'n8n-nodes-base.set',
      'integration': 'n8n-nodes-base.webhook',
      'webhook': 'n8n-nodes-base.webhook',
      'email': 'n8n-nodes-base.emailSend',
      'http': 'n8n-nodes-base.httpRequest',
      'database': 'n8n-nodes-base.postgres'
    };
    
    return typeMap[nodeType] || 'n8n-nodes-base.function';
  }

  /**
   * Build n8n connections from workflow edges
   */
  private buildN8NConnections(edges: any[], nodes: N8NNode[]): Record<string, any> {
    const connections: Record<string, any> = {};
    
    for (const edge of edges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        if (!connections[sourceNode.name]) {
          connections[sourceNode.name] = {
            main: [[]]
          };
        }
        
        connections[sourceNode.name].main[0].push({
          node: targetNode.name,
          type: 'main',
          index: 0
        });
      }
    }
    
    return connections;
  }

  /**
   * Simulate workflow creation when n8n is not available
   */
  private simulateWorkflowCreation(workflow: WorkflowDefinition): string {
    const simulatedId = `n8n_sim_${Date.now()}`;
    logger.info(`Simulated n8n workflow creation: ${simulatedId}`);
    return simulatedId;
  }

  /**
   * Simulate workflow execution when n8n is not available
   */
  private async simulateWorkflowExecution(
    workflowId: string, 
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    logger.info(`Simulating n8n workflow execution: ${workflowId}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      success: true,
      executionId: `sim_exec_${Date.now()}`,
      data: {
        processed: input,
        businessLogicApplied: true,
        simulatedSteps: [
          'Data validation',
          'Business rule application',
          'Integration calls',
          'Result compilation'
        ]
      },
      timestamp: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Get connection status
   */
  isConnectedToN8N(): boolean {
    return this.isConnected;
  }

  /**
   * Get n8n health status
   */
  async getHealthStatus(): Promise<Record<string, any>> {
    try {
      const isHealthy = await this.testConnection();
      return {
        connected: isHealthy,
        baseUrl: this.baseUrl,
        hasApiKey: !!this.apiKey,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
export const n8nIntegration = new N8NIntegration();