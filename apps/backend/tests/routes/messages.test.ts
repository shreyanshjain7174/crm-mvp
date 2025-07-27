import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { factories } from '../helpers/factories';
import { createAuthenticatedUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { getNextPhone } from '../helpers/test-data';

describe('Messages Routes', () => {
  let app: FastifyInstance;
  let api: ApiTestHelper;

  beforeAll(async () => {
    app = await buildApp();
    api = createApiHelper(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('GET /api/messages', () => {
    it('should get messages with pagination', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create test lead
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, user_id) VALUES ($1, $2, $3) RETURNING id',
        ['Test Lead', getNextPhone(), user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Create test messages
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, status) VALUES ($1, $2, $3, $4)',
        [leadId, 'Test message', 'INBOUND', 'SENT']
      );

      const response = await api.get('/api/messages', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveProperty('messages');
      expect(response.json).toHaveProperty('pagination');
      expect(response.json.messages).toHaveLength(1);
      expect(response.json.messages[0].content).toBe('Test message');
    });

    it('should require authentication', async () => {
      const response = await api.get('/api/messages');
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/messages/stats', () => {
    it('should return message statistics', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/messages/stats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveProperty('total');
      expect(response.json).toHaveProperty('sent');
      expect(response.json).toHaveProperty('received');
      expect(response.json).toHaveProperty('aiGenerated');
      expect(response.json).toHaveProperty('todayCount');
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should return conversations with latest messages', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create test lead
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Lead', getNextPhone(), 'test@example.com', 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Create test message
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, NOW())',
        [leadId, 'Hello World', 'INBOUND', 'TEXT']
      );

      const response = await api.get('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(1);
      expect(response.json[0].id).toBe(leadId);
      expect(response.json[0].latest_message).toBeDefined();
      expect(response.json[0].latest_message.content).toBe('Hello World');
    });

    it('should only return leads with messages', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create lead without messages
      await app.db.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5)',
        ['Lead Without Messages', getNextPhone(), 'no-messages@example.com', 'NEW', user.id]
      );

      const response = await api.get('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(0);
    });

    it('should order conversations by latest activity', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create two leads with messages
      const lead1Result = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id, updated_at) VALUES ($1, $2, $3, $4, NOW() - INTERVAL \'1 hour\') RETURNING id',
        ['Older Lead', getNextPhone(), 'NEW', user.id]
      );
      const lead1Id = lead1Result.rows[0].id;

      const lead2Result = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id, updated_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
        ['Newer Lead', getNextPhone(), 'NEW', user.id]
      );
      const lead2Id = lead2Result.rows[0].id;

      // Add messages to both
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, NOW() - INTERVAL \'1 hour\')',
        [lead1Id, 'Older message', 'INBOUND', 'TEXT']
      );
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, NOW())',
        [lead2Id, 'Newer message', 'INBOUND', 'TEXT']
      );

      const response = await api.get('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(2);
      expect(response.json[0].name).toBe('Newer Lead');
      expect(response.json[1].name).toBe('Older Lead');
    });

    it('should require authentication', async () => {
      const response = await api.get('/api/messages/conversations');
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/messages/lead/:leadId', () => {
    it('should return messages for a specific lead', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create test lead
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Message Test Lead', getNextPhone(), 'messages@example.com', 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Create multiple messages
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, NOW() - INTERVAL \'2 hours\')',
        [leadId, 'First message', 'INBOUND', 'TEXT']
      );
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, NOW() - INTERVAL \'1 hour\')',
        [leadId, 'Second message', 'OUTBOUND', 'TEXT']
      );
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, NOW())',
        [leadId, 'Third message', 'INBOUND', 'TEXT']
      );

      const response = await api.get(`/api/messages/lead/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(3);
      expect(response.json[0].content).toBe('First message'); // Ordered by timestamp ASC
      expect(response.json[1].content).toBe('Second message');
      expect(response.json[2].content).toBe('Third message');
    });

    it('should return empty array for lead with no messages', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create lead without messages
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Empty Lead', getNextPhone(), 'empty@example.com', 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.get(`/api/messages/lead/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(0);
    });

    it('should return messages in chronological order', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Chronology Test Lead', getNextPhone(), 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Insert messages in random order
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'Message 3', 'INBOUND', 'TEXT', '2024-01-03 10:00:00']
      );
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'Message 1', 'INBOUND', 'TEXT', '2024-01-01 10:00:00']
      );
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'Message 2', 'OUTBOUND', 'TEXT', '2024-01-02 10:00:00']
      );

      const response = await api.get(`/api/messages/lead/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(3);
      expect(response.json[0].content).toBe('Message 1');
      expect(response.json[1].content).toBe('Message 2');
      expect(response.json[2].content).toBe('Message 3');
    });

    it('should require authentication', async () => {
      const response = await api.get('/api/messages/lead/fake-id');
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/messages/send', () => {
    it('should send a message successfully', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create test lead
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Send Test Lead', getNextPhone(), 'send@example.com', 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const messageData = {
        leadId,
        content: 'Test message content',
        messageType: 'TEXT'
      };

      const response = await api.post('/api/messages/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.content).toBe('Test message content');
      expect(response.json.direction).toBe('OUTBOUND');
      expect(response.json.message_type).toBe('TEXT');
      expect(response.json.lead_id).toBe(leadId);

      // Verify message was stored in database
      const dbResult = await app.db.query(
        'SELECT * FROM messages WHERE lead_id = $1 AND content = $2',
        [leadId, 'Test message content']
      );
      expect(dbResult.rows).toHaveLength(1);
    });

    it('should default message type to TEXT if not provided', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Default Type Lead', getNextPhone(), 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const messageData = {
        leadId,
        content: 'Message without type'
      };

      const response = await api.post('/api/messages/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.message_type).toBe('TEXT');
    });

    it('should return 404 for non-existent lead', async () => {
      const user = await createAuthenticatedUser(app);

      const messageData = {
        leadId: 'non-existent-lead-id',
        content: 'Test message'
      };

      const response = await api.post('/api/messages/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json.error).toBe('Lead not found');
    });

    it('should validate required fields', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/messages/send', {
        // Missing required fields
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
      expect(response.json.details).toBeDefined();
    });

    it('should validate content is not empty', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Empty Content Lead', getNextPhone(), 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const messageData = {
        leadId,
        content: '' // Empty content
      };

      const response = await api.post('/api/messages/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
    });

    it('should require authentication', async () => {
      const response = await api.post('/api/messages/send', {
        leadId: 'test-lead',
        content: 'Test message'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /api/messages/:id/read', () => {
    it('should mark message as read', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create test lead and message
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Read Test Lead', getNextPhone(), 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const messageResult = await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [leadId, 'Unread message', 'INBOUND', 'TEXT', 'UNREAD']
      );
      const messageId = messageResult.rows[0].id;

      const response = await api.put(`/api/messages/${messageId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.status).toBe('read');
      expect(response.json.id).toBe(messageId);

      // Verify status was updated in database
      const dbResult = await app.db.query(
        'SELECT status FROM messages WHERE id = $1',
        [messageId]
      );
      expect(dbResult.rows[0].status).toBe('read');
    });

    it('should handle non-existent message ID', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.put('/api/messages/non-existent-id/read', {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toBeNull(); // No message found to update
    });

    it('should require authentication', async () => {
      const response = await api.put('/api/messages/test-id/read', {});
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Message flow integration tests', () => {
    it('should handle complete message conversation flow', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create lead
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Integration Test Lead', getNextPhone(), 'integration@example.com', 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // 1. Send initial message
      const sendResponse = await api.post('/api/messages/send', {
        leadId,
        content: 'Hello, how can we help you?'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(sendResponse.statusCode).toBe(200);
      const sentMessage = sendResponse.json;

      // 2. Simulate incoming response
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, status) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'I need help with my order', 'INBOUND', 'TEXT', 'UNREAD']
      );

      // 3. Get conversations (should show this lead)
      const conversationsResponse = await api.get('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(conversationsResponse.statusCode).toBe(200);
      expect(conversationsResponse.json).toHaveLength(1);
      expect(conversationsResponse.json[0].latest_message.content).toBe('I need help with my order');

      // 4. Get all messages for the lead
      const messagesResponse = await api.get(`/api/messages/lead/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(messagesResponse.statusCode).toBe(200);
      expect(messagesResponse.json).toHaveLength(2);
      expect(messagesResponse.json[0].content).toBe('Hello, how can we help you?');
      expect(messagesResponse.json[1].content).toBe('I need help with my order');

      // 5. Mark the incoming message as read
      const incomingMessageId = messagesResponse.json[1].id;
      const readResponse = await api.put(`/api/messages/${incomingMessageId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.json.status).toBe('read');
    });

    it('should handle multiple conversations correctly', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create two leads with messages
      const lead1Result = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Lead One', getNextPhone(), 'NEW', user.id]
      );
      const lead1Id = lead1Result.rows[0].id;

      const lead2Result = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Lead Two', getNextPhone(), 'NEW', user.id]
      );
      const lead2Id = lead2Result.rows[0].id;

      // Send messages to both leads
      await api.post('/api/messages/send', {
        leadId: lead1Id,
        content: 'Message to lead 1'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      await api.post('/api/messages/send', {
        leadId: lead2Id,
        content: 'Message to lead 2'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Get conversations
      const conversationsResponse = await api.get('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(conversationsResponse.statusCode).toBe(200);
      expect(conversationsResponse.json).toHaveLength(2);

      // Get messages for specific lead
      const lead1MessagesResponse = await api.get(`/api/messages/lead/${lead1Id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(lead1MessagesResponse.statusCode).toBe(200);
      expect(lead1MessagesResponse.json).toHaveLength(1);
      expect(lead1MessagesResponse.json[0].content).toBe('Message to lead 1');
    });
  });
});