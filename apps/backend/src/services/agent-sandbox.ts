import * as ivm from 'isolated-vm';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface ResourceLimits {
  timeout: number;
  memory: number;
  maxAPICalls: number;
}

export interface Permission {
  resource: string;
  scope?: string;
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
  private isolate: ivm.Isolate | null = null;
  private context: ivm.Context | null = null;
  private agentContext: AgentContext;
  private startTime: number = 0;
  private apiCallCount: number = 0;
  private isExecuting: boolean = false;

  constructor(context: AgentContext) {
    super();
    this.agentContext = context;
    this.initializeIsolate();
  }

  private async initializeIsolate(): Promise<void> {
    try {
      // Create isolated VM with memory limits
      this.isolate = new ivm.Isolate({ 
        memoryLimit: this.agentContext.resourceLimits.memory || 128,
        inspector: false
      });
      
      // Create context within the isolate
      this.context = await this.isolate.createContext();
      
      // Set up sandbox environment
      await this.setupSandboxEnvironment();
      
      logger.info(`Sandbox initialized for agent ${this.agentContext.agentId}`);
    } catch (error) {
      logger.error('Failed to initialize isolate:', error);
      throw new Error('Sandbox initialization failed');
    }
  }

  private async setupSandboxEnvironment(): Promise<void> {
    if (!this.context || !this.isolate) {
      throw new Error('Context not initialized');
    }

    // Create console object
    const consoleObj = this.isolate.compileScriptSync(`
      new Object({
        log: function(...args) {
          $0.applyIgnored(undefined, [JSON.stringify(args)]);
        },
        error: function(...args) {
          $1.applyIgnored(undefined, [JSON.stringify(args)]);
        },
        warn: function(...args) {
          $2.applyIgnored(undefined, [JSON.stringify(args)]);
        }
      })
    `);

    await this.context.global.set('console', await consoleObj.run(this.context, [
      new ivm.Callback((...args: any[]) => logger.info('Agent log:', ...args)),
      new ivm.Callback((...args: any[]) => logger.error('Agent error:', ...args)),
      new ivm.Callback((...args: any[]) => logger.warn('Agent warning:', ...args))
    ]));

    // Set up API object
    const apiObj = this.isolate.compileScriptSync(`
      new Object({
        call: function(endpoint, data) {
          return $0.applySync(undefined, [endpoint, JSON.stringify(data || {})]);
        }
      })
    `);

    await this.context.global.set('api', await apiObj.run(this.context, [
      new ivm.Callback((endpoint: string, data: string) => {
        this.apiCallCount++;
        if (this.apiCallCount > this.agentContext.resourceLimits.maxAPICalls) {
          throw new Error('API call limit exceeded');
        }
        
        this.emit('api-call', {
          agentId: this.agentContext.agentId,
          endpoint,
          data: JSON.parse(data),
          timestamp: new Date()
        });
        
        return JSON.stringify({ success: true, endpoint, data });
      })
    ]));

    // Set up setTimeout with limits
    await this.context.global.set('setTimeout', new ivm.Callback((callback: any, delay: number) => {
      if (delay > this.agentContext.resourceLimits.timeout) {
        throw new Error('Timeout exceeds resource limits');
      }
      // Note: This is a simplified implementation
      // In production, you'd want more sophisticated timeout handling
      return setTimeout(() => {
        if (typeof callback === 'function') {
          callback();
        }
      }, delay);
    }));

    // Add basic JSON support
    await this.context.global.set('JSON', this.isolate.compileScriptSync(`
      new Object({
        stringify: function(obj) {
          return $0.applySync(undefined, [obj]);
        },
        parse: function(str) {
          return $1.applySync(undefined, [str]);
        }
      })
    `).runSync(this.context, [
      new ivm.Callback((obj: any) => JSON.stringify(obj)),
      new ivm.Callback((str: string) => JSON.parse(str))
    ]));
  }

