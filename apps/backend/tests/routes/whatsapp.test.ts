import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { createAuthenticatedUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import axios from 'axios';

// Mock axios for external API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsApp Routes', () => {
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
    jest.clearAllMocks();
    
    // Set default environment variables for tests
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_access_token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_number_id';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_verify_token';
    process.env.WHATSAPP_APP_SECRET = 'test_app_secret';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WHATSAPP_APP_SECRET;
  });

  describe('GET /api/whatsapp/status', () => {
    it('should return connected status when properly configured', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Mock successful Facebook API response
      mockedAxios.get.mockResolvedValue({
        data: {
          display_phone_number: '+1234567890',
          verified_name: 'Test Business',
          quality_rating: 'GREEN'
        }
      });

      const response = await api.get('/api/whatsapp/status', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.connected).toBe(true);
      expect(response.json.configured).toBe(true);
      expect(response.json.businessProfile).toBeDefined();
      expect(response.json.message).toBe('WhatsApp Business API connected successfully');
    });

    it('should return not configured when credentials missing', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Remove environment variables
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;

      const response = await api.get('/api/whatsapp/status', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.connected).toBe(false);
      expect(response.json.configured).toBe(false);
      expect(response.json.message).toBe('WhatsApp API credentials not configured');
    });

    it('should return configured but not connected when API call fails', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Mock failed Facebook API response
      mockedAxios.get.mockRejectedValue({
        response: {
          data: {
            error: {
              message: 'Invalid access token'
            }
          }
        }
      });

      const response = await api.get('/api/whatsapp/status', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.connected).toBe(false);
      expect(response.json.configured).toBe(true);
      expect(response.json.error).toBe('Invalid access token');
    });

    it('should require authentication', async () => {
      const response = await api.get('/api/whatsapp/status');
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/whatsapp/webhook', () => {
    it('should verify webhook with correct token', async () => {
      const response = await api.get('/api/whatsapp/webhook', {
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test_verify_token',
          'hub.challenge': 'test_challenge_123'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('test_challenge_123');
    });

    it('should reject webhook with incorrect token', async () => {
      const response = await api.get('/api/whatsapp/webhook', {
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': 'test_challenge_123'
        }
      });

      expect(response.statusCode).toBe(403);
      expect(response.body).toBe('Forbidden');
    });

    it('should reject webhook with missing parameters', async () => {
      const response = await api.get('/api/whatsapp/webhook', {
        query: {
          'hub.mode': 'subscribe'
          // Missing token and challenge
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toBe('Bad Request');
    });
  });

  describe('POST /api/whatsapp/webhook', () => {
    it('should process incoming text message and create lead', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_number_id'
              },
              contacts: [{
                profile: {
                  name: 'John Doe'
                },
                wa_id: '1234567890'
              }],
              messages: [{
                from: '1234567890',
                id: 'msg_123',
                timestamp: '1234567890',
                type: 'text',
                text: {
                  body: 'Hello, I need help with my order'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const response = await api.post('/api/whatsapp/webhook', webhookPayload, {
        headers: {
          'x-hub-signature-256': 'sha256=test_signature'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('OK');

      // Verify lead was created
      const leadResult = await app.db.query(
        'SELECT * FROM leads WHERE phone = $1',
        ['+1234567890']
      );
      expect(leadResult.rows).toHaveLength(1);
      expect(leadResult.rows[0].name).toBe('John Doe');
      expect(leadResult.rows[0].source).toBe('WhatsApp');

      // Verify message was created
      const messageResult = await app.db.query(
        'SELECT * FROM messages WHERE lead_id = $1',
        [leadResult.rows[0].id]
      );
      expect(messageResult.rows).toHaveLength(1);
      expect(messageResult.rows[0].content).toBe('Hello, I need help with my order');
      expect(messageResult.rows[0].direction).toBe('INBOUND');
      expect(messageResult.rows[0].whatsapp_id).toBe('msg_123');
    });

    it('should process message status updates', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create a test message first
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Status Test Lead', '+1234567890', 'NEW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, whatsapp_id, status) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'Test message', 'OUTBOUND', 'msg_status_123', 'SENT']
      );

      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_number_id'
              },
              statuses: [{
                id: 'msg_status_123',
                status: 'delivered',
                timestamp: '1234567890',
                recipient_id: '1234567890'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const response = await api.post('/api/whatsapp/webhook', webhookPayload);

      expect(response.statusCode).toBe(200);

      // Verify message status was updated
      const messageResult = await app.db.query(
        'SELECT status FROM messages WHERE whatsapp_id = $1',
        ['msg_status_123']
      );
      expect(messageResult.rows[0].status).toBe('DELIVERED');
    });

    it('should handle webhook errors', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_number_id'
              },
              errors: [{
                code: 130429,
                title: 'Rate limit exceeded',
                message: 'Too many messages sent',
                error_data: {
                  details: 'Please reduce message frequency'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const response = await api.post('/api/whatsapp/webhook', webhookPayload);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('OK');
    });

    it('should handle different message types', async () => {
      const imageMessagePayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_number_id'
              },
              contacts: [{
                profile: { name: 'Image Sender' },
                wa_id: '1234567890'
              }],
              messages: [{
                from: '1234567890',
                id: 'img_msg_123',
                timestamp: '1234567890',
                type: 'image',
                image: {
                  caption: 'Check this out!',
                  mime_type: 'image/jpeg',
                  sha256: 'abc123',
                  id: 'image_id_123'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const response = await api.post('/api/whatsapp/webhook', imageMessagePayload);

      expect(response.statusCode).toBe(200);

      // Verify message content was formatted correctly
      const messageResult = await app.db.query(
        'SELECT content FROM messages WHERE whatsapp_id = $1',
        ['img_msg_123']
      );
      expect(messageResult.rows[0].content).toBe('[Image: Check this out!]');
    });

    it('should return 200 even on processing errors', async () => {
      // Send malformed payload that will cause processing error
      const malformedPayload = {
        object: 'whatsapp_business_account',
        entry: 'invalid_entry_format'
      };

      const response = await api.post('/api/whatsapp/webhook', malformedPayload);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('OK');
    });
  });

  describe('POST /api/whatsapp/test-receive', () => {
    it('should simulate receiving a WhatsApp message', async () => {
      const user = await createAuthenticatedUser(app);

      const testData = {
        phone: '+1234567890',
        message: 'Test message from simulation',
        senderName: 'Test Sender'
      };

      const response = await api.post('/api/whatsapp/test-receive', testData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.message).toBe('Test message processed');

      // Verify lead and message were created
      const leadResult = await app.db.query(
        'SELECT * FROM leads WHERE phone = $1',
        ['+1234567890']
      );
      expect(leadResult.rows).toHaveLength(1);
      expect(leadResult.rows[0].name).toBe('Test Sender');

      const messageResult = await app.db.query(
        'SELECT * FROM messages WHERE lead_id = $1',
        [leadResult.rows[0].id]
      );
      expect(messageResult.rows).toHaveLength(1);
      expect(messageResult.rows[0].content).toBe('Test message from simulation');
    });

    it('should require authentication', async () => {
      const response = await api.post('/api/whatsapp/test-receive', {
        phone: '+1234567890',
        message: 'Test'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/whatsapp/send', () => {
    it('should send a text message successfully', async () => {
      const user = await createAuthenticatedUser(app);

      // Create a test lead
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Send Test Lead', '+1234567890', 'NEW', user.id]
      );

      // Mock successful Facebook API response
      mockedAxios.post.mockResolvedValue({
        data: {
          messages: [{ id: 'sent_msg_123' }]
        }
      });

      const messageData = {
        phone: '+1234567890',
        message: 'Hello from our CRM system',
        messageType: 'text'
      };

      const response = await api.post('/api/whatsapp/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.messageId).toBe('sent_msg_123');

      // Verify message was stored in database
      const messageResult = await app.db.query(
        'SELECT * FROM messages WHERE whatsapp_id = $1',
        ['sent_msg_123']
      );
      expect(messageResult.rows).toHaveLength(1);
      expect(messageResult.rows[0].content).toBe('Hello from our CRM system');
      expect(messageResult.rows[0].direction).toBe('OUTBOUND');
      expect(messageResult.rows[0].status).toBe('SENT');
    });

    it('should send template message', async () => {
      const user = await createAuthenticatedUser(app);

      // Create a test lead
      await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4)',
        ['Template Test Lead', '+1234567890', 'NEW', user.id]
      );

      mockedAxios.post.mockResolvedValue({
        data: {
          messages: [{ id: 'template_msg_123' }]
        }
      });

      const messageData = {
        phone: '+1234567890',
        message: 'Template message',
        messageType: 'template',
        templateName: 'hello_world',
        templateParams: ['John', 'Doe']
      };

      const response = await api.post('/api/whatsapp/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);

      // Verify Facebook API was called with correct payload
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          to: '1234567890',
          type: 'template',
          template: expect.objectContaining({
            name: 'hello_world',
            language: { code: 'en_US' },
            components: expect.arrayContaining([
              expect.objectContaining({
                type: 'body',
                parameters: expect.arrayContaining([
                  { type: 'text', text: 'John' },
                  { type: 'text', text: 'Doe' }
                ])
              })
            ])
          })
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_access_token'
          })
        })
      );
    });

    it('should handle media messages', async () => {
      const user = await createAuthenticatedUser(app);

      await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4)',
        ['Media Test Lead', '+1234567890', 'NEW', user.id]
      );

      mockedAxios.post.mockResolvedValue({
        data: {
          messages: [{ id: 'media_msg_123' }]
        }
      });

      const messageData = {
        phone: '+1234567890',
        message: 'image.jpg',
        messageType: 'image',
        mediaUrl: 'https://example.com/image.jpg',
        mediaCaption: 'Check this image'
      };

      const response = await api.post('/api/whatsapp/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
    });

    it('should return error when credentials not configured', async () => {
      const user = await createAuthenticatedUser(app);

      // Remove environment variables
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;

      const messageData = {
        phone: '+1234567890',
        message: 'Test message'
      };

      const response = await api.post('/api/whatsapp/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json.error).toBe('WhatsApp API credentials not configured');
    });

    it('should validate template parameters', async () => {
      const user = await createAuthenticatedUser(app);

      const messageData = {
        phone: '+1234567890',
        message: 'Template without name',
        messageType: 'template'
        // Missing templateName
      };

      const response = await api.post('/api/whatsapp/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Template name required for template messages');
    });

    it('should handle Facebook API errors', async () => {
      const user = await createAuthenticatedUser(app);

      await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4)',
        ['Error Test Lead', '+1234567890', 'NEW', user.id]
      );

      // Mock Facebook API error
      mockedAxios.post.mockRejectedValue({
        response: {
          data: {
            error: {
              message: 'Invalid phone number format'
            }
          }
        }
      });

      const messageData = {
        phone: 'invalid-phone',
        message: 'Test message'
      };

      const response = await api.post('/api/whatsapp/send', messageData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json.error).toBe('Invalid phone number format');
    });

    it('should require authentication', async () => {
      const response = await api.post('/api/whatsapp/send', {
        phone: '+1234567890',
        message: 'Test message'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Message processing integration', () => {
    it('should handle complete WhatsApp conversation flow', async () => {
      const user = await createAuthenticatedUser(app);

      // 1. Receive incoming message (creates lead)
      const incomingPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_number_id'
              },
              contacts: [{
                profile: { name: 'Integration Test User' },
                wa_id: '1234567890'
              }],
              messages: [{
                from: '1234567890',
                id: 'incoming_msg_123',
                timestamp: '1234567890',
                type: 'text',
                text: {
                  body: 'Hi, I need support'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      await api.post('/api/whatsapp/webhook', incomingPayload);

      // Verify lead was created
      const leadResult = await app.db.query(
        'SELECT * FROM leads WHERE phone = $1',
        ['+1234567890']
      );
      expect(leadResult.rows).toHaveLength(1);
      const lead = leadResult.rows[0];
      expect(lead.name).toBe('Integration Test User');

      // 2. Send reply message
      mockedAxios.post.mockResolvedValue({
        data: {
          messages: [{ id: 'reply_msg_123' }]
        }
      });

      await api.post('/api/whatsapp/send', {
        phone: '+1234567890',
        message: 'Hello! How can we help you today?'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // 3. Receive status update for sent message
      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_number_id'
              },
              statuses: [{
                id: 'reply_msg_123',
                status: 'read',
                timestamp: '1234567891',
                recipient_id: '1234567890'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      await api.post('/api/whatsapp/webhook', statusPayload);

      // Verify complete conversation flow
      const allMessages = await app.db.query(
        'SELECT * FROM messages WHERE lead_id = $1 ORDER BY timestamp ASC',
        [lead.id]
      );

      expect(allMessages.rows).toHaveLength(2);
      
      // First message (incoming)
      expect(allMessages.rows[0].content).toBe('Hi, I need support');
      expect(allMessages.rows[0].direction).toBe('INBOUND');
      expect(allMessages.rows[0].whatsapp_id).toBe('incoming_msg_123');
      
      // Second message (outgoing)
      expect(allMessages.rows[1].content).toBe('Hello! How can we help you today?');
      expect(allMessages.rows[1].direction).toBe('OUTBOUND');
      expect(allMessages.rows[1].whatsapp_id).toBe('reply_msg_123');
      expect(allMessages.rows[1].status).toBe('READ'); // Status was updated
    });
  });
});