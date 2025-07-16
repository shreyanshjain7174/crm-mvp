'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { WebSocketClient } from '@/lib/websocket/client';
import { EventChannel, EVENT_CHANNELS } from '@/lib/websocket/events';
import { useAuth } from '@/contexts/auth-context';
import { DEMO_MODE } from '@/lib/demo-mode';

interface RealtimeConfig {
  channels?: EventChannel[];
  autoConnect?: boolean;
  reconnectOnAuthChange?: boolean;
}

interface RealtimeState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  latency: number;
}

export function useRealtime(config: RealtimeConfig = {}) {
  const { user, token } = useAuth();
  const clientRef = useRef<WebSocketClient | null>(null);
  const [state, setState] = useState<RealtimeState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    latency: 0
  });

  const {
    autoConnect = true,
    reconnectOnAuthChange = true
  } = config;

  // Memoize channels to prevent unnecessary re-renders
  const memoizedChannels = useMemo(() => 
    config.channels || [EVENT_CHANNELS.AGENTS, EVENT_CHANNELS.WORKFLOWS, EVENT_CHANNELS.APPROVALS, EVENT_CHANNELS.SYSTEM],
    [config.channels]
  );

  // Initialize WebSocket client
  const initializeClient = useCallback(async () => {
    if (!user || !token) {
      console.warn('Cannot initialize WebSocket: user not authenticated');
      return;
    }

    // Skip WebSocket connection in demo mode
    if (DEMO_MODE) {
      console.log('Demo mode: Skipping WebSocket connection');
      setState(prev => ({ 
        ...prev, 
        connected: true, 
        connecting: false, 
        error: null,
        reconnectAttempts: 0,
        latency: 0
      }));
      return;
    }

    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      
      clientRef.current = new WebSocketClient(
        {
          url: wsUrl,
          auth: {
            token,
            userId: user.id
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000
        },
        {
          autoConnect: true,
          channels: memoizedChannels,
          onConnect: () => {
            setState(prev => ({
              ...prev,
              connected: true,
              connecting: false,
              error: null,
              reconnectAttempts: 0
            }));
            console.log('Realtime connection established');
          },
          onDisconnect: (reason) => {
            setState(prev => ({
              ...prev,
              connected: false,
              connecting: false,
              error: reason === 'io client disconnect' ? null : reason
            }));
            console.log('Realtime connection lost:', reason);
          },
          onError: (error) => {
            setState(prev => ({
              ...prev,
              connected: false,
              connecting: false,
              error: error.message
            }));
            console.error('Realtime connection error:', error);
          },
          onReconnect: (attemptNumber) => {
            setState(prev => ({
              ...prev,
              reconnectAttempts: attemptNumber
            }));
            console.log('Realtime reconnection attempt:', attemptNumber);
          }
        }
      );

      // Measure latency periodically
      const latencyInterval = setInterval(async () => {
        if (clientRef.current?.connected) {
          try {
            const latency = await clientRef.current.ping();
            setState(prev => ({ ...prev, latency }));
          } catch (error) {
            console.warn('Failed to measure latency:', error);
          }
        }
      }, 30000); // Every 30 seconds

      // Cleanup interval on disconnect
      clientRef.current.on('disconnect', () => {
        clearInterval(latencyInterval);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket client:', error);
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, [user, token, memoizedChannels]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && user && token) {
      // Call initializeClient directly instead of through the memoized function
      // to avoid dependency issues
      const initialize = async () => {
        if (!user || !token) {
          console.warn('Cannot initialize WebSocket: user not authenticated');
          return;
        }

        // Skip WebSocket connection in demo mode
        if (DEMO_MODE) {
          console.log('Demo mode: Skipping WebSocket connection');
          setState(prev => ({ 
            ...prev, 
            connected: true, 
            connecting: false, 
            error: null,
            reconnectAttempts: 0,
            latency: 0
          }));
          return;
        }

        if (clientRef.current) {
          clientRef.current.disconnect();
        }

        setState(prev => ({ ...prev, connecting: true, error: null }));

        try {
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
          
          clientRef.current = new WebSocketClient(
            {
              url: wsUrl,
              auth: {
                token,
                userId: user.id
              },
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              timeout: 20000
            },
            {
              autoConnect: true,
              channels: memoizedChannels,
              onConnect: () => {
                setState(prev => ({
                  ...prev,
                  connected: true,
                  connecting: false,
                  error: null,
                  reconnectAttempts: 0
                }));
                console.log('Realtime connection established');
              },
              onDisconnect: (reason) => {
                setState(prev => ({
                  ...prev,
                  connected: false,
                  connecting: false,
                  error: reason === 'io client disconnect' ? null : reason
                }));
                console.log('Realtime connection lost:', reason);
              },
              onError: (error) => {
                setState(prev => ({
                  ...prev,
                  connected: false,
                  connecting: false,
                  error: error.message
                }));
                console.error('Realtime connection error:', error);
              },
              onReconnect: (attemptNumber) => {
                setState(prev => ({
                  ...prev,
                  reconnectAttempts: attemptNumber
                }));
                console.log('Realtime reconnection attempt:', attemptNumber);
              }
            }
          );
        } catch (error) {
          console.error('Failed to initialize WebSocket client:', error);
          setState(prev => ({
            ...prev,
            connecting: false,
            error: error instanceof Error ? error.message : 'Connection failed'
          }));
        }
      };

      initialize();
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [autoConnect, user?.id, token, memoizedChannels]);

  // Manual connection control
  const connect = useCallback(() => {
    if (!clientRef.current) {
      initializeClient();
    } else if (!state.connected && !state.connecting) {
      clientRef.current.connect();
    }
  }, [state.connected, state.connecting]); // Remove initializeClient from dependencies

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // Event subscription helpers
  const subscribe = useCallback(<T = any>(eventType: string, handler: (data: T) => void) => {
    if (DEMO_MODE) {
      // In demo mode, return a no-op unsubscribe function
      console.log('Demo mode: Skipping event subscription for', eventType);
      return () => {};
    }

    if (!clientRef.current) {
      console.warn('Cannot subscribe: WebSocket client not initialized');
      return () => {};
    }

    return clientRef.current.on(eventType, handler);
  }, []);

  // Specific event subscriptions
  const subscribeToAgentEvents = useCallback((handlers: {
    onStatusUpdate?: (data: any) => void;
    onTaskStarted?: (data: any) => void;
    onTaskCompleted?: (data: any) => void;
    onTaskFailed?: (data: any) => void;
    onPerformanceUpdate?: (data: any) => void;
  }) => {
    const unsubscribers: (() => void)[] = [];

    if (handlers.onStatusUpdate) {
      unsubscribers.push(subscribe('agent:status_update', handlers.onStatusUpdate));
    }
    if (handlers.onTaskStarted) {
      unsubscribers.push(subscribe('agent:task_started', handlers.onTaskStarted));
    }
    if (handlers.onTaskCompleted) {
      unsubscribers.push(subscribe('agent:task_completed', handlers.onTaskCompleted));
    }
    if (handlers.onTaskFailed) {
      unsubscribers.push(subscribe('agent:task_failed', handlers.onTaskFailed));
    }
    if (handlers.onPerformanceUpdate) {
      unsubscribers.push(subscribe('agent:performance_update', handlers.onPerformanceUpdate));
    }

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [subscribe]);

  const subscribeToWorkflowEvents = useCallback((handlers: {
    onExecutionStarted?: (data: any) => void;
    onStepStarted?: (data: any) => void;
    onStepCompleted?: (data: any) => void;
    onStepFailed?: (data: any) => void;
    onExecutionCompleted?: (data: any) => void;
    onApprovalRequired?: (data: any) => void;
  }) => {
    const unsubscribers: (() => void)[] = [];

    if (handlers.onExecutionStarted) {
      unsubscribers.push(subscribe('workflow:execution_started', handlers.onExecutionStarted));
    }
    if (handlers.onStepStarted) {
      unsubscribers.push(subscribe('workflow:step_started', handlers.onStepStarted));
    }
    if (handlers.onStepCompleted) {
      unsubscribers.push(subscribe('workflow:step_completed', handlers.onStepCompleted));
    }
    if (handlers.onStepFailed) {
      unsubscribers.push(subscribe('workflow:step_failed', handlers.onStepFailed));
    }
    if (handlers.onExecutionCompleted) {
      unsubscribers.push(subscribe('workflow:execution_completed', handlers.onExecutionCompleted));
    }
    if (handlers.onApprovalRequired) {
      unsubscribers.push(subscribe('workflow:approval_required', handlers.onApprovalRequired));
    }

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [subscribe]);

  const subscribeToApprovalEvents = useCallback((handlers: {
    onNewRequest?: (data: any) => void;
    onStatusUpdated?: (data: any) => void;
    onExpired?: (data: any) => void;
  }) => {
    const unsubscribers: (() => void)[] = [];

    if (handlers.onNewRequest) {
      unsubscribers.push(subscribe('approval:new_request', handlers.onNewRequest));
    }
    if (handlers.onStatusUpdated) {
      unsubscribers.push(subscribe('approval:status_updated', handlers.onStatusUpdated));
    }
    if (handlers.onExpired) {
      unsubscribers.push(subscribe('approval:expired', handlers.onExpired));
    }

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [subscribe]);

  const subscribeToLeadEvents = useCallback((handlers: {
    onCreated?: (data: any) => void;
    onUpdated?: (data: any) => void;
    onStatusChanged?: (data: any) => void;
  }) => {
    const unsubscribers: (() => void)[] = [];

    if (handlers.onCreated) {
      unsubscribers.push(subscribe('lead:created', handlers.onCreated));
    }
    if (handlers.onUpdated) {
      unsubscribers.push(subscribe('lead:updated', handlers.onUpdated));
    }
    if (handlers.onStatusChanged) {
      unsubscribers.push(subscribe('lead:status_changed', handlers.onStatusChanged));
    }

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [subscribe]);

  const subscribeToMessageEvents = useCallback((handlers: {
    onReceived?: (data: any) => void;
    onSent?: (data: any) => void;
    onFailed?: (data: any) => void;
  }) => {
    const unsubscribers: (() => void)[] = [];

    if (handlers.onReceived) {
      unsubscribers.push(subscribe('message:received', handlers.onReceived));
    }
    if (handlers.onSent) {
      unsubscribers.push(subscribe('message:sent', handlers.onSent));
    }
    if (handlers.onFailed) {
      unsubscribers.push(subscribe('message:failed', handlers.onFailed));
    }

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [subscribe]);

  const subscribeToSystemEvents = useCallback((handlers: {
    onHealthUpdate?: (data: any) => void;
    onAlert?: (data: any) => void;
  }) => {
    const unsubscribers: (() => void)[] = [];

    if (handlers.onHealthUpdate) {
      unsubscribers.push(subscribe('system:health_update', handlers.onHealthUpdate));
    }
    if (handlers.onAlert) {
      unsubscribers.push(subscribe('system:alert', handlers.onAlert));
    }

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [subscribe]);

  // Emit events
  const emit = useCallback((eventType: string, data?: any) => {
    if (DEMO_MODE) {
      console.log('Demo mode: Skipping event emission for', eventType, data);
      return;
    }

    if (!clientRef.current?.connected) {
      console.warn('Cannot emit event: not connected');
      return;
    }

    clientRef.current.emit(eventType, data);
  }, []);

  const emitWithAck = useCallback((eventType: string, data?: any) => {
    if (DEMO_MODE) {
      console.log('Demo mode: Skipping event emission with ack for', eventType, data);
      return Promise.resolve({ success: true, message: 'Demo mode response' });
    }

    if (!clientRef.current?.connected) {
      return Promise.reject(new Error('Not connected'));
    }

    return clientRef.current.emitWithAck(eventType, data);
  }, []);

  // Workflow actions
  const startWorkflow = useCallback((workflowId: string, context: any) => {
    return emitWithAck('workflow:start', { workflowId, context });
  }, [emitWithAck]);

  const pauseWorkflow = useCallback((executionId: string) => {
    emit('workflow:pause', { executionId });
  }, [emit]);

  const resumeWorkflow = useCallback((executionId: string) => {
    emit('workflow:resume', { executionId });
  }, [emit]);

  const cancelWorkflow = useCallback((executionId: string) => {
    emit('workflow:cancel', { executionId });
  }, [emit]);

  // Approval actions
  const approveRequest = useCallback((approvalId: string, comments?: string) => {
    emit('approval:approve', { approvalId, comments });
  }, [emit]);

  const rejectRequest = useCallback((approvalId: string, reason: string) => {
    emit('approval:reject', { approvalId, reason });
  }, [emit]);

  const escalateRequest = useCallback((approvalId: string, reason: string) => {
    emit('approval:escalate', { approvalId, reason });
  }, [emit]);

  // Lead actions
  const updateLeadStatus = useCallback((leadId: string, status: string, reason?: string) => {
    emit('lead:update_status', { leadId, status, reason });
  }, [emit]);

  // Message actions
  const sendMessage = useCallback((leadId: string, content: string, platform: string = 'whatsapp') => {
    emit('message:send', { leadId, content, platform });
  }, [emit]);

  // Agent actions
  const updateAgentStatus = useCallback((agentId: string, status: string) => {
    emit('agent:update_status', { agentId, status });
  }, [emit]);

  return {
    // Connection state
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    reconnectAttempts: state.reconnectAttempts,
    latency: state.latency,

    // Connection control
    connect,
    disconnect,

    // Event subscriptions
    subscribe,
    subscribeToAgentEvents,
    subscribeToWorkflowEvents,
    subscribeToApprovalEvents,
    subscribeToLeadEvents,
    subscribeToMessageEvents,
    subscribeToSystemEvents,

    // Event emission
    emit,
    emitWithAck,

    // Action helpers
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    approveRequest,
    rejectRequest,
    escalateRequest,
    updateLeadStatus,
    sendMessage,
    updateAgentStatus,

    // Client reference for advanced usage
    client: clientRef.current
  };
}