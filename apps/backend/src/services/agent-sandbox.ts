import { NodeVM, VMScript } from 'vm2';
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
  private vm: NodeVM | null = null;
  private context: AgentContext;
  private startTime: number = 0;
  private apiCallCount: number = 0;
  private isExecuting: boolean = false;

  constructor(context: AgentContext) {
    super();
    this.context = context;
    this.initializeVM();
  }

  private initializeVM(): void {
    try {
      this.vm = new NodeVM({
        console: 'inherit',
        sandbox: this.createSandboxEnvironment(),
        require: {
          external: false,
          builtin: [],
          root: './',
          mock: {
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
        eval: false,
        wasm: false
      });
    } catch (error) {
      logger.error('Failed to initialize VM:', error);
      throw new Error('Sandbox initialization failed');
    }
  }

  async execute(code: string, inputData: any = {}): Promise<SandboxResult> {
    if (this.isExecuting) {
      throw new Error('Sandbox is already executing code');
    }

    this.isExecuting = true;
    this.startTime = Date.now();
    this.apiCallCount = 0;

    try {
      if (!this.vm) {
        throw new Error('Sandbox VM not initialized');
      }

      // Make input data available in sandbox
      this.vm.freeze(inputData, 'input');

      const script = new VMScript(`
        (async function() {
          ${code}
        })();
      `);

      const result = await this.vm.run(script);
      const executionTime = Date.now() - this.startTime;

      this.emit('execution-completed', {
        agentId: this.context.agentId,
        executionTime,
        success: true
      });

      return {
        success: true,
        result,
        resourceUsage: {
          executionTime,
          memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024,
          apiCallsMade: this.apiCallCount
        }
      };
    } catch (error) {
      const executionTime = Date.now() - this.startTime;
      
      this.emit('execution-failed', {
        agentId: this.context.agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      });

      logger.error('Sandbox execution failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
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

  private createSandboxEnvironment() {
    return {
      console: {
        log: (...args: any[]) => logger.info('Agent log:', ...args),
        error: (...args: any[]) => logger.error('Agent error:', ...args),
        warn: (...args: any[]) => logger.warn('Agent warning:', ...args)
      },
      
      setTimeout: (callback: () => void, delay: number) => {
        if (delay > this.context.resourceLimits.timeout) {
          throw new Error('Timeout exceeds resource limits');
        }
        return setTimeout(callback, delay);
      },
      
      api: {
        call: (endpoint: string, data?: any) => {
          this.apiCallCount++;
          if (this.apiCallCount > this.context.resourceLimits.maxAPICalls) {
            throw new Error('API call limit exceeded');
          }
          
          this.emit('api-call', {
            agentId: this.context.agentId,
            endpoint,
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

  destroy(): void {
    if (this.vm) {
      this.vm = null;
    }
    this.removeAllListeners();
  }

  getContext(): AgentContext {
    return { ...this.context };
  }

  updateResourceLimits(limits: Partial<ResourceLimits>): void {
    this.context.resourceLimits = { ...this.context.resourceLimits, ...limits };
    if (this.vm) {
      this.initializeVM();
    }
  }
}

class SandboxManager {
  private sandboxes: Map<string, AgentSandbox> = new Map();

  createSandbox(context: AgentContext): AgentSandbox {
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