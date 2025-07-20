export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  name: 'Test User',
  company: 'Test Company',
  password: 'hashedpassword123'
};

export const mockLead = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  status: 'COLD' as const,
  priority: 'MEDIUM' as const,
  source: 'Website',
  user_id: mockUser.id
};

export const mockLeads = [
  {
    ...mockLead,
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'John Doe',
    status: 'COLD' as const
  },
  {
    ...mockLead,
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Jane Smith',
    phone: '+1234567891',
    email: 'jane@example.com',
    status: 'WARM' as const
  },
  {
    ...mockLead,
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Bob Johnson',
    phone: '+1234567892',
    email: 'bob@example.com',
    status: 'HOT' as const
  }
];

export const mockMessage = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  lead_id: mockLead.id,
  content: 'Hello, this is a test message',
  direction: 'OUTBOUND' as const,
  message_type: 'TEXT' as const,
  status: 'SENT' as const
};

export const mockMessages = [
  {
    ...mockMessage,
    id: '550e8400-e29b-41d4-a716-446655440010',
    direction: 'OUTBOUND' as const,
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    ...mockMessage,
    id: '550e8400-e29b-41d4-a716-446655440011',
    direction: 'INBOUND' as const,
    content: 'Reply message',
    created_at: new Date('2024-01-02').toISOString()
  }
];

export const mockDashboardStats = {
  totalLeads: 3,
  activeConversations: 1,
  conversionRate: 33.3,
  hotLeads: 1,
  growth: {
    leads: 50.0,
    conversations: 100.0,
    hotLeads: 0.0,
    conversionRate: 0
  }
};

export const mockUserProgress = {
  stage: 'intermediate',
  stats: {
    contactsAdded: 3,
    messagesSent: 2,
    aiInteractions: 0,
    templatesUsed: 0,
    pipelineActions: 0
  },
  progressPercentage: 45,
  nextStageRequirements: ['Send 3 more messages', 'Perform 10 pipeline actions']
};