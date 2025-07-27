import { v4 as uuidv4 } from 'uuid';

export const factories = {
  user: (overrides = {}) => ({
    id: uuidv4(),
    email: `user${Date.now()}@example.com`,
    name: 'Test User',
    company: 'Test Company',
    password: 'password123',
    ...overrides,
  }),

  contact: (overrides = {}) => ({
    id: uuidv4(),
    name: 'Test Contact',
    email: `contact${Date.now()}@example.com`,
    phone: `+1${Math.floor(Math.random() * 9999999999)}`,
    company: 'Contact Company',
    position: 'Manager',
    source: 'Website',
    notes: 'Test notes',
    tags: ['test', 'sample'],
    status: 'ACTIVE',
    ...overrides,
  }),

  message: (overrides = {}) => ({
    id: uuidv4(),
    content: 'Test message content',
    direction: 'OUTBOUND',
    message_type: 'TEXT',
    status: 'SENT',
    ...overrides,
  }),

  lead: (overrides = {}) => ({
    id: uuidv4(),
    name: 'Test Lead',
    email: `lead${Date.now()}@example.com`,
    phone: `+1${Math.floor(Math.random() * 9999999999)}`,
    status: 'NEW',
    priority: 'MEDIUM',
    source: 'Website',
    notes: 'Test lead notes',
    ...overrides,
  }),

  integration: (overrides = {}) => ({
    id: uuidv4(),
    name: 'Test Integration',
    type: 'whatsapp',
    config: {
      apiKey: 'test-api-key',
      webhookUrl: 'https://test.example.com/webhook',
    },
    status: 'active',
    ...overrides,
  }),

  notification: (overrides = {}) => ({
    id: uuidv4(),
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info',
    priority: 'medium',
    is_read: false,
    ...overrides,
  }),

  generateBatch: <T>(factory: (overrides?: any) => T, count: number, overrides?: any): T[] => {
    return Array.from({ length: count }, () => factory(overrides));
  },
};

export function generateBatch<T>(factory: (overrides?: any) => T, count: number, overrides?: any): T[] {
  return Array.from({ length: count }, () => factory(overrides));
}