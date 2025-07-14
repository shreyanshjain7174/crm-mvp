'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';

export interface ApprovalRequest {
  id: string;
  type: 'message_approval' | 'workflow_approval' | 'action_approval' | 'content_approval';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedBy: {
    agentId: string;
    agentName: string;
    workflowId?: string;
    workflowExecutionId?: string;
  };
  requestedAt: string;
  expiresAt: string;
  approvedBy?: {
    userId: string;
    userName: string;
    approvedAt: string;
    comments?: string;
  };
  rejectedBy?: {
    userId: string;
    userName: string;
    rejectedAt: string;
    reason: string;
  };
  context: {
    leadId?: string;
    messageId?: string;
    customerId?: string;
    customerName?: string;
    originalMessage?: string;
    proposedResponse?: string;
    actionType?: string;
    actionDetails?: any;
    businessContext?: {
      businessId: string;
      businessName: string;
      industry: string;
    };
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidenceScore: number;
    estimatedImpact: string;
  };
  metadata: {
    autoApprovalEligible: boolean;
    requiresManagerApproval: boolean;
    approvalRules: string[];
    tags: string[];
    relatedApprovals?: string[];
  };
}

export interface ApprovalRule {
  id: string;
  name: string;
  description: string;
  type: 'auto_approve' | 'require_approval' | 'escalate';
  conditions: {
    agentTypes?: string[];
    messageTypes?: string[];
    riskLevels?: string[];
    confidenceThreshold?: number;
    customerSegments?: string[];
    businessHours?: boolean;
    valueThreshold?: number;
  };
  actions: {
    autoApprove?: boolean;
    requireManagerApproval?: boolean;
    escalateAfter?: number; // minutes
    notifyUsers?: string[];
    skipOnWeekends?: boolean;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function useApprovals() {
  const { socket, isConnected } = useSocket();
  
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    // Sample approval requests for demonstration
    {
      id: 'approval_1',
      type: 'message_approval',
      title: 'WhatsApp Response Approval',
      description: 'AI-generated response for premium lead inquiry requires approval',
      priority: 'high',
      status: 'pending',
      requestedBy: {
        agentId: '2',
        agentName: 'Message Generation Agent',
        workflowId: 'lead-qualification-flow',
        workflowExecutionId: 'wf_exec_1'
      },
      requestedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      expiresAt: new Date(Date.now() + 900000).toISOString(), // 15 minutes from now
      context: {
        leadId: 'lead-123',
        messageId: 'msg-456',
        customerId: 'customer-789',
        customerName: 'Priya Sharma',
        originalMessage: 'Hi, I am interested in your premium plan. Can you tell me more about the pricing and features?',
        proposedResponse: 'Hello Priya! Thank you for your interest in our premium plan. I\'d be happy to provide you with detailed information about our pricing and features. Our premium plan includes advanced analytics, priority support, and custom integrations. Would you like to schedule a quick 15-minute demo call to discuss how it can benefit your business specifically?',
        businessContext: {
          businessId: 'business-1',
          businessName: 'TechSolutions CRM',
          industry: 'Software'
        },
        riskLevel: 'medium',
        confidenceScore: 87,
        estimatedImpact: 'High-value lead conversion opportunity'
      },
      metadata: {
        autoApprovalEligible: false,
        requiresManagerApproval: true,
        approvalRules: ['high_value_lead_rule', 'premium_product_rule'],
        tags: ['premium', 'lead_qualification', 'high_value'],
        relatedApprovals: []
      }
    },
    {
      id: 'approval_2',
      type: 'action_approval',
      title: 'Lead Status Change',
      description: 'Request to update lead status to "Hot" based on AI analysis',
      priority: 'normal',
      status: 'pending',
      requestedBy: {
        agentId: '1',
        agentName: 'Lead Qualification Agent',
        workflowId: 'lead-qualification-flow',
        workflowExecutionId: 'wf_exec_2'
      },
      requestedAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      expiresAt: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
      context: {
        leadId: 'lead-456',
        customerId: 'customer-101',
        customerName: 'Rajesh Kumar',
        actionType: 'lead_status_update',
        actionDetails: {
          currentStatus: 'warm',
          proposedStatus: 'hot',
          reason: 'Customer showed high intent with multiple product inquiries and budget confirmation'
        },
        businessContext: {
          businessId: 'business-1',
          businessName: 'TechSolutions CRM',
          industry: 'Software'
        },
        riskLevel: 'low',
        confidenceScore: 94,
        estimatedImpact: 'Improved lead prioritization and faster sales response'
      },
      metadata: {
        autoApprovalEligible: true,
        requiresManagerApproval: false,
        approvalRules: ['lead_scoring_rule'],
        tags: ['lead_qualification', 'status_change', 'automation'],
        relatedApprovals: []
      }
    },
    {
      id: 'approval_3',
      type: 'workflow_approval',
      title: 'Escalation Workflow',
      description: 'Customer complaint requires escalation to senior support team',
      priority: 'urgent',
      status: 'pending',
      requestedBy: {
        agentId: '4',
        agentName: 'Intent Recognition Agent',
        workflowId: 'complaint-escalation-flow',
        workflowExecutionId: 'wf_exec_3'
      },
      requestedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 minutes from now
      context: {
        leadId: 'lead-789',
        customerId: 'customer-456',
        customerName: 'Anita Patel',
        originalMessage: 'This is the third time I am contacting you about the same issue. Your software is not working as promised and I want a full refund immediately!',
        actionType: 'escalation',
        actionDetails: {
          escalationType: 'complaint',
          severity: 'high',
          department: 'senior_support',
          reason: 'Repeated complaint, refund request, customer frustration'
        },
        businessContext: {
          businessId: 'business-1',
          businessName: 'TechSolutions CRM',
          industry: 'Software'
        },
        riskLevel: 'high',
        confidenceScore: 96,
        estimatedImpact: 'Customer retention risk, potential churn prevention'
      },
      metadata: {
        autoApprovalEligible: false,
        requiresManagerApproval: true,
        approvalRules: ['complaint_escalation_rule', 'refund_request_rule'],
        tags: ['complaint', 'escalation', 'urgent', 'retention_risk'],
        relatedApprovals: []
      }
    }
  ]);

  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([
    {
      id: 'high_value_lead_rule',
      name: 'High Value Lead Approval',
      description: 'Require approval for responses to leads with high estimated value',
      type: 'require_approval',
      conditions: {
        confidenceThreshold: 80,
        riskLevels: ['medium', 'high'],
        customerSegments: ['premium', 'enterprise']
      },
      actions: {
        requireManagerApproval: true,
        escalateAfter: 15,
        notifyUsers: ['manager@company.com']
      },
      isActive: true,
      createdBy: 'admin',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'auto_approve_low_risk',
      name: 'Auto-approve Low Risk Actions',
      description: 'Automatically approve low-risk, high-confidence actions',
      type: 'auto_approve',
      conditions: {
        riskLevels: ['low'],
        confidenceThreshold: 90,
        businessHours: true
      },
      actions: {
        autoApprove: true,
        skipOnWeekends: false
      },
      isActive: true,
      createdBy: 'admin',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);

  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Listen for real-time approval updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('approval:new_request', (data: ApprovalRequest) => {
      setApprovalRequests(prev => [data, ...prev]);
    });

    socket.on('approval:status_updated', (data: { approvalId: string; status: string; updatedBy?: any }) => {
      setApprovalRequests(prev => prev.map(approval => 
        approval.id === data.approvalId 
          ? { 
              ...approval, 
              status: data.status as any,
              ...(data.status === 'approved' && data.updatedBy ? { approvedBy: data.updatedBy } : {}),
              ...(data.status === 'rejected' && data.updatedBy ? { rejectedBy: data.updatedBy } : {})
            }
          : approval
      ));
    });

    socket.on('approval:expired', (data: { approvalId: string }) => {
      setApprovalRequests(prev => prev.map(approval => 
        approval.id === data.approvalId 
          ? { ...approval, status: 'expired' }
          : approval
      ));
    });

    return () => {
      socket.off('approval:new_request');
      socket.off('approval:status_updated');
      socket.off('approval:expired');
    };
  }, [socket, isConnected]);

