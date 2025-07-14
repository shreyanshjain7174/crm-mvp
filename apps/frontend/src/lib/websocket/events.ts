// WebSocket Event Types for Real-time Communication

// Agent Events
export interface AgentStatusUpdateEvent {
  type: 'agent:status_update';
  data: {
    agentId: string;
    status: 'active' | 'idle' | 'processing' | 'error' | 'paused';
    performance: {
      cpu: number;
      memory: number;
      queueSize: number;
    };
    currentTask?: string;
    lastActive: string;
  };
}

export interface AgentTaskStartedEvent {
  type: 'agent:task_started';
  data: {
    agentId: string;
    task: string;
    executionId: string;
    startTime: string;
  };
}

export interface AgentTaskCompletedEvent {
  type: 'agent:task_completed';
  data: {
    agentId: string;
    task: string;
    executionId: string;
    duration: number;
    success: boolean;
    output?: any;
  };
}

export interface AgentTaskFailedEvent {
  type: 'agent:task_failed';
  data: {
    agentId: string;
    task: string;
    executionId: string;
    error: string;
    retryCount: number;
  };
}

export interface AgentPerformanceUpdateEvent {
  type: 'agent:performance_update';
  data: {
    agentId: string;
    performance: {
      cpu: number;
      memory: number;
      queueSize: number;
      responseTime: number;
      throughput: number;
    };
  };
}

// Workflow Events
export interface WorkflowExecutionStartedEvent {
  type: 'workflow:execution_started';
  data: {
    executionId: string;
    workflowId: string;
    trigger: string;
    context: any;
    startTime: string;
  };
}

export interface WorkflowStepStartedEvent {
  type: 'workflow:step_started';
  data: {
    executionId: string;
    stepId: string;
    stepName: string;
    agentId?: string;
    startTime: string;
  };
}

export interface WorkflowStepCompletedEvent {
  type: 'workflow:step_completed';
  data: {
    executionId: string;
    stepId: string;
    stepName: string;
    duration: number;
    output?: any;
    endTime: string;
  };
}

export interface WorkflowStepFailedEvent {
  type: 'workflow:step_failed';
  data: {
    executionId: string;
    stepId: string;
    stepName: string;
    error: string;
    retryable: boolean;
  };
}

export interface WorkflowExecutionCompletedEvent {
  type: 'workflow:execution_completed';
  data: {
    executionId: string;
    status: 'completed' | 'failed' | 'cancelled';
    endTime: string;
    totalDuration: number;
  };
}

export interface WorkflowApprovalRequiredEvent {
  type: 'workflow:approval_required';
  data: {
    executionId: string;
    stepId: string;
    approvalRequest: {
      id: string;
      type: string;
      title: string;
      description: string;
      context: any;
    };
  };
}

// Approval Events
export interface ApprovalNewRequestEvent {
  type: 'approval:new_request';
  data: {
    id: string;
    type: 'message_approval' | 'workflow_approval' | 'action_approval' | 'content_approval';
    title: string;
    description: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    requestedBy: {
      agentId: string;
      agentName: string;
      workflowId?: string;
      workflowExecutionId?: string;
    };
    context: any;
    expiresAt: string;
  };
}

export interface ApprovalStatusUpdatedEvent {
  type: 'approval:status_updated';
  data: {
    approvalId: string;
    status: 'approved' | 'rejected' | 'expired';
    updatedBy?: {
      userId: string;
      userName: string;
      timestamp: string;
      comments?: string;
      reason?: string;
    };
  };
}

export interface ApprovalExpiredEvent {
  type: 'approval:expired';
  data: {
    approvalId: string;
    workflowExecutionId?: string;
  };
}

// Lead & Customer Events
export interface LeadCreatedEvent {
  type: 'lead:created';
  data: {
    leadId: string;
    customerName: string;
    phone: string;
    source: string;
    initialMessage?: string;
    createdAt: string;
  };
}

export interface LeadUpdatedEvent {
  type: 'lead:updated';
  data: {
    leadId: string;
    changes: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      tags?: string[];
    };
    updatedBy: string;
    updatedAt: string;
  };
}

export interface LeadStatusChangedEvent {
  type: 'lead:status_changed';
  data: {
    leadId: string;
    oldStatus: string;
    newStatus: string;
    reason?: string;
    changedBy: string;
    changedAt: string;
  };
}

// Message Events
export interface MessageReceivedEvent {
  type: 'message:received';
  data: {
    messageId: string;
    leadId: string;
    customerName: string;
    content: string;
    platform: 'whatsapp' | 'email' | 'sms';
    receivedAt: string;
    requiresResponse: boolean;
  };
}

export interface MessageSentEvent {
  type: 'message:sent';
  data: {
    messageId: string;
    leadId: string;
    content: string;
    platform: 'whatsapp' | 'email' | 'sms';
    sentBy: string;
    sentAt: string;
    deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  };
}

