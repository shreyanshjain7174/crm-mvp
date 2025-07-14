'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  User,
  ArrowRight
} from 'lucide-react';
import { useApprovals } from '@/hooks/use-approvals';
import { formatDistanceToNow } from 'date-fns';

export function ApprovalNotifications() {
  const { 
    getPendingApprovals, 
    getApprovalsByPriority,
    approveRequest,
    isLoading
  } = useApprovals();

  const pendingApprovals = getPendingApprovals();
  const urgentApprovals = getApprovalsByPriority('urgent');
  const highPriorityApprovals = getApprovalsByPriority('high');

  const quickApprove = async (approvalId: string) => {
    await approveRequest(approvalId, 'Quick approval from notification');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message_approval': return MessageSquare;
      case 'workflow_approval': return CheckCircle2;
      case 'action_approval': return User;
      default: return Bell;
    }
  };

  const getUrgencyColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'normal': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Pending Approvals
          {pendingApprovals.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingApprovals.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {pendingApprovals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No pending approvals</p>
            <p className="text-sm">All requests have been processed</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {/* Urgent Approvals */}
              {urgentApprovals.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Urgent ({urgentApprovals.length})
                  </h4>
                  <div className="space-y-2">
                    {urgentApprovals.map((approval) => {
                      const NotificationIcon = getNotificationIcon(approval.type);
                      return (
                        <div 
                          key={approval.id} 
                          className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(approval.priority)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <NotificationIcon className="h-4 w-4 text-red-600" />
                              <div>
                                <div className="font-medium text-sm">{approval.title}</div>
                                <div className="text-xs text-gray-600">
                                  {approval.context.customerName} • {formatDistanceToNow(new Date(approval.requestedAt), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-red-600 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {Math.max(0, Math.floor((new Date(approval.expiresAt).getTime() - new Date().getTime()) / (1000 * 60)))}m
                              </div>
                              <Button 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => quickApprove(approval.id)}
                                disabled={isLoading}
                              >
                                Quick Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* High Priority Approvals */}
              {highPriorityApprovals.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-orange-600 mb-2">
                    High Priority ({highPriorityApprovals.length})
                  </h4>
                  <div className="space-y-2">
                    {highPriorityApprovals.map((approval) => {
                      const NotificationIcon = getNotificationIcon(approval.type);
                      return (
                        <div 
                          key={approval.id} 
                          className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(approval.priority)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <NotificationIcon className="h-4 w-4 text-orange-600" />
                              <div>
                                <div className="font-medium text-sm">{approval.title}</div>
                                <div className="text-xs text-gray-600">
                                  {approval.context.customerName} • {formatDistanceToNow(new Date(approval.requestedAt), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-orange-600 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {Math.max(0, Math.floor((new Date(approval.expiresAt).getTime() - new Date().getTime()) / (1000 * 60)))}m
                              </div>
                              <Button 
                                variant="outline"
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => quickApprove(approval.id)}
                                disabled={isLoading}
                              >
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Other Pending Approvals */}
              {pendingApprovals.filter(a => a.priority !== 'urgent' && a.priority !== 'high').length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">
                    Other Pending ({pendingApprovals.filter(a => a.priority !== 'urgent' && a.priority !== 'high').length})
                  </h4>
                  <div className="space-y-2">
                    {pendingApprovals
                      .filter(a => a.priority !== 'urgent' && a.priority !== 'high')
                      .slice(0, 3)
                      .map((approval) => {
                        const NotificationIcon = getNotificationIcon(approval.type);
                        return (
                          <div 
                            key={approval.id} 
                            className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(approval.priority)}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <NotificationIcon className="h-4 w-4 text-gray-600" />
                                <div>
                                  <div className="font-medium text-sm">{approval.title}</div>
                                  <div className="text-xs text-gray-600">
                                    {approval.context.customerName} • {formatDistanceToNow(new Date(approval.requestedAt), { addSuffix: true })}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Action Footer */}
        {pendingApprovals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                {pendingApprovals.length} pending approval{pendingApprovals.length !== 1 ? 's' : ''}
              </div>
              <Button variant="outline" size="sm">
                View All Approvals
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}