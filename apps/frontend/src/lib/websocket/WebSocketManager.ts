/**
 * Real-time WebSocket Manager
 * 
 * Provides real-time communication for:
 * - Live notifications
 * - System monitoring updates
 * - Agent status changes
 * - Message delivery confirmations
 * - Dashboard metric updates
 */

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  debug: boolean;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type WebSocketStatusHandler = (status: WebSocketStatus) => void;

export enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
  CLOSED = 'CLOSED'
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private statusHandlers: Set<WebSocketStatusHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private isIntentionallyClosed = false;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug || process.env.NODE_ENV === 'development',
    };

    // Auto-connect if in browser environment
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') return '';
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || 
                 process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^https?:/, protocol) ||
                 `${protocol}//${window.location.host}`;
    
    return `${host.replace(/^https?:/, protocol)}/ws`;
  }

  private log(message: string, ...args: any[]) {
    if (this.config.debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }

  private setStatus(status: WebSocketStatus) {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach(handler => handler(status));
      this.log(`Status changed to: ${status}`);
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.log('Connection already in progress');
      return;
    }

    this.isIntentionallyClosed = false;
    this.setStatus(WebSocketStatus.CONNECTING);
    this.log('Connecting to:', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
    } catch (error) {
      this.log('Connection error:', error);
      this.setStatus(WebSocketStatus.ERROR);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('Connected successfully');
      this.setStatus(WebSocketStatus.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.sendMessage('ping', { timestamp: Date.now() });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.log('Received message:', message);
        this.handleMessage(message);
      } catch (error) {
        this.log('Failed to parse message:', event.data, error);
      }
    };

    this.ws.onclose = (event) => {
      this.log('Connection closed:', event.code, event.reason);
      this.setStatus(WebSocketStatus.DISCONNECTED);
      this.stopHeartbeat();
      
      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.log('WebSocket error:', error);
      this.setStatus(WebSocketStatus.ERROR);
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle system messages
    if (message.type === 'pong') {
      this.log('Received pong');
      return;
    }

    // Emit to registered handlers
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          this.log('Error in message handler:', error);
        }
      });
    }

    // Emit to wildcard handlers
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          this.log('Error in wildcard handler:', error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) return;
    
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      this.setStatus(WebSocketStatus.CLOSED);
      return;
    }

    this.reconnectAttempts++;
    this.setStatus(WebSocketStatus.RECONNECTING);
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage('ping', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  sendMessage(type: string, payload: any = {}): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message: not connected');
      return false;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    try {
      this.ws.send(JSON.stringify(message));
      this.log('Sent message:', message);
      return true;
    } catch (error) {
      this.log('Failed to send message:', error);
      return false;
    }
  }

  subscribe(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
    this.log(`Subscribed to event: ${eventType}`);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
      this.log(`Unsubscribed from event: ${eventType}`);
    };
  }

  onStatusChange(handler: WebSocketStatusHandler): () => void {
    this.statusHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === WebSocketStatus.CONNECTED;
  }

  disconnect(): void {
    this.log('Disconnecting...');
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
    
    this.setStatus(WebSocketStatus.CLOSED);
  }

  // Convenience methods for common message types
  subscribeToNotifications(handler: WebSocketEventHandler): () => void {
    return this.subscribe('notification', handler);
  }

  subscribeToMetrics(handler: WebSocketEventHandler): () => void {
    return this.subscribe('metrics', handler);
  }

  subscribeToAgentUpdates(handler: WebSocketEventHandler): () => void {
    return this.subscribe('agent_update', handler);
  }

  subscribeToMessages(handler: WebSocketEventHandler): () => void {
    return this.subscribe('message', handler);
  }

  // Send specific message types
  joinRoom(roomId: string): boolean {
    return this.sendMessage('join_room', { roomId });
  }

  leaveRoom(roomId: string): boolean {
    return this.sendMessage('leave_room', { roomId });
  }

  updateUserStatus(status: string): boolean {
    return this.sendMessage('user_status', { status });
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

export { WebSocketManager };
export default WebSocketManager;