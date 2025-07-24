/**
 * Agent Sandbox Service
 * 
 * Provides secure code execution environment for AI agents using VM2.
 * Implements resource limits, permission controls, and security isolation.
 */

import { NodeVM, VMScript } from 'vm2';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface ResourceLimits {
  timeout: number; // Execution timeout in ms
  memory: number; // Memory limit in MB
  maxAPICalls: number; // API calls per minute
}

export interface Permission {
  resource: string; // e.g., 'leads:read', 'messages:write'
  scope?: string; // Optional data scope filter
}

export interface AgentContext {
  userId: string;
  agentId: string;
  sessionId: string;
  permissions: Permission[];
  resourceLimits: ResourceLimits;
}

export interface SandboxResult {
  success: boolean;
  result?: any;
  error?: string;
  resourceUsage: {
    executionTime: number;
    memoryUsed: number;
    apiCallsMade: number;
  };
}

export class AgentSandbox extends EventEmitter {
  private vm: NodeVM | null = null;
  private context: AgentContext;
  private startTime: number = 0;
  private apiCallCount: number = 0;
  private isExecuting: boolean = false;

  constructor(context: AgentContext) {
    super();
    this.context = context;
    this.setupVM();
  }

  private setupVM(): void {
    try {
      this.vm = new NodeVM({
        console: 'inherit', // Allow console.log for debugging
        sandbox: {
          // Provide safe API methods to agents
          api: this.createSecureAPI(),
          context: {
            userId: this.context.userId,
            agentId: this.context.agentId,
            sessionId: this.context.sessionId
          }
        },
        require: {
          external: false, // Block all external modules for security
          builtin: [], // Block all built-in modules
          root: './', // Restrict file system access
          mock: {
            // Provide mock versions of commonly needed modules
            'crypto': {
              randomUUID: () => {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const crypto = require('crypto');
                return crypto.randomUUID();
              }
            }
          }
        },
        timeout: this.context.resourceLimits.timeout,
        eval: false, // Disable eval for security
        wasm: false, // Disable WebAssembly
        fixAsync: true // Fix async behavior
      });

      logger.info('Agent sandbox VM initialized', {
        agentId: this.context.agentId,
        sessionId: this.context.sessionId
      });
    } catch (error) {
      logger.error('Failed to initialize agent sandbox VM:', error);
      throw new Error('Sandbox initialization failed');
    }
  }

  private createSecureAPI() {
    return {
      // CRM Data Access APIs (with permission checking)
      crm: {
        getLeads: async (filters?: any) => {
          this.checkPermission('leads:read');
          return this.makeAPICall('GET', '/api/leads', { params: filters });
        },
        
        createLead: async (leadData: any) => {
          this.checkPermission('leads:write');
          return this.makeAPICall('POST', '/api/leads', { body: leadData });
        },
        
        updateLead: async (leadId: string, updates: any) => {
          this.checkPermission('leads:write');
          return this.makeAPICall('PUT', `/api/leads/${leadId}`, { body: updates });
        },
        
        getMessages: async (leadId: string) => {
          this.checkPermission('messages:read');
          return this.makeAPICall('GET', `/api/messages/lead/${leadId}`);
        },
        
        sendMessage: async (leadId: string, content: string) => {
          this.checkPermission('messages:write');
          return this.makeAPICall('POST', '/api/messages/send', {
            body: { leadId, content }
          });
        }
      },

      // Utility APIs
      utils: {
        wait: (ms: number) => new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000))),
        
        log: (message: string, data?: any) => {
          logger.info(`[Agent ${this.context.agentId}] ${message}`, data);
        },
        
        getCurrentTime: () => new Date().toISOString(),
        
