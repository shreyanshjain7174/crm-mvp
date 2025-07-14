'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle, AlertCircle, Play, Clock } from 'lucide-react';
import { useAIAgents } from '@/hooks/use-ai-agents';
import { formatDistanceToNow } from 'date-fns';

export function AIActivityFeed() {
  const { recentActivity } = useAIAgents();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_started': return Play;
      case 'task_completed': return CheckCircle;
      case 'task_failed': return AlertCircle;
      case 'status_changed': return Activity;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_started': return 'text-blue-600 bg-blue-100';
      case 'task_completed': return 'text-green-600 bg-green-100';
      case 'task_failed': return 'text-red-600 bg-red-100';
      case 'status_changed': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'task_completed': return 'default';
      case 'task_failed': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          AI Activity Feed
          <Badge variant="secondary" className="ml-2">
            {recentActivity.length} activities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                const iconColor = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${iconColor}`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.agentName}
                        </p>
                        <Badge variant={getBadgeVariant(activity.type)} className="text-xs">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                        
                        {activity.details && (
                          <div className="text-xs text-gray-500">
                            {activity.details.duration && `${activity.details.duration}ms`}
                            {activity.details.error && (
                              <span className="text-red-600 ml-2">
                                Error: {activity.details.error}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}