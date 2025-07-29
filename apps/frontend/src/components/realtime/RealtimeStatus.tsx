'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WebSocketStatus } from '@/lib/websocket/WebSocketManager';

interface RealtimeStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function RealtimeStatus({ 
  showDetails = false, 
  compact = false, 
  className = '' 
}: RealtimeStatusProps) {
  const { status, isConnected } = useWebSocket();

  const getStatusConfig = () => {
    switch (status) {
      case WebSocketStatus.CONNECTED:
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          label: 'Connected',
          description: 'Real-time updates active',
          variant: 'default' as const,
        };
      case WebSocketStatus.CONNECTING:
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          label: 'Connecting',
          description: 'Establishing connection...',
          variant: 'secondary' as const,
        };
      case WebSocketStatus.RECONNECTING:
        return {
          icon: Zap,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          label: 'Reconnecting',
          description: 'Attempting to reconnect...',
          variant: 'secondary' as const,
        };
      case WebSocketStatus.ERROR:
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          label: 'Error',
          description: 'Connection failed',
          variant: 'destructive' as const,
        };
      case WebSocketStatus.CLOSED:
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          label: 'Closed',
          description: 'Connection closed',
          variant: 'outline' as const,
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          label: 'Disconnected',
          description: 'No real-time connection',
          variant: 'outline' as const,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
        />
        <span className="text-xs text-muted-foreground">
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {showDetails ? (
            <Card className="border-0 shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Real-time Status</div>
                      <div className="text-xs text-muted-foreground">
                        {config.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant={config.variant} className="text-xs">
                    {config.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor}`}>
                <Icon className={`w-3 h-3 ${config.color}`} />
              </div>
              <Badge variant={config.variant} className="text-xs">
                {config.label}
              </Badge>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default RealtimeStatus;