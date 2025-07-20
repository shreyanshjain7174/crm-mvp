import fastify, { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { statsRoutes } from '../../src/routes/stats';
import { leadRoutes } from '../../src/routes/leads';
import { messageRoutes } from '../../src/routes/messages';
import { authRoutes } from '../../src/routes/auth';
import { authenticate } from '../../src/middleware/auth';
import { testDb } from '../setup';

// Mock JWT for testing
const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
  decode: jest.fn()
};

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = fastify({ 
    logger: false // Disable logging during tests
  });

  // Register JWT with mock
  await app.register(async function (fastify) {
    (fastify as any).decorate('jwt', mockJwt);
  });

  // Decorate with test database
  (app as any).decorate('db', testDb);
  (app as any).decorate('authenticate', authenticate);

  // Mock Socket.io
  (app as any).decorate('io', {
    emit: jest.fn()
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(leadRoutes, { prefix: '/api/leads' });
  await app.register(messageRoutes, { prefix: '/api/messages' });
  await app.register(statsRoutes, { prefix: '/api/stats' });

  return app;
}

export async function setupTestUser(app: FastifyInstance, userData = {}) {
  const defaultUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
    company: 'Test Company',
    password: 'hashedpassword123',
    ...userData
  };

  await app.db.query(`
    INSERT INTO users (id, email, name, company, password)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [defaultUser.id, defaultUser.email, defaultUser.name, defaultUser.company, defaultUser.password]);

  return defaultUser;
}

export async function setupTestLead(app: FastifyInstance, leadData = {}) {
  const defaultLead = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    status: 'COLD',
    priority: 'MEDIUM',
    source: 'Website',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    ...leadData
  };

  await app.db.query(`
    INSERT INTO leads (id, name, phone, email, status, priority, source, user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    defaultLead.id,
    defaultLead.name,
    defaultLead.phone,
    defaultLead.email,
    defaultLead.status,
    defaultLead.priority,
    defaultLead.source,
    defaultLead.user_id
  ]);

  return defaultLead;
}

export async function setupTestMessage(app: FastifyInstance, messageData = {}) {
  const defaultMessage = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    lead_id: '550e8400-e29b-41d4-a716-446655440001',
    content: 'Test message',
    direction: 'OUTBOUND',
    message_type: 'TEXT',
    status: 'SENT',
    ...messageData
  };

  await app.db.query(`
    INSERT INTO messages (id, lead_id, content, direction, message_type, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING
  `, [
    defaultMessage.id,
    defaultMessage.lead_id,
    defaultMessage.content,
    defaultMessage.direction,
    defaultMessage.message_type,
    defaultMessage.status
  ]);

  return defaultMessage;
}