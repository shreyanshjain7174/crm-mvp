'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useWebSocket';
import { WebSocketMessage } from '@/lib/websocket/WebSocketManager';

interface RealtimeNotificationsProps {
  maxVisible?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

export function RealtimeNotifications({
  maxVisible = 5,
  autoHide = true,
  autoHideDelay = 5000,
  className = '',
}: RealtimeNotificationsProps) {
  const { notifications, removeNotification, clearNotifications, isConnected } = useNotifications();

  const visibleNotifications = notifications.slice(0, maxVisible);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  React.useEffect(() => {
    if (!autoHide) return;

    const timers = visibleNotifications.map((notification) => {
      return setTimeout(() => {
        removeNotification(notification.id);
      }, autoHideDelay);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [visibleNotifications, autoHide, autoHideDelay, removeNotification]);

  if (!isConnected || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`} style={{ maxWidth: '400px' }}>
      <AnimatePresence>
        {visibleNotifications.map((notification) => {
          const { payload } = notification;
          const notificationType = payload.type || 'info';
          const Icon = getNotificationIcon(notificationType);
          const colorClass = getNotificationColor(notificationType);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              layout
            >
              <Card className="shadow-lg border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {payload.title || 'Notification'}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {formatTime(notification.timestamp)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 p-0 hover:bg-muted"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {payload.message || payload.content || 'No message'}
                      </p>
                      
                      {payload.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            if (payload.actionUrl) {
                              window.open(payload.actionUrl, '_blank');
                            }
                            removeNotification(notification.id);
                          }}
                        >
                          {payload.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {notifications.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={clearNotifications}
            className="text-xs"
          >
            <Bell className="w-3 h-3 mr-1" />
            Clear {notifications.length - maxVisible} more
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default RealtimeNotifications;