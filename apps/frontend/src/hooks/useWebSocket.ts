'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketManager, WebSocketMessage, WebSocketStatus, WebSocketEventHandler } from '@/lib/websocket/WebSocketManager';

/**
 * React hook for WebSocket connection management
 * 
 * Features:
 * - Auto-connection management
 * - Event subscription/unsubscription
 * - Connection status tracking
 * - Message sending
 * - Cleanup on unmount
 */
export function useWebSocket() {
  const wsManager = useRef(getWebSocketManager());
  const [status, setStatus] = useState<WebSocketStatus>(wsManager.current.getStatus());
  const [isConnected, setIsConnected] = useState(wsManager.current.isConnected());

  useEffect(() => {
    const unsubscribeStatus = wsManager.current.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === WebSocketStatus.CONNECTED);
    });

    return unsubscribeStatus;
  }, []);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    return wsManager.current.sendMessage(type, payload);
  }, []);

  const subscribe = useCallback((eventType: string, handler: WebSocketEventHandler) => {
    return wsManager.current.subscribe(eventType, handler);
  }, []);

  const connect = useCallback(() => {
    wsManager.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsManager.current.disconnect();
  }, []);

  return {
    status,
    isConnected,
    sendMessage,
    subscribe,
    connect,
    disconnect,
    wsManager: wsManager.current,
  };
}

/**
 * Hook for subscribing to specific WebSocket events
 */
export function useWebSocketSubscription(
  eventType: string,
  handler: WebSocketEventHandler,
  enabled: boolean = true
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, handler, subscribe, enabled]);
}

/**
 * Hook for real-time notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('notification', (message) => {
      setNotifications(prev => [message, ...prev].slice(0, 50)); // Keep last 50 notifications
    });

    return unsubscribe;
  }, [subscribe]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  return {
    notifications,
    clearNotifications,
    removeNotification,
    isConnected,
  };
}

/**
 * Hook for real-time metrics updates
 */
export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('metrics', (message) => {
      setMetrics(message.payload);
      setLastUpdated(new Date(message.timestamp));
    });

    return unsubscribe;
  }, [subscribe]);

  return {
    metrics,
    lastUpdated,
    isConnected,
  };
}

/**
 * Hook for agent status updates
 */
export function useAgentUpdates() {
  const [agents, setAgents] = useState<Map<string, any>>(new Map());
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('agent_update', (message) => {
      const { agentId, status, data } = message.payload;
      setAgents(prev => new Map(prev.set(agentId, { status, data, lastUpdated: message.timestamp })));
    });

    return unsubscribe;
  }, [subscribe]);

  const getAgentStatus = useCallback((agentId: string) => {
    return agents.get(agentId);
  }, [agents]);

  return {
    agents: Array.from(agents.entries()).map(([id, data]) => ({ id, ...data })),
    getAgentStatus,
    isConnected,
  };
}

/**
 * Hook for real-time messages
 */
export function useRealtimeMessages() {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const { subscribe, sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return unsubscribe;
  }, [subscribe]);

  const sendChatMessage = useCallback((content: string, recipientId?: string) => {
    return sendMessage('message', {
      content,
      recipientId,
      type: 'chat',
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendChatMessage,
    clearMessages,
    isConnected,
  };
}

/**
 * Hook for joining/leaving WebSocket rooms
 */
export function useWebSocketRoom(roomId: string, autoJoin: boolean = true) {
  const { wsManager, isConnected } = useWebSocket();
  const [isInRoom, setIsInRoom] = useState(false);

  const joinRoom = useCallback(() => {
    if (wsManager.joinRoom(roomId)) {
      setIsInRoom(true);
    }
  }, [wsManager, roomId]);

  const leaveRoom = useCallback(() => {
    if (wsManager.leaveRoom(roomId)) {
      setIsInRoom(false);
    }
  }, [wsManager, roomId]);

  useEffect(() => {
    if (isConnected && autoJoin && !isInRoom) {
      joinRoom();
    }
  }, [isConnected, autoJoin, isInRoom, joinRoom]);

  useEffect(() => {
    // Leave room on unmount
    return () => {
      if (isInRoom) {
        leaveRoom();
      }
    };
  }, [isInRoom, leaveRoom]);

  return {
    isInRoom,
    joinRoom,
    leaveRoom,
    isConnected,
  };
}