export interface MessageFailedEvent {
  type: 'message:failed';
  data: {
    messageId: string;
    leadId: string;
    error: string;
    retryable: boolean;
    failedAt: string;
  };
}

// AI Suggestion Events
export interface AISuggestionGeneratedEvent {
  type: 'ai:suggestion_generated';
  data: {
    suggestionId: string;
    type: 'message' | 'action' | 'follow_up';
    leadId: string;
    agentId: string;
    suggestion: any;
    confidence: number;
    requiresApproval: boolean;
    generatedAt: string;
  };
}

export interface AISuggestionApprovedEvent {
  type: 'ai:suggestion_approved';
  data: {
    suggestionId: string;
    approvedBy: string;
    approvedAt: string;
    modifications?: any;
  };
}

export interface AISuggestionRejectedEvent {
  type: 'ai:suggestion_rejected';
  data: {
    suggestionId: string;
    rejectedBy: string;
    rejectedAt: string;
    reason: string;
  };
}

export interface AIActionCompletedEvent {
  type: 'ai:action_completed';
  data: {
    actionId: string;
    type: string;
    success: boolean;
    result?: any;
    error?: string;
    completedAt: string;
  };
}

// System Events
export interface SystemHealthUpdateEvent {
  type: 'system:health_update';
  data: {
    timestamp: string;
    overallStatus: 'healthy' | 'warning' | 'critical';
    systemMetrics: {
      cpuUsage: number;
      memoryUsage: number;
      queueSize: number;
      activeConnections: number;
    };
    serviceStatuses: Array<{
      service: string;
      status: 'healthy' | 'warning' | 'critical';
      lastCheck: string;
    }>;
  };
}

export interface SystemAlertEvent {
  type: 'system:alert';
  data: {
    alertId: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    source: string;
    timestamp: string;
    actionRequired?: boolean;
  };
}

// User Activity Events
export interface UserConnectedEvent {
  type: 'user:connected';
  data: {
    userId: string;
    userName: string;
    sessionId: string;
    connectedAt: string;
  };
}

export interface UserDisconnectedEvent {
  type: 'user:disconnected';
  data: {
    userId: string;
    sessionId: string;
    disconnectedAt: string;
    duration: number;
  };
}

// Union type for all events
export type WebSocketEvent = 
  | AgentStatusUpdateEvent
  | AgentTaskStartedEvent
  | AgentTaskCompletedEvent
  | AgentTaskFailedEvent
  | AgentPerformanceUpdateEvent
  | WorkflowExecutionStartedEvent
  | WorkflowStepStartedEvent
  | WorkflowStepCompletedEvent
  | WorkflowStepFailedEvent
  | WorkflowExecutionCompletedEvent
  | WorkflowApprovalRequiredEvent
  | ApprovalNewRequestEvent
  | ApprovalStatusUpdatedEvent
  | ApprovalExpiredEvent
  | LeadCreatedEvent
  | LeadUpdatedEvent
  | LeadStatusChangedEvent
  | MessageReceivedEvent
  | MessageSentEvent
  | MessageFailedEvent
  | AISuggestionGeneratedEvent
  | AISuggestionApprovedEvent
  | AISuggestionRejectedEvent
  | AIActionCompletedEvent
  | SystemHealthUpdateEvent
  | SystemAlertEvent
  | UserConnectedEvent
  | UserDisconnectedEvent;

// Event type guards
export const isAgentEvent = (event: WebSocketEvent): event is AgentStatusUpdateEvent | AgentTaskStartedEvent | AgentTaskCompletedEvent | AgentTaskFailedEvent | AgentPerformanceUpdateEvent => {
  return event.type.startsWith('agent:');
};

export const isWorkflowEvent = (event: WebSocketEvent): event is WorkflowExecutionStartedEvent | WorkflowStepStartedEvent | WorkflowStepCompletedEvent | WorkflowStepFailedEvent | WorkflowExecutionCompletedEvent | WorkflowApprovalRequiredEvent => {
  return event.type.startsWith('workflow:');
};

export const isApprovalEvent = (event: WebSocketEvent): event is ApprovalNewRequestEvent | ApprovalStatusUpdatedEvent | ApprovalExpiredEvent => {
  return event.type.startsWith('approval:');
};

export const isSystemEvent = (event: WebSocketEvent): event is SystemHealthUpdateEvent | SystemAlertEvent => {
  return event.type.startsWith('system:');
};

// Event channel mappings for scoped subscriptions
export const EVENT_CHANNELS = {
  AGENTS: 'agents',
  WORKFLOWS: 'workflows',
  APPROVALS: 'approvals',
  LEADS: 'leads',
  MESSAGES: 'messages',
  AI_SUGGESTIONS: 'ai_suggestions',
  SYSTEM: 'system',
  USER_ACTIVITY: 'user_activity'
} as const;

export type EventChannel = typeof EVENT_CHANNELS[keyof typeof EVENT_CHANNELS];