        formatCurrency: (amount: number, currency: 'USD' | 'EUR' | 'INR' = 'INR') => {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency
          }).format(amount);
        }
      },

      // Event system for agent communication
      events: {
        emit: (eventName: string, data: any) => {
          this.emit('agentEvent', {
            agentId: this.context.agentId,
            sessionId: this.context.sessionId,
            eventName,
            data,
            timestamp: new Date()
          });
        },
        
        on: (eventName: string, callback: (...args: any[]) => void) => {
          this.on(eventName, callback);
        }
      }
    };
  }

  private checkPermission(required: string): void {
    const hasPermission = this.context.permissions.some(p => 
      p.resource === required || p.resource === required.split(':')[0] + ':*'
    );
    
    if (!hasPermission) {
      throw new Error(`Permission denied: ${required}`);
    }
  }

  private async makeAPICall(method: string, endpoint: string, options: any = {}): Promise<any> {
    // Check API rate limit
    if (this.apiCallCount >= this.context.resourceLimits.maxAPICalls) {
      throw new Error('API rate limit exceeded');
    }
    
    this.apiCallCount++;
    
    // In a real implementation, this would make actual HTTP calls to the CRM API
    // For now, we'll simulate the API response
    logger.info(`[Agent API Call] ${method} ${endpoint}`, {
      agentId: this.context.agentId,
      apiCallCount: this.apiCallCount,
      options
    });
    
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock data based on endpoint
    switch (endpoint) {
      case '/api/leads':
        return method === 'GET' ? { leads: [], total: 0 } : { id: 'lead_123', status: 'created' };
      case '/api/messages/send':
        return { id: 'msg_123', status: 'sent' };
      default:
        return { success: true };
    }
  }

  async execute(code: string, inputData: any = {}): Promise<SandboxResult> {
    if (this.isExecuting) {
      throw new Error('Sandbox is already executing code');
    }

    if (!this.vm) {
      throw new Error('Sandbox VM not initialized');
    }

    this.isExecuting = true;
    this.startTime = Date.now();
    this.apiCallCount = 0;

    try {
      logger.info('Executing agent code', {
        agentId: this.context.agentId,
        sessionId: this.context.sessionId,
        codeLength: code.length
      });

      // Prepare the code with input data
      const wrappedCode = `
        const input = ${JSON.stringify(inputData)};
        
        async function agentFunction() {
          ${code}
        }
        
        agentFunction();
      `;

      // Compile and run the code
      const script = new VMScript(wrappedCode, 'agent.js');
      const result = await this.vm.run(script);

      const executionTime = Date.now() - this.startTime;
      
      logger.info('Agent code execution completed', {
        agentId: this.context.agentId,
        sessionId: this.context.sessionId,
        executionTime,
        apiCallsMade: this.apiCallCount
      });

      return {
        success: true,
        result,
        resourceUsage: {
          executionTime,
          memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024, // MB
          apiCallsMade: this.apiCallCount
        }
      };

    } catch (error) {
      const executionTime = Date.now() - this.startTime;
      
      logger.error('Agent code execution failed', {
        agentId: this.context.agentId,
        sessionId: this.context.sessionId,
        error: error instanceof Error ? error.message : String(error),
        executionTime
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        resourceUsage: {
          executionTime,
          memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024,
          apiCallsMade: this.apiCallCount
        }
      };

    } finally {
      this.isExecuting = false;
    }
  }

  async terminate(): Promise<void> {
    try {
      if (this.vm) {
        // VM2 doesn't have a direct terminate method, but we can nullify it
        this.vm = null;
      }
      
      this.removeAllListeners();
      
      logger.info('Agent sandbox terminated', {
        agentId: this.context.agentId,
        sessionId: this.context.sessionId
      });
    } catch (error) {
      logger.error('Error terminating agent sandbox:', error);
    }
  }

  getResourceUsage(): any {
    return {
      isExecuting: this.isExecuting,
      apiCallCount: this.apiCallCount,
      executionTime: this.isExecuting ? Date.now() - this.startTime : 0,
      memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }
}

/**
 * Agent Sandbox Manager
 * 
 * Manages multiple agent sandboxes and their lifecycle
 */
export class AgentSandboxManager {
  private sandboxes: Map<string, AgentSandbox> = new Map();
  private readonly maxConcurrentSandboxes = 10;

  async createSandbox(context: AgentContext): Promise<string> {
    if (this.sandboxes.size >= this.maxConcurrentSandboxes) {
      throw new Error('Maximum concurrent sandboxes reached');
    }

    const sandboxId = `${context.agentId}_${context.sessionId}`;
    
    if (this.sandboxes.has(sandboxId)) {
      throw new Error('Sandbox already exists for this session');
    }

    const sandbox = new AgentSandbox(context);
    this.sandboxes.set(sandboxId, sandbox);

    // Auto-cleanup after 1 hour of inactivity
    setTimeout(() => {
      this.destroySandbox(sandboxId);
    }, 60 * 60 * 1000);

    logger.info('Agent sandbox created', {
      sandboxId,
      agentId: context.agentId,
      totalSandboxes: this.sandboxes.size
    });

    return sandboxId;
  }

  getSandbox(sandboxId: string): AgentSandbox | undefined {
    return this.sandboxes.get(sandboxId);
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      await sandbox.terminate();
      this.sandboxes.delete(sandboxId);
      
      logger.info('Agent sandbox destroyed', {
        sandboxId,
        remainingSandboxes: this.sandboxes.size
      });
    }
  }

  async destroyAll(): Promise<void> {
    const promises = Array.from(this.sandboxes.keys()).map(id => this.destroySandbox(id));
    await Promise.all(promises);
  }

  getActiveSandboxes(): string[] {
    return Array.from(this.sandboxes.keys());
  }

  getResourceUsage(): any {
    const usage = Array.from(this.sandboxes.entries()).map(([id, sandbox]) => ({
      sandboxId: id,
      ...sandbox.getResourceUsage()
    }));

    return {
      totalSandboxes: this.sandboxes.size,
      maxConcurrent: this.maxConcurrentSandboxes,
      sandboxes: usage
    };
  }
}

// Global sandbox manager instance
export const sandboxManager = new AgentSandboxManager();