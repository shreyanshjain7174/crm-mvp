import { DEMO_MODE } from './demo-mode';

// Demo data for dashboard components
export const demoAgentExecutions = [
  {
    id: 'demo-exec-1',
    agentId: 'lead-qualifier-1',
    agentName: 'Lead Qualification Agent',
    taskType: 'qualification',
    taskName: 'Qualify New Lead',
    status: 'completed' as const,
    startTime: new Date(Date.now() - 120000).toISOString(),
    endTime: new Date(Date.now() - 60000).toISOString(),
    duration: 60000,
    input: { leadId: 'lead-1', customerName: 'John Doe' },
    output: { score: 85, priority: 'high' },
    metadata: {
      workflowId: 'lead-qualification-flow',
      workflowExecutionId: 'exec-1',
      retryCount: 0,
      maxRetries: 3,
      priority: 'high' as const,
      tags: ['qualification', 'demo']
    },
    performance: {
      cpuUsage: 45,
      memoryUsage: 128,
      responseTime: 1200,
      throughput: 95
    },
    context: {
      leadId: 'lead-1',
      messageId: 'msg-1',
      userId: 'demo-user-1',
      businessId: 'business-1',
      workflowId: 'lead-qualification-flow'
    }
  },
  {
    id: 'demo-exec-2',
    agentId: 'message-generator-1',
    agentName: 'Message Generation Agent',
    taskType: 'generation',
    taskName: 'Generate WhatsApp Response',
    status: 'running' as const,
    startTime: new Date(Date.now() - 30000).toISOString(),
    duration: 30000,
    input: { leadId: 'lead-2', context: 'product inquiry' },
    metadata: {
      workflowId: 'message-generation-flow',
      workflowExecutionId: 'exec-2',
      retryCount: 0,
      maxRetries: 3,
      priority: 'normal' as const,
      tags: ['generation', 'demo']
    },
    performance: {
      cpuUsage: 32,
      memoryUsage: 96,
      responseTime: 800,
      throughput: 87
    },
    context: {
      leadId: 'lead-2',
      messageId: 'msg-2',
      userId: 'demo-user-1',
      businessId: 'business-1',
      workflowId: 'message-generation-flow'
    }
  }
];

export const demoWorkflowExecutions = [
  {
    id: 'demo-workflow-1',
    workflowId: 'lead-qualification-flow',
    workflowName: 'Lead Qualification & Response',
    trigger: 'New Lead Created',
    status: 'completed' as const,
    progress: 100,
    startTime: new Date(Date.now() - 180000).toISOString(),
    endTime: new Date(Date.now() - 120000).toISOString(),
    totalDuration: 60000,
    steps: [
      {
        id: 'step-1',
        name: 'Intent Recognition',
        type: 'agent_task' as const,
        status: 'completed' as const,
        startTime: new Date(Date.now() - 180000).toISOString(),
        endTime: new Date(Date.now() - 160000).toISOString(),
        duration: 20000,
        input: { message: 'Hello, I need info about your products' },
        output: { intent: 'product_inquiry', confidence: 0.95 },
        metadata: {
          retryCount: 0,
          maxRetries: 3,
          approvalRequired: false
        }
      },
      {
        id: 'step-2',
        name: 'Lead Qualification',
        type: 'agent_task' as const,
        status: 'completed' as const,
        startTime: new Date(Date.now() - 160000).toISOString(),
        endTime: new Date(Date.now() - 140000).toISOString(),
        duration: 20000,
        input: { leadData: { name: 'John Doe', phone: '+91999999999' } },
        output: { score: 85, category: 'hot' },
        metadata: {
          retryCount: 0,
          maxRetries: 3,
          approvalRequired: false
        }
      },
      {
        id: 'step-3',
        name: 'Response Generation',
        type: 'agent_task' as const,
        status: 'completed' as const,
        startTime: new Date(Date.now() - 140000).toISOString(),
        endTime: new Date(Date.now() - 120000).toISOString(),
        duration: 20000,
        input: { context: 'product_inquiry', leadScore: 85 },
        output: { message: 'Thank you for your interest! Let me share our product catalog.' },
        metadata: {
          retryCount: 0,
          maxRetries: 3,
          approvalRequired: true,
          approvedBy: 'demo-user-1',
          approvedAt: new Date(Date.now() - 120000).toISOString()
        }
      }
    ],
    context: {
      leadId: 'lead-1',
      messageId: 'msg-1',
      userId: 'demo-user-1',
      businessId: 'business-1',
      variables: { customerName: 'John Doe', productType: 'software' }
    },
    metrics: {
      totalSteps: 3,
      completedSteps: 3,
      failedSteps: 0,
      averageStepDuration: 20000
    }
  }
];

export const demoApprovalRequests = [
  {
    id: 'demo-approval-1',
    title: 'WhatsApp Response Approval',
    type: 'message_approval' as const,
    priority: 'high' as const,
    status: 'pending' as const,
    description: 'AI-generated response for product inquiry',
    requestedBy: 'Message Generation Agent',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    context: {
      leadId: 'lead-3',
      messageId: 'msg-3',
      originalMessage: 'Can you tell me about pricing?',
      proposedResponse: 'Our pricing starts at ₹999/month for the basic plan. Would you like me to schedule a demo to show you the features?',
      confidence: 0.87,
      riskLevel: 'medium' as const
    },
    metadata: {
      workflowId: 'message-generation-flow',
      executionId: 'exec-3',
      stepId: 'step-approval-1'
    }
  },
  {
    id: 'demo-approval-2',
    title: 'Lead Status Change',
    type: 'action_approval' as const,
    priority: 'normal' as const,
    status: 'pending' as const,
    description: 'Change lead status from WARM to HOT',
    requestedBy: 'Lead Qualification Agent',
    createdAt: new Date(Date.now() - 180000).toISOString(),
    expiresAt: new Date(Date.now() + 420000).toISOString(),
    context: {
      leadId: 'lead-4',
      currentStatus: 'WARM',
      proposedStatus: 'HOT',
      reason: 'Lead showed high interest in premium features',
      confidence: 0.92,
      riskLevel: 'low' as const
    },
    metadata: {
      workflowId: 'lead-qualification-flow',
      executionId: 'exec-4',
      stepId: 'step-status-change-1'
    }
  }
];

// Demo data generator for real-time notifications
export const generateDemoNotification = () => {
  const notifications = [
    {
      type: 'success' as const,
      category: 'agent' as const,
      title: 'Agent Task Completed',
      message: 'Lead Qualification Agent successfully processed new lead',
    },
    {
      type: 'info' as const,
      category: 'workflow' as const,
      title: 'Workflow Started',
      message: 'Follow-up Sequence workflow initiated for lead #1234',
    },
    {
      type: 'warning' as const,
      category: 'approval' as const,
      title: 'Approval Required',
      message: 'WhatsApp response needs your approval before sending',
    },
    {
      type: 'info' as const,
      category: 'message' as const,
      title: 'New Message Received',
      message: 'Customer inquiry received on WhatsApp',
    }
  ];

  return notifications[Math.floor(Math.random() * notifications.length)];
};

// Demo data hooks
export const useDemoData = () => {
  return {
    agentExecutions: DEMO_MODE ? demoAgentExecutions : [],
    workflowExecutions: DEMO_MODE ? demoWorkflowExecutions : [],
    approvalRequests: DEMO_MODE ? demoApprovalRequests : [],
    generateNotification: DEMO_MODE ? generateDemoNotification : () => null
  };
};