  // Auto-expire approvals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setApprovalRequests(prev => prev.map(approval => {
        if (approval.status === 'pending' && new Date(approval.expiresAt) < now) {
          return { ...approval, status: 'expired' };
        }
        return approval;
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const approveRequest = useCallback(async (approvalId: string, comments?: string) => {
    setIsLoading(true);
    
    try {
      const approval = approvalRequests.find(a => a.id === approvalId);
      if (!approval) return;

      const approvedBy = {
        userId: 'user-1',
        userName: 'John Doe',
        approvedAt: new Date().toISOString(),
        comments
      };

      // Update local state immediately
      setApprovalRequests(prev => prev.map(a => 
        a.id === approvalId 
          ? { ...a, status: 'approved' as const, approvedBy }
          : a
      ));

      // Emit to backend if socket is available
      if (socket) {
        socket.emit('approval:approve', { 
          approvalId, 
          approvedBy,
          workflowExecutionId: approval.requestedBy.workflowExecutionId,
          stepId: approval.type === 'message_approval' ? 'humanApproval' : undefined
        });
      }

      console.log('Approval granted:', approvalId);
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setIsLoading(false);
    }
  }, [approvalRequests, socket]);

  const rejectRequest = useCallback(async (approvalId: string, reason: string) => {
    setIsLoading(true);
    
    try {
      const approval = approvalRequests.find(a => a.id === approvalId);
      if (!approval) return;

      const rejectedBy = {
        userId: 'user-1',
        userName: 'John Doe',
        rejectedAt: new Date().toISOString(),
        reason
      };

      // Update local state immediately
      setApprovalRequests(prev => prev.map(a => 
        a.id === approvalId 
          ? { ...a, status: 'rejected' as const, rejectedBy }
          : a
      ));

      // Emit to backend if socket is available
      if (socket) {
        socket.emit('approval:reject', { 
          approvalId, 
          rejectedBy,
          workflowExecutionId: approval.requestedBy.workflowExecutionId,
          stepId: approval.type === 'message_approval' ? 'humanApproval' : undefined
        });
      }

      console.log('Approval rejected:', approvalId);
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setIsLoading(false);
    }
  }, [approvalRequests, socket]);

