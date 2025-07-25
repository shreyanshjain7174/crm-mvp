export const createTestLead = (overrides = {}) => ({
  id: 'test-lead-id',
  name: 'Test Lead',
  phone: '+1234567890',
  email: 'test@example.com',
  status: 'NEW',
  priority: 'MEDIUM',
  source: 'API',
  user_id: 'test-user-id',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
});

export const createTestMessage = (overrides = {}) => ({
  id: 'test-message-id',
  lead_id: 'test-lead-id',
  content: 'Test message content',
  direction: 'OUTBOUND',
  message_type: 'TEXT',
  status: 'SENT',
  created_at: new Date(),
  timestamp: new Date(),
  ...overrides
});

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  company: 'Test Company',
  ...overrides
});