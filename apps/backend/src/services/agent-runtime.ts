/**
 * Agent Runtime Service
 * 
 * Orchestrates agent execution, manages lifecycles, and provides
 * the main interface for running AI agents in the CRM system.
 */

import { FastifyInstance } from 'fastify';
import { sandboxManager, AgentContext, ResourceLimits, Permission } from './agent-sandbox';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: Permission[];
  resourceLimits: ResourceLimits;
  code: string;
  entryPoint?: string;
  triggers: AgentTrigger[];
}

export interface AgentTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  condition: string; // JS expression or cron schedule
  description: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  userId: string;
  sessionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  resourceUsage?: any;
}

export class AgentRuntime extends EventEmitter {
  private db: any;
  private io: any;
  private executions: Map<string, AgentExecution> = new Map();

  constructor(fastify: FastifyInstance) {
    super();
    this.db = fastify.db;
    this.io = fastify.io;
    
    // Cleanup completed executions periodically
    setInterval(() => this.cleanupOldExecutions(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Install an agent from manifest
   */
  async installAgent(userId: string, manifest: AgentManifest): Promise<void> {
    try {
      // Validate manifest
      this.validateManifest(manifest);

      // Store agent in database
      await this.db.query(`
        INSERT INTO agents (
          id, user_id, name, version, description, author, manifest, 
          permissions, resource_limits, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'installed', NOW(), NOW())
        ON CONFLICT (id, user_id) DO UPDATE SET
          version = EXCLUDED.version,
          manifest = EXCLUDED.manifest,
          permissions = EXCLUDED.permissions,
          resource_limits = EXCLUDED.resource_limits,
          updated_at = NOW()
      `, [
        manifest.id,
        userId,
        manifest.name,
        manifest.version,
        manifest.description,
        manifest.author,
        JSON.stringify(manifest),
        JSON.stringify(manifest.permissions),
        JSON.stringify(manifest.resourceLimits)
      ]);

      logger.info('Agent installed successfully', {
        agentId: manifest.id,
        userId,
        version: manifest.version
      });

      // Emit installation event
      this.emit('agentInstalled', { userId, agent: manifest });
      
      // Notify user via WebSocket
      this.io.to(`user_${userId}`).emit('agent-installed', {
        agentId: manifest.id,
        name: manifest.name,
        version: manifest.version
      });

    } catch (error) {
      logger.error('Agent installation failed:', error);
      throw error;
    }
  }

  /**
   * Execute an agent with given input data
   */
  async executeAgent(
    userId: string, 
    agentId: string, 
    inputData: any = {},
    options: { sessionId?: string; trigger?: string } = {}
  ): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = options.sessionId || `session_${Date.now()}`;

    try {
      // Get agent manifest from database
      const agentResult = await this.db.query(`
        SELECT manifest, permissions, resource_limits, status
        FROM agents 
        WHERE id = $1 AND user_id = $2 AND status = 'installed'
      `, [agentId, userId]);

      if (agentResult.rows.length === 0) {
        throw new Error('Agent not found or not installed');
      }

      const agentData = agentResult.rows[0];
      const manifest: AgentManifest = JSON.parse(agentData.manifest);

      // Create execution record
      const execution: AgentExecution = {
        id: executionId,
        agentId,
        userId,
        sessionId,
        status: 'pending',
        startTime: new Date(),
        input: inputData
      };

      this.executions.set(executionId, execution);

      // Store execution in database
      await this.db.query(`
        INSERT INTO agent_executions (
          id, agent_id, user_id, session_id, status, start_time, input, trigger_type
        ) VALUES ($1, $2, $3, $4, 'pending', NOW(), $5, $6)
      `, [executionId, agentId, userId, sessionId, JSON.stringify(inputData), options.trigger || 'manual']);

      // Execute asynchronously
      this.runAgentExecution(execution, manifest);

      logger.info('Agent execution started', {
        executionId,
        agentId,
        userId,
        sessionId
      });

      return executionId;

    } catch (error) {
      logger.error('Failed to start agent execution:', error);
      throw error;
    }
  }

  /**
   * Internal method to run agent execution
   */
  private async runAgentExecution(execution: AgentExecution, manifest: AgentManifest): Promise<void> {
    let sandboxId: string | null = null;

    try {
      // Update execution status
      execution.status = 'running';
      this.executions.set(execution.id, execution);
      
      await this.updateExecutionInDB(execution);

      // Emit execution started event
      this.emit('executionStarted', execution);
      this.io.to(`user_${execution.userId}`).emit('agent-execution-started', {
        executionId: execution.id,
        agentId: execution.agentId
      });

      // Create sandbox context
      const context: AgentContext = {
        userId: execution.userId,
        agentId: execution.agentId,
        sessionId: execution.sessionId,
        permissions: manifest.permissions,
        resourceLimits: manifest.resourceLimits
      };

      // Create and run in sandbox
      const sandbox = sandboxManager.createSandbox(context);
      sandboxId = `${context.agentId}:${context.sessionId}`;

      if (!sandbox) {
        throw new Error('Failed to create agent sandbox');
      }

      // Set up sandbox event listeners
      sandbox.on('agentEvent', (eventData) => {
        this.io.to(`user_${execution.userId}`).emit('agent-event', eventData);
      });

      // Execute agent code
      const result = await sandbox.execute(manifest.code, execution.input);

      // Update execution with results
      execution.status = result.success ? 'completed' : 'failed';
      execution.endTime = new Date();
      execution.output = result.result;
      execution.error = result.error;
      execution.resourceUsage = result.resourceUsage;

      this.executions.set(execution.id, execution);
      await this.updateExecutionInDB(execution);

      // Emit completion events
      this.emit('executionCompleted', execution);
      this.io.to(`user_${execution.userId}`).emit('agent-execution-completed', {
        executionId: execution.id,
        agentId: execution.agentId,
        status: execution.status,
        output: execution.output,
        error: execution.error,
        resourceUsage: execution.resourceUsage
      });

      logger.info('Agent execution completed', {
        executionId: execution.id,
        agentId: execution.agentId,
        status: execution.status,
        executionTime: execution.endTime.getTime() - execution.startTime.getTime()
      });

    } catch (error) {
      // Handle execution failure
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : String(error);

      this.executions.set(execution.id, execution);
      await this.updateExecutionInDB(execution);

      this.emit('executionFailed', execution);
      this.io.to(`user_${execution.userId}`).emit('agent-execution-failed', {
        executionId: execution.id,
        agentId: execution.agentId,
        error: execution.error
      });

      logger.error('Agent execution failed', {
        executionId: execution.id,
        agentId: execution.agentId,
        error: execution.error
      });

    } finally {
      // Cleanup sandbox
      if (sandboxId) {
        await sandboxManager.destroySandbox(sandboxId);
      }
    }
  }

  /**
   * Get execution status and details
   */
  getExecution(executionId: string): AgentExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for a user
   */
  async getUserExecutions(userId: string, limit: number = 50): Promise<AgentExecution[]> {
    const result = await this.db.query(`
      SELECT * FROM agent_executions 
      WHERE user_id = $1 
      ORDER BY start_time DESC 
      LIMIT $2
    `, [userId, limit]);

    return result.rows.map((row: any) => ({
      id: row.id,
      agentId: row.agent_id,
      userId: row.user_id,
      sessionId: row.session_id,
      status: row.status,
      startTime: row.start_time,
      endTime: row.end_time,
      input: row.input ? JSON.parse(row.input) : undefined,
      output: row.output ? JSON.parse(row.output) : undefined,
      error: row.error,
      resourceUsage: row.resource_usage ? JSON.parse(row.resource_usage) : undefined
    }));
  }

  /**
   * Stop a running execution
   */
  async stopExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    
    if (!execution || execution.status !== 'running') {
      throw new Error('Execution not found or not running');
    }

    // Destroy sandbox
    const sandboxId = `${execution.agentId}:${execution.sessionId}`;
    sandboxManager.destroySandbox(sandboxId);

    // Update execution status
    execution.status = 'failed';
    execution.endTime = new Date();
    execution.error = 'Execution stopped by user';

    this.executions.set(executionId, execution);
    await this.updateExecutionInDB(execution);

    logger.info('Agent execution stopped', { executionId, agentId: execution.agentId });
  }

  /**
   * Get runtime statistics
   */
  getStats(): any {
    const executions = Array.from(this.executions.values());
    const activeSandboxes = sandboxManager.getActiveSandboxCount();

    return {
      executions: {
        total: executions.length,
        running: executions.filter(e => e.status === 'running').length,
        completed: executions.filter(e => e.status === 'completed').length,
        failed: executions.filter(e => e.status === 'failed').length
      },
      sandboxes: activeSandboxes,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Validate agent manifest
   */
  private validateManifest(manifest: AgentManifest): void {
    if (!manifest.id || !manifest.name || !manifest.code) {
      throw new Error('Invalid manifest: missing required fields');
    }

    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Invalid manifest: permissions must be an array');
    }

    if (!manifest.resourceLimits || typeof manifest.resourceLimits !== 'object') {
      throw new Error('Invalid manifest: resourceLimits must be an object');
    }

    // Validate resource limits
    const limits = manifest.resourceLimits;
    if (!limits.timeout || limits.timeout > 300000) { // Max 5 minutes
      throw new Error('Invalid resource limits: timeout must be <= 300000ms');
    }

    if (!limits.memory || limits.memory > 256) { // Max 256MB
      throw new Error('Invalid resource limits: memory must be <= 256MB');
    }

    if (!limits.maxAPICalls || limits.maxAPICalls > 100) { // Max 100 API calls per minute
      throw new Error('Invalid resource limits: maxAPICalls must be <= 100');
    }
  }

  /**
   * Update execution record in database
   */
  private async updateExecutionInDB(execution: AgentExecution): Promise<void> {
    await this.db.query(`
      UPDATE agent_executions SET
        status = $1,
        end_time = $2,
        output = $3,
        error = $4,
        resource_usage = $5,
        updated_at = NOW()
      WHERE id = $6
    `, [
      execution.status,
      execution.endTime,
      execution.output ? JSON.stringify(execution.output) : null,
      execution.error,
      execution.resourceUsage ? JSON.stringify(execution.resourceUsage) : null,
      execution.id
    ]);
  }

  /**
   * Cleanup old executions from memory
   */
  private cleanupOldExecutions(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let cleaned = 0;

    for (const [id, execution] of this.executions.entries()) {
      if (execution.status !== 'running' && execution.startTime.getTime() < cutoff) {
        this.executions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old executions from memory`);
    }
  }

  /**
   * Shutdown runtime gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down agent runtime...');
    
    // Stop all active sandboxes
    sandboxManager.destroyAllSandboxes();
    
    // Mark all running executions as failed
    for (const execution of this.executions.values()) {
      if (execution.status === 'running') {
        execution.status = 'failed';
        execution.endTime = new Date();
        execution.error = 'Runtime shutdown';
        await this.updateExecutionInDB(execution);
      }
    }
    
    this.removeAllListeners();
    logger.info('Agent runtime shutdown complete');
  }
}

// Global runtime instance will be initialized with Fastify instance
export let agentRuntime: AgentRuntime;

export function initializeAgentRuntime(fastify: FastifyInstance): void {
  agentRuntime = new AgentRuntime(fastify);
}