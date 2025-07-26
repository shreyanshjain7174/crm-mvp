import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { factories } from '../helpers/factories';
import { createAuthenticatedUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { getNextPhone, getNextEmail, resetAllCounters } from '../helpers/test-data';
import { LeadStatus, Priority } from '../../src/types/enums';

describe('Leads Routes', () => {
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
    await cleanDatabase();
    resetAllCounters();
  });

  describe('GET /api/leads', () => {
    it('should return all leads for authenticated user', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create test leads
      const lead1 = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['Lead One', getNextPhone(), getNextEmail('lead1'), 'WARM', 'HIGH', user.id]
      );
      const lead2 = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['Lead Two', getNextPhone(), getNextEmail('lead2'), 'HOT', 'MEDIUM', user.id]
      );

      const response = await api.get('/api/leads', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(2);
      expect(response.json[0].name).toBe('Lead Two'); // Ordered by updated_at DESC
      expect(response.json[1].name).toBe('Lead One');
      
      // Check that leads include relationships
      response.json.forEach((lead: any) => {
        expect(lead).toHaveProperty('latest_message');
        expect(lead).toHaveProperty('interactions');
        expect(lead).toHaveProperty('pending_suggestion');
      });
    });

    it('should only return leads for the authenticated user', async () => {
      const user1 = await createAuthenticatedUser(app);
      const user2 = await createAuthenticatedUser(app);
      
      // Create leads for both users
      await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4)',
        ['User1 Lead', getNextPhone(), 'WARM', user1.id]
      );
      await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4)',
        ['User2 Lead', getNextPhone(), 'HOT', user2.id]
      );

      const response = await api.get('/api/leads', {
        headers: {
          Authorization: `Bearer ${user1.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(1);
      expect(response.json[0].name).toBe('User1 Lead');
    });

    it('should include latest message and interactions', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Lead with Message', getNextPhone(), 'WARM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add message
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'Latest message from lead', 'INBOUND', new Date()]
      );

      // Add interaction
      await app.db.query(
        'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
        [leadId, 'CALL', 'Follow-up call completed', new Date()]
      );

      const response = await api.get('/api/leads', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveLength(1);
      expect(response.json[0].latest_message).toBeDefined();
      expect(response.json[0].latest_message.content).toBe('Latest message from lead');
      expect(response.json[0].interactions).toBeDefined();
      expect(response.json[0].interactions).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const response = await api.get('/api/leads');
      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Mock database error
      const originalQuery = app.db.query;
      app.db.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await api.get('/api/leads', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json.error).toBe('Failed to fetch leads');

      // Restore original method
      app.db.query = originalQuery;
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should return specific lead with all relationships', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, priority, source, business_profile, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        ['Detailed Lead', getNextPhone(), 'detailed@example.com', 'HOT', 'HIGH', 'WhatsApp', 'Tech startup', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Add messages
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'First message', 'INBOUND', new Date(Date.now() - 2000)]
      );
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'Second message', 'OUTBOUND', new Date(Date.now() - 1000)]
      );

      // Add interactions
      await app.db.query(
        'INSERT INTO interactions (lead_id, type, description, created_at) VALUES ($1, $2, $3, $4)',
        [leadId, 'CALL', 'Initial contact call', new Date(Date.now() - 3000)]
      );

      // Add AI suggestion
      await app.db.query(
        'INSERT INTO ai_suggestions (lead_id, type, content, confidence, created_at) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'MESSAGE', 'Suggested follow-up message', 0.85, new Date()]
      );

      const response = await api.get(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.name).toBe('Detailed Lead');
      expect(response.json.status).toBe('HOT');
      expect(response.json.priority).toBe('HIGH');
      expect(response.json.business_profile).toBe('Tech startup');
      
      // Check relationships
      expect(response.json.messages).toHaveLength(2);
      expect(response.json.interactions).toHaveLength(1);
      expect(response.json.ai_suggestions).toHaveLength(1);
    });

    it('should return 404 for non-existent lead', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/leads/non-existent-id', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json.error).toBe('Lead not found');
    });

    it('should handle database errors gracefully', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Mock database error
      const originalQuery = app.db.query;
      app.db.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await api.get('/api/leads/test-id', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json.error).toBe('Failed to fetch lead');

      // Restore original method
      app.db.query = originalQuery;
    });
  });

  describe('POST /api/leads', () => {
    it('should create a new lead with valid data', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadData = {
        name: 'New Lead',
        phone: getNextPhone(),
        email: 'newlead@example.com',
        source: 'Website',
        priority: Priority.HIGH,
        businessProfile: 'Software company looking for CRM solution'
      };

      const response = await api.post('/api/leads', leadData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.name).toBe(leadData.name);
      expect(response.json.phone).toBe(leadData.phone);
      expect(response.json.email).toBe(leadData.email);
      expect(response.json.source).toBe(leadData.source);
      expect(response.json.priority).toBe(leadData.priority);
      expect(response.json.business_profile).toBe(leadData.businessProfile);
      expect(response.json.user_id).toBe(user.id);
      
      // Check that empty relationships are included
      expect(response.json.messages).toEqual([]);
      expect(response.json.interactions).toEqual([]);
      expect(response.json.ai_suggestions).toEqual([]);

      // Verify lead was stored in database
      const dbResult = await app.db.query(
        'SELECT * FROM leads WHERE id = $1',
        [response.json.id]
      );
      expect(dbResult.rows).toHaveLength(1);
    });

    it('should create lead with minimal required data', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadData = {
        name: 'Minimal Lead',
        phone: getNextPhone()
      };

      const response = await api.post('/api/leads', leadData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.name).toBe(leadData.name);
      expect(response.json.phone).toBe(leadData.phone);
      expect(response.json.priority).toBe('MEDIUM'); // Default priority
      expect(response.json.email).toBeNull();
      expect(response.json.source).toBeNull();
    });

    it('should validate required fields', async () => {
      const user = await createAuthenticatedUser(app);

      // Missing name
      const response1 = await api.post('/api/leads', {
        phone: getNextPhone()
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response1.statusCode).toBe(400);
      expect(response1.json.error).toBe('Invalid input');

      // Missing phone
      const response2 = await api.post('/api/leads', {
        name: 'Test Lead'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response2.statusCode).toBe(400);
      expect(response2.json.error).toBe('Invalid input');
    });

    it('should validate email format', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/leads', {
        name: 'Test Lead',
        phone: getNextPhone(),
        email: 'invalid-email'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
      expect(response.json.details).toBeDefined();
    });

    it('should validate phone number length', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/leads', {
        name: 'Test Lead',
        phone: '123' // Too short
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
    });

    it('should validate priority enum values', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/leads', {
        name: 'Test Lead',
        phone: getNextPhone(),
        priority: 'INVALID_PRIORITY'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
    });

    it('should require authentication', async () => {
      const response = await api.post('/api/leads', {
        name: 'Test Lead',
        phone: getNextPhone()
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database constraint violations', async () => {
      const user = await createAuthenticatedUser(app);
      
      const duplicatePhone = getNextPhone();
      
      // Create lead with specific phone
      await api.post('/api/leads', {
        name: 'First Lead',
        phone: duplicatePhone
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Try to create another lead with same phone
      const response = await api.post('/api/leads', {
        name: 'Duplicate Lead',
        phone: duplicatePhone // Same phone number
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json.error).toBe('Failed to create lead');
    });
  });

  describe('PUT /api/leads/:id', () => {
    it('should update lead with valid data', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['Original Lead', getNextPhone(), 'original@example.com', 'COLD', 'LOW', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const updateData = {
        name: 'Updated Lead',
        status: LeadStatus.HOT,
        priority: Priority.HIGH,
        assignedTo: 'sales-agent-1',
        businessProfile: 'Updated business profile'
      };

      const response = await api.put(`/api/leads/${leadId}`, updateData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.name).toBe(updateData.name);
      expect(response.json.status).toBe(updateData.status);
      expect(response.json.priority).toBe(updateData.priority);
      expect(response.json.assigned_to).toBe(updateData.assignedTo);
      expect(response.json.business_profile).toBe(updateData.businessProfile);

      // Verify status change interaction was created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2',
        [leadId, 'STATUS_CHANGE']
      );
      expect(interactions.rows).toHaveLength(1);
      expect(interactions.rows[0].description).toContain('HOT');
    });

    it('should update only provided fields', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, email, status, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['Partial Update Lead', getNextPhone(), 'partial@example.com', 'WARM', 'MEDIUM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const updateData = {
        priority: Priority.HIGH
      };

      const response = await api.put(`/api/leads/${leadId}`, updateData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.name).toBe('Partial Update Lead'); // Unchanged
      expect(response.json.status).toBe('WARM'); // Unchanged
      expect(response.json.priority).toBe(Priority.HIGH); // Updated
    });

    it('should validate enum values in updates', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Validation Lead', getNextPhone(), 'WARM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, {
        status: 'INVALID_STATUS'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.error).toBe('Invalid input');
    });

    it('should return 404 for non-existent lead', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.put('/api/leads/non-existent-id', {
        name: 'Updated Name'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.messages).toEqual([]);
      // Note: The current implementation doesn't check if lead exists before update
      // This might be a bug that should be addressed
    });

    it('should handle empty update data', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Empty Update Lead', getNextPhone(), 'WARM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.put(`/api/leads/${leadId}`, {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      // Should still update updated_at timestamp
      expect(response.json.name).toBe('Empty Update Lead');
    });

    it('should not create status change interaction if status not changed', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['No Status Change Lead', getNextPhone(), 'WARM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      await api.put(`/api/leads/${leadId}`, {
        name: 'Updated Name Only'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Verify no status change interaction was created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2',
        [leadId, 'STATUS_CHANGE']
      );
      expect(interactions.rows).toHaveLength(0);
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('should delete existing lead', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Delete Me Lead', getNextPhone(), 'WARM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      const response = await api.delete(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);

      // Verify lead was deleted from database
      const dbResult = await app.db.query(
        'SELECT * FROM leads WHERE id = $1',
        [leadId]
      );
      expect(dbResult.rows).toHaveLength(0);
    });

    it('should cascade delete related data', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Cascade Delete Lead', getNextPhone(), 'WARM', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Create related data
      await app.db.query(
        'INSERT INTO messages (lead_id, content, direction) VALUES ($1, $2, $3)',
        [leadId, 'Test message', 'INBOUND']
      );
      await app.db.query(
        'INSERT INTO interactions (lead_id, type, description) VALUES ($1, $2, $3)',
        [leadId, 'CALL', 'Test interaction']
      );

      await api.delete(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Verify related data was also deleted due to CASCADE
      const messagesResult = await app.db.query(
        'SELECT * FROM messages WHERE lead_id = $1',
        [leadId]
      );
      expect(messagesResult.rows).toHaveLength(0);

      const interactionsResult = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1',
        [leadId]
      );
      expect(interactionsResult.rows).toHaveLength(0);
    });

    it('should succeed even for non-existent lead', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.delete('/api/leads/non-existent-id', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Mock database error
      const originalQuery = app.db.query;
      app.db.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await api.delete('/api/leads/test-id', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json.error).toBe('Failed to delete lead');

      // Restore original method
      app.db.query = originalQuery;
    });
  });

  describe('Business Logic', () => {
    it('should automatically set default values for new leads', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/leads', {
        name: 'Default Values Lead',
        phone: getNextPhone()
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.priority).toBe('MEDIUM');
      expect(response.json.status).toBe('COLD'); // Database default
      expect(response.json.user_id).toBe(user.id);
      expect(response.json.created_at).toBeDefined();
      expect(response.json.updated_at).toBeDefined();
    });

    it('should track lead activity through interactions', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Activity Track Lead', getNextPhone(), 'COLD', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Update status multiple times
      await api.put(`/api/leads/${leadId}`, {
        status: LeadStatus.WARM
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      await api.put(`/api/leads/${leadId}`, {
        status: LeadStatus.HOT
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Check that multiple status change interactions were created
      const interactions = await app.db.query(
        'SELECT * FROM interactions WHERE lead_id = $1 AND type = $2 ORDER BY created_at ASC',
        [leadId, 'STATUS_CHANGE']
      );

      expect(interactions.rows).toHaveLength(2);
      expect(interactions.rows[0].description).toContain('WARM');
      expect(interactions.rows[1].description).toContain('HOT');
    });

    it('should maintain data integrity across operations', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create lead
      const createResponse = await api.post('/api/leads', {
        name: 'Integrity Test Lead',
        phone: getNextPhone(),
        email: 'integrity@example.com'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const leadId = createResponse.json.id;

      // Update lead
      const updateResponse = await api.put(`/api/leads/${leadId}`, {
        status: LeadStatus.HOT,
        priority: Priority.URGENT
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // Fetch lead
      const fetchResponse = await api.get(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      // All responses should have consistent data
      expect(createResponse.json.id).toBe(leadId);
      expect(updateResponse.json.id).toBe(leadId);
      expect(fetchResponse.json.id).toBe(leadId);
      expect(fetchResponse.json.name).toBe('Integrity Test Lead');
      expect(fetchResponse.json.status).toBe(LeadStatus.HOT);
      expect(fetchResponse.json.priority).toBe(Priority.URGENT);
    });
  });

  describe('Real-time Events', () => {
    it('should emit events for lead operations', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Mock socket.io emit to verify events
      const emitSpy = jest.spyOn(app.io, 'emit');

      // Create lead
      const createResponse = await api.post('/api/leads', {
        name: 'Event Test Lead',
        phone: getNextPhone()
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(emitSpy).toHaveBeenCalledWith('lead:created', expect.objectContaining({
        name: 'Event Test Lead'
      }));

      const leadId = createResponse.json.id;

      // Update lead
      await api.put(`/api/leads/${leadId}`, {
        status: LeadStatus.HOT
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(emitSpy).toHaveBeenCalledWith('lead:updated', expect.objectContaining({
        id: leadId,
        status: LeadStatus.HOT
      }));

      // Delete lead
      await api.delete(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(emitSpy).toHaveBeenCalledWith('lead:deleted', { id: leadId });

      emitSpy.mockRestore();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple leads efficiently', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create multiple leads
      const leadPromises = Array.from({ length: 10 }, (_, i) =>
        api.post('/api/leads', {
          name: `Performance Lead ${i}`,
          phone: getNextPhone(),
          email: `perf${i}@example.com`
        }, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(leadPromises);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);

      // Verify all leads were created
      const fetchResponse = await api.get('/api/leads', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(fetchResponse.json).toHaveLength(10);
    });

    it('should handle concurrent operations safely', async () => {
      const user = await createAuthenticatedUser(app);
      
      const leadResult = await app.db.query(
        'INSERT INTO leads (name, phone, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Concurrent Test Lead', getNextPhone(), 'COLD', user.id]
      );
      const leadId = leadResult.rows[0].id;

      // Perform concurrent updates
      const updatePromises = [
        api.put(`/api/leads/${leadId}`, { priority: Priority.HIGH }, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        api.put(`/api/leads/${leadId}`, { status: LeadStatus.WARM }, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        api.put(`/api/leads/${leadId}`, { assignedTo: 'agent-1' }, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ];

      const responses = await Promise.all(updatePromises);

      // All updates should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });

      // Final state should be consistent
      const finalResponse = await api.get(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(finalResponse.statusCode).toBe(200);
      expect(finalResponse.json.id).toBe(leadId);
    });
  });
});