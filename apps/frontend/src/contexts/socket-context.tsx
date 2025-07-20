'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import { EVENT_CHANNELS } from '@/lib/websocket/events';

interface SocketContextType {
  socket: any; // For backward compatibility
  isConnected: boolean;
  realtime: ReturnType<typeof useRealtime>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  realtime: {} as ReturnType<typeof useRealtime>,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const channels = useMemo(() => [
    EVENT_CHANNELS.AGENTS,
    EVENT_CHANNELS.WORKFLOWS,
    EVENT_CHANNELS.APPROVALS,
    EVENT_CHANNELS.LEADS,
    EVENT_CHANNELS.MESSAGES,
    EVENT_CHANNELS.AI_SUGGESTIONS,
    EVENT_CHANNELS.SYSTEM,
    EVENT_CHANNELS.USER_ACTIVITY
  ], []);

  const realtime = useRealtime({
    channels,
    autoConnect: false, // Disable auto-connect to prevent WebSocket errors
    reconnectOnAuthChange: false
  });

  return (
    <SocketContext.Provider value={{ 
      socket: realtime.client, // For backward compatibility
      isConnected: realtime.connected,
      realtime
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// New hook that provides the full realtime functionality
export const useRealtimeSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useRealtimeSocket must be used within a SocketProvider');
  }
  return context.realtime;
};