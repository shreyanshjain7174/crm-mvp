'use client';

import { io, Socket } from 'socket.io-client';
import { WebSocketEvent, EventChannel, EVENT_CHANNELS } from './events';

export interface WebSocketConfig {
  url: string;
  auth?: {
    token: string;
    userId: string;
  };
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

export interface WebSocketClientOptions {
  autoConnect?: boolean;
  channels?: EventChannel[];
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attemptNumber: number) => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private options: WebSocketClientOptions;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;

  constructor(config: WebSocketConfig, options: WebSocketClientOptions = {}) {
    this.config = config;
    this.options = {
      autoConnect: true,
      channels: [],
      ...options
    };
    this.maxReconnectAttempts = config.reconnectionAttempts || 5;

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socketOptions: any = {
          transports: ['websocket', 'polling'],
          timeout: this.config.timeout || 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.config.reconnectionDelay || 1000,
          reconnectionDelayMax: 5000,
          maxHttpBufferSize: 1e8,
        };

        if (this.config.auth) {
          socketOptions.auth = this.config.auth;
        }

        this.socket = io(this.config.url, socketOptions);

        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket?.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Subscribe to channels
          if (this.options.channels?.length) {
            this.subscribeToChannels(this.options.channels);
          }
          
          this.options.onConnect?.();
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.options.onDisconnect?.(reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          this.options.onError?.(error);
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('WebSocket reconnected after', attemptNumber, 'attempts');
          this.reconnectAttempts = attemptNumber;
          this.options.onReconnect?.(attemptNumber);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('WebSocket reconnection attempt:', attemptNumber);
          this.reconnectAttempts = attemptNumber;
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('WebSocket reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('WebSocket reconnection failed after', this.maxReconnectAttempts, 'attempts');
          this.options.onError?.(new Error('Reconnection failed'));
        });

        // Generic event handler for all WebSocket events
        this.socket.onAny((eventType: string, data: any) => {
          this.handleEvent(eventType, data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscribe to specific event channels
  subscribeToChannels(channels: EventChannel[]): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot subscribe to channels: socket not connected');
      return;
    }

    channels.forEach(channel => {
      this.socket?.emit('subscribe', { channel });
      console.log('Subscribed to channel:', channel);
    });
  }

  // Unsubscribe from specific event channels
  unsubscribeFromChannels(channels: EventChannel[]): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot unsubscribe from channels: socket not connected');
      return;
    }

    channels.forEach(channel => {
      this.socket?.emit('unsubscribe', { channel });
      console.log('Unsubscribed from channel:', channel);
    });
  }

  // Generic event listener
  on<T = any>(eventType: string, handler: (data: T) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
    };
  }

  // Specific event listeners with type safety
  onAgentStatusUpdate(handler: (data: any) => void) {
    return this.on('agent:status_update', handler);
  }

  onAgentTaskStarted(handler: (data: any) => void) {
    return this.on('agent:task_started', handler);
  }

  onAgentTaskCompleted(handler: (data: any) => void) {
    return this.on('agent:task_completed', handler);
  }

  onAgentTaskFailed(handler: (data: any) => void) {
    return this.on('agent:task_failed', handler);
  }

  onWorkflowExecutionStarted(handler: (data: any) => void) {
    return this.on('workflow:execution_started', handler);
  }

  onWorkflowStepStarted(handler: (data: any) => void) {
    return this.on('workflow:step_started', handler);
  }

  onWorkflowStepCompleted(handler: (data: any) => void) {
    return this.on('workflow:step_completed', handler);
  }

  onWorkflowExecutionCompleted(handler: (data: any) => void) {
    return this.on('workflow:execution_completed', handler);
  }

  onApprovalNewRequest(handler: (data: any) => void) {
    return this.on('approval:new_request', handler);
  }

  onApprovalStatusUpdated(handler: (data: any) => void) {
    return this.on('approval:status_updated', handler);
  }

  onLeadCreated(handler: (data: any) => void) {
    return this.on('lead:created', handler);
  }

  onLeadUpdated(handler: (data: any) => void) {
    return this.on('lead:updated', handler);
  }

  onMessageReceived(handler: (data: any) => void) {
    return this.on('message:received', handler);
  }

  onMessageSent(handler: (data: any) => void) {
    return this.on('message:sent', handler);
  }

  onSystemHealthUpdate(handler: (data: any) => void) {
    return this.on('system:health_update', handler);
  }

  onSystemAlert(handler: (data: any) => void) {
    return this.on('system:alert', handler);
  }

  // Emit events to server
  emit<T = any>(eventType: string, data?: T): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot emit event: socket not connected');
      return;
    }

    this.socket.emit(eventType, data);
  }

  // Emit with acknowledgment
  emitWithAck<T = any, R = any>(eventType: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.socket.emit(eventType, data, (response: R) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  // Agent-specific emitters
  startWorkflow(workflowId: string, context: any): Promise<any> {
    return this.emitWithAck('workflow:start', { workflowId, context });
  }

  pauseWorkflow(executionId: string): void {
    this.emit('workflow:pause', { executionId });
  }

  resumeWorkflow(executionId: string): void {
    this.emit('workflow:resume', { executionId });
  }

  cancelWorkflow(executionId: string): void {
    this.emit('workflow:cancel', { executionId });
  }

  approveRequest(approvalId: string, comments?: string): void {
    this.emit('approval:approve', { approvalId, comments });
  }

  rejectRequest(approvalId: string, reason: string): void {
    this.emit('approval:reject', { approvalId, reason });
  }

  escalateRequest(approvalId: string, reason: string): void {
    this.emit('approval:escalate', { approvalId, reason });
  }

  updateAgentStatus(agentId: string, status: string): void {
    this.emit('agent:update_status', { agentId, status });
  }

  sendMessage(leadId: string, content: string, platform: string): void {
    this.emit('message:send', { leadId, content, platform });
  }

  updateLeadStatus(leadId: string, status: string, reason?: string): void {
    this.emit('lead:update_status', { leadId, status, reason });
  }

  // Handle incoming events
  private handleEvent(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error handling event ${eventType}:`, error);
        }
      });
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  get reconnectionAttempts(): number {
    return this.reconnectAttempts;
  }

  // Health check
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const start = Date.now();
      this.socket.emit('ping', (response: any) => {
        const latency = Date.now() - start;
        resolve(latency);
      });
    });
  }

  // Get connection statistics
  getConnectionStats(): {
    connected: boolean;
    socketId?: string;
    reconnectionAttempts: number;
    eventHandlers: number;
  } {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectionAttempts: this.reconnectAttempts,
      eventHandlers: this.eventHandlers.size
    };
  }
}