  async execute(code: string, inputData: any = {}): Promise<SandboxResult> {
    if (this.isExecuting) {
      throw new Error('Sandbox is already executing code');
    }

    if (!this.context || !this.isolate) {
      throw new Error('Sandbox not properly initialized');
    }

    this.isExecuting = true;
    this.startTime = Date.now();
    this.apiCallCount = 0;

    try {
      // Set input data in the context
      await this.context.global.set('input', JSON.parse(JSON.stringify(inputData)));

      // Wrap code in async function
      const wrappedCode = `
        (async function() {
          try {
            ${code}
          } catch (error) {
            throw new Error(error.message || 'Execution error');
          }
        })();
      `;

      // Compile and run the script with timeout
      const script = await this.isolate.compileScript(wrappedCode);
      const timeout = this.agentContext.resourceLimits.timeout || 5000;
      
      const result = await script.run(this.context, { timeout });
      const executionTime = Date.now() - this.startTime;

      this.emit('execution-completed', {
        agentId: this.agentContext.agentId,
        executionTime,
        success: true
      });

      return {
        success: true,
        result: result && typeof result.copy === 'function' ? result.copy() : result,
        resourceUsage: {
          executionTime,
          memoryUsed: this.isolate.getHeapStatisticsSync().used_heap_size / 1024 / 1024,
          apiCallsMade: this.apiCallCount
        }
      };
    } catch (error) {
      const executionTime = Date.now() - this.startTime;
      
      this.emit('execution-failed', {
        agentId: this.agentContext.agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      });

      logger.error('Sandbox execution failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        resourceUsage: {
          executionTime,
          memoryUsed: this.isolate ? this.isolate.getHeapStatisticsSync().used_heap_size / 1024 / 1024 : 0,
          apiCallsMade: this.apiCallCount
        }
      };
    } finally {
      this.isExecuting = false;
    }
  }

  destroy(): void {
    if (this.context) {
      this.context.release();
      this.context = null;
    }
    if (this.isolate) {
      this.isolate.dispose();
      this.isolate = null;
    }
    this.removeAllListeners();
  }

  getContext(): AgentContext {
    return { ...this.agentContext };
  }

  async updateResourceLimits(limits: Partial<ResourceLimits>): Promise<void> {
    this.agentContext.resourceLimits = { ...this.agentContext.resourceLimits, ...limits };
    
    // Reinitialize with new limits
    this.destroy();
    await this.initializeIsolate();
  }
}

class SandboxManager {
  private sandboxes: Map<string, AgentSandbox> = new Map();

  async createSandbox(context: AgentContext): Promise<AgentSandbox> {
    const sandboxId = `${context.agentId}:${context.sessionId}`;
    
    if (this.sandboxes.has(sandboxId)) {
      this.destroySandbox(sandboxId);
    }

    const sandbox = new AgentSandbox(context);
    this.sandboxes.set(sandboxId, sandbox);
    
    sandbox.on('execution-completed', (data) => {
      logger.info('Sandbox execution completed:', data);
    });

    sandbox.on('execution-failed', (data) => {
      logger.error('Sandbox execution failed:', data);
    });

    return sandbox;
  }

  getSandbox(agentId: string, sessionId: string): AgentSandbox | null {
    const sandboxId = `${agentId}:${sessionId}`;
    return this.sandboxes.get(sandboxId) || null;
  }

  destroySandbox(sandboxId: string): boolean {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      sandbox.destroy();
      this.sandboxes.delete(sandboxId);
      return true;
    }
    return false;
  }

  destroyAllSandboxes(): void {
    for (const [sandboxId, sandbox] of this.sandboxes) {
      sandbox.destroy();
      this.sandboxes.delete(sandboxId);
    }
  }

  getActiveSandboxCount(): number {
    return this.sandboxes.size;
  }
}

export const sandboxManager = new SandboxManager();