  const escalateRequest = useCallback(async (approvalId: string, escalationReason: string) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would escalate to a manager or senior team member
      console.log('Escalating approval request:', approvalId, escalationReason);
      
      if (socket) {
        socket.emit('approval:escalate', { approvalId, escalationReason });
      }
    } catch (error) {
      console.error('Failed to escalate request:', error);
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  const getFilteredApprovals = useCallback(() => {
    return approvalRequests.filter(approval => {
      const matchesStatus = filterStatus === 'all' || approval.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || approval.priority === filterPriority;
      return matchesStatus && matchesPriority;
    });
  }, [approvalRequests, filterStatus, filterPriority]);

  const getPendingApprovals = useCallback(() => {
    return approvalRequests.filter(a => a.status === 'pending');
  }, [approvalRequests]);

  const getApprovalsByPriority = useCallback((priority: string) => {
    return approvalRequests.filter(a => a.priority === priority && a.status === 'pending');
  }, [approvalRequests]);

  const getApprovalById = useCallback((id: string) => {
    return approvalRequests.find(a => a.id === id);
  }, [approvalRequests]);

  const stats = {
    total: approvalRequests.length,
    pending: approvalRequests.filter(a => a.status === 'pending').length,
    approved: approvalRequests.filter(a => a.status === 'approved').length,
    rejected: approvalRequests.filter(a => a.status === 'rejected').length,
    expired: approvalRequests.filter(a => a.status === 'expired').length,
    urgent: approvalRequests.filter(a => a.priority === 'urgent' && a.status === 'pending').length,
    high: approvalRequests.filter(a => a.priority === 'high' && a.status === 'pending').length,
    avgApprovalTime: 0, // Would be calculated from historical data
    autoApprovalRate: 0 // Would be calculated from rules and historical data
  };

  return {
    approvalRequests,
    approvalRules,
    selectedApproval,
    filterStatus,
    filterPriority,
    stats,
    isLoading,
    isConnected,
    setSelectedApproval,
    setFilterStatus,
    setFilterPriority,
    approveRequest,
    rejectRequest,
    escalateRequest,
    getFilteredApprovals,
    getPendingApprovals,
    getApprovalsByPriority,
    getApprovalById
  };
}