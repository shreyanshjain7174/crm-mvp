'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  MessageSquare,
  Settings,
  ArrowUp,
  Eye,
  FileText,
  Zap,
  Calendar,
  Timer
} from 'lucide-react';
import { useApprovals } from '@/hooks/use-approvals';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export function ApprovalCenter() {
  const { 
    approvalRequests,
    stats,
    filterStatus,
    filterPriority,
    isLoading,
    isConnected,
    setFilterStatus,
    setFilterPriority,
    approveRequest,
    rejectRequest,
    escalateRequest,
    getFilteredApprovals
  } = useApprovals();

  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'escalate'>('approve');

  const filteredApprovals = getFilteredApprovals();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message_approval': return MessageSquare;
      case 'workflow_approval': return Settings;
      case 'action_approval': return Zap;
      case 'content_approval': return FileText;
      default: return Clock;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message_approval': return 'bg-blue-100 text-blue-800';
      case 'workflow_approval': return 'bg-purple-100 text-purple-800';
      case 'action_approval': return 'bg-green-100 text-green-800';
      case 'content_approval': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const handleAction = async (approvalId: string, type: 'approve' | 'reject' | 'escalate') => {
    setSelectedApproval(approvalId);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedApproval) return;

    try {
      switch (actionType) {
        case 'approve':
          await approveRequest(selectedApproval, approvalComments);
          break;
        case 'reject':
          await rejectRequest(selectedApproval, rejectionReason);
          break;
        case 'escalate':
          await escalateRequest(selectedApproval, escalationReason);
          break;
      }
      
      // Reset form
      setApprovalComments('');
      setRejectionReason('');
      setEscalationReason('');
      setActionDialogOpen(false);
      setSelectedApproval(null);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Approval Center
            <div className={`ml-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-6 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{stats.urgent}</div>
            <div className="text-xs text-gray-600">Urgent</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{stats.high}</div>
            <div className="text-xs text-gray-600">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{stats.approved}</div>
            <div className="text-xs text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-600">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {filteredApprovals.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No approval requests found matching your filters</p>
              </div>
            ) : (
              filteredApprovals.map((approval) => {
                const TypeIcon = getTypeIcon(approval.type);
                const timeUntilExpiry = getTimeUntilExpiry(approval.expiresAt);
                const isExpiringSoon = new Date(approval.expiresAt).getTime() - new Date().getTime() < 300000; // 5 minutes
                
                return (
                  <div key={approval.id} className="bg-white border rounded-lg p-4 space-y-4 hover:shadow-sm transition-shadow">
                    {/* Approval Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getTypeColor(approval.type)}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{approval.title}</h3>
                          <p className="text-sm text-gray-600">{approval.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(approval.priority)}`}>
                          {approval.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {approval.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(approval.status)}`}>
                          {approval.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Approval Details */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 text-xs">Requested By</div>
                        <div className="font-medium">{approval.requestedBy.agentName}</div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(approval.requestedAt), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600 text-xs">Customer</div>
                        <div className="font-medium">{approval.context.customerName || 'N/A'}</div>
                        {approval.context.leadId && (
                          <div className="text-xs text-gray-500">Lead: {approval.context.leadId.slice(-6)}</div>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-gray-600 text-xs">Risk & Confidence</div>
                        <div className={`font-medium ${getRiskColor(approval.context.riskLevel)}`}>
                          {approval.context.riskLevel} risk
                        </div>
                        <div className="text-xs text-gray-500">
                          {approval.context.confidenceScore}% confidence
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600 text-xs">Expires</div>
                        <div className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-900'}`}>
                          {timeUntilExpiry}
                        </div>
                        {isExpiringSoon && (
                          <div className="text-xs text-red-500 flex items-center">
                            <Timer className="h-3 w-3 mr-1" />
                            Expiring soon
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Context Details */}
                    {(approval.context.originalMessage || approval.context.proposedResponse || approval.context.actionDetails) && (
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        {approval.context.originalMessage && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Original Message</div>
                            <div className="text-sm bg-gray-50 p-3 rounded border-l-2 border-gray-300">
                              {approval.context.originalMessage}
                            </div>
                          </div>
                        )}
                        
                        {approval.context.proposedResponse && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Proposed Response</div>
                            <div className="text-sm bg-blue-50 p-3 rounded border-l-2 border-blue-300">
                              {approval.context.proposedResponse}
                            </div>
                          </div>
                        )}
                        
                        {approval.context.actionDetails && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Action Details</div>
                            <div className="text-sm bg-green-50 p-3 rounded border-l-2 border-green-300">
                              {typeof approval.context.actionDetails === 'string' 
                                ? approval.context.actionDetails 
                                : JSON.stringify(approval.context.actionDetails, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {approval.metadata.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">Tags:</span>
                        {approval.metadata.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {approval.status === 'pending' && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          {approval.metadata.requiresManagerApproval && (
                            <span className="text-orange-600">Manager approval required</span>
                          )}
                          {approval.metadata.autoApprovalEligible && (
                            <span className="text-green-600">Auto-approval eligible</span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(approval.id, 'escalate')}
                            disabled={isLoading}
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Escalate
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(approval.id, 'reject')}
                            disabled={isLoading}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleAction(approval.id, 'approve')}
                            disabled={isLoading}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Approval/Rejection Details */}
                    {(approval.approvedBy || approval.rejectedBy) && (
                      <div className="pt-3 border-t border-gray-100">
                        {approval.approvedBy && (
                          <div className="flex items-center text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            <span>
                              Approved by {approval.approvedBy.userName} 
                              {formatDistanceToNow(new Date(approval.approvedBy.approvedAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        
                        {approval.rejectedBy && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-red-700">
                              <XCircle className="h-4 w-4 mr-2" />
                              <span>
                                Rejected by {approval.rejectedBy.userName} 
                                {formatDistanceToNow(new Date(approval.rejectedBy.rejectedAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              Reason: {approval.rejectedBy.reason}
                            </div>
                          </div>
                        )}
                        
                        {approval.approvedBy?.comments && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                            Comments: {approval.approvedBy.comments}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Request'}
              {actionType === 'reject' && 'Reject Request'}
              {actionType === 'escalate' && 'Escalate Request'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === 'approve' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments (optional)</label>
                <Textarea
                  placeholder="Add any comments about your approval..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            {actionType === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  placeholder="Please explain why you are rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            )}
            
            {actionType === 'escalate' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Escalation Reason *</label>
                <Textarea
                  placeholder="Please explain why this request needs escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeAction}
                disabled={
                  isLoading || 
                  (actionType === 'reject' && !rejectionReason.trim()) ||
                  (actionType === 'escalate' && !escalationReason.trim())
                }
              >
                {isLoading ? 'Processing...' : 
                 actionType === 'approve' ? 'Approve' :
                 actionType === 'reject' ? 'Reject' : 'Escalate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}