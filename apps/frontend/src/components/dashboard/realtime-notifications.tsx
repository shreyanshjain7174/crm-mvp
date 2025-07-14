'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  CheckCircle,
  AlertTriangle,
  Info,
  MessageSquare,
  Users,
  Activity,
  Zap
} from 'lucide-react';
import { useRealtimeSocket } from '@/contexts/socket-context';
import { formatDistanceToNow } from 'date-fns';

interface RealtimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'agent' | 'workflow' | 'approval' | 'lead' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
  data?: any;
}

export function RealtimeNotifications() {
  const realtime = useRealtimeSocket();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Subscribe to real-time events and convert them to notifications
  useEffect(() => {
    if (!realtime.connected) return;

    const unsubscribers: (() => void)[] = [];

    // Agent notifications
    unsubscribers.push(
      realtime.subscribeToAgentEvents({
        onTaskStarted: (data) => {
          addNotification({
            type: 'info',
            category: 'agent',
            title: 'Agent Task Started',
            message: `${data.agentName || `Agent ${data.agentId}`} started: ${data.task}`,
            data
          });
        },
        onTaskCompleted: (data) => {
          addNotification({
            type: 'success',
            category: 'agent',
            title: 'Agent Task Completed',
            message: `${data.agentName || `Agent ${data.agentId}`} completed task in ${data.duration}ms`,
            data
          });
        },
        onTaskFailed: (data) => {
          addNotification({
            type: 'error',
            category: 'agent',
            title: 'Agent Task Failed',
            message: `${data.agentName || `Agent ${data.agentId}`} failed: ${data.error}`,
            data,
            actionable: true
          });
        }
      })
    );

    // Workflow notifications
    unsubscribers.push(
      realtime.subscribeToWorkflowEvents({
        onExecutionStarted: (data) => {
          addNotification({
            type: 'info',
            category: 'workflow',
            title: 'Workflow Started',
            message: `Workflow "${data.workflowName || data.workflowId}" execution started`,
            data
          });
        },
        onExecutionCompleted: (data) => {
          addNotification({
            type: data.status === 'completed' ? 'success' : 'error',
            category: 'workflow',
            title: 'Workflow Completed',
            message: `Workflow execution ${data.status} in ${Math.round(data.totalDuration / 1000)}s`,
            data
          });
        },
        onApprovalRequired: (data) => {
          addNotification({
            type: 'warning',
            category: 'approval',
            title: 'Approval Required',
            message: `${data.approvalRequest.title} requires your approval`,
            data,
            actionable: true
          });
        }
      })
    );

    // Approval notifications
    unsubscribers.push(
      realtime.subscribeToApprovalEvents({
        onNewRequest: (data) => {
          addNotification({
            type: 'warning',
            category: 'approval',
            title: 'New Approval Request',
            message: `${data.title} - Priority: ${data.priority}`,
            data,
            actionable: true
          });
        },
        onStatusUpdated: (data) => {
          addNotification({
            type: data.status === 'approved' ? 'success' : 'info',
            category: 'approval',
            title: 'Approval Status Updated',
            message: `Request ${data.status} by ${data.updatedBy?.userName || 'system'}`,
            data
          });
        }
      })
    );

    // Lead notifications
    unsubscribers.push(
      realtime.subscribeToLeadEvents({
        onCreated: (data) => {
          addNotification({
            type: 'info',
            category: 'lead',
            title: 'New Lead Created',
            message: `${data.customerName} from ${data.source}`,
            data,
            actionable: true
          });
        },
        onStatusChanged: (data) => {
          addNotification({
            type: 'info',
            category: 'lead',
            title: 'Lead Status Changed',
            message: `Lead status changed from ${data.oldStatus} to ${data.newStatus}`,
            data
          });
        }
      })
    );

    // Message notifications
    unsubscribers.push(
      realtime.subscribeToMessageEvents({
        onReceived: (data) => {
          addNotification({
            type: 'info',
            category: 'message',
            title: 'New Message Received',
            message: `${data.customerName} sent a ${data.platform} message`,
            data,
            actionable: data.requiresResponse
          });
        },
        onFailed: (data) => {
          addNotification({
            type: 'error',
            category: 'message',
            title: 'Message Delivery Failed',
            message: `Failed to send message: ${data.error}`,
            data,
            actionable: data.retryable
          });
        }
      })
    );

    // System notifications
    unsubscribers.push(
      realtime.subscribeToSystemEvents({
        onAlert: (data) => {
          addNotification({
            type: data.severity === 'critical' || data.severity === 'error' ? 'error' : 'warning',
            category: 'system',
            title: data.title,
            message: data.message,
            data,
            actionable: data.actionRequired
          });
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [realtime]);

  const addNotification = (notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (category: string, type: string) => {
    if (type === 'error') return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (type === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;

    switch (category) {
      case 'agent': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'workflow': return <Zap className="h-4 w-4 text-purple-600" />;
      case 'approval': return <Users className="h-4 w-4 text-orange-600" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'lead': return <Users className="h-4 w-4 text-blue-600" />;
      case 'system': return <Info className="h-4 w-4 text-gray-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Live Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                Clear all
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No notifications yet</p>
            <p className="text-sm">Real-time updates will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {displayNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-1 ring-blue-200' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getNotificationIcon(notification.category, notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </span>
                          {notification.actionable && (
                            <Badge variant="outline" className="text-xs">
                              Action required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 5 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All ${notifications.length} Notifications`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}