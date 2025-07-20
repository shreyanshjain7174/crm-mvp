import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { buildTestApp, setupTestUser, setupTestLead, setupTestMessage } from '../utils/testApp';

describe('Stats API', () => {
  let app: FastifyInstance;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/stats/dashboard', () => {
    beforeEach(async () => {
      // Set up test user
      await setupTestUser(app);
    });

    it('should return empty dashboard stats for new user', async () => {
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body).toEqual({
        totalLeads: 0,
        activeConversations: 0,
        conversionRate: 0,
        hotLeads: 0,
        growth: {
          leads: 0,
          conversations: 0,
          hotLeads: 0,
          conversionRate: 0
        }
      });
    });

    it('should return correct stats with leads and messages', async () => {
      // Create test leads
      await setupTestLead(app, { 
        id: '1', 
        status: 'COLD',
        user_id: '550e8400-e29b-41d4-a716-446655440000'
      });
      await setupTestLead(app, { 
        id: '2', 
        phone: '+1234567891',
        status: 'HOT',
        user_id: '550e8400-e29b-41d4-a716-446655440000'
      });
      await setupTestLead(app, { 
        id: '3', 
        phone: '+1234567892',
        status: 'CONVERTED',
        user_id: '550e8400-e29b-41d4-a716-446655440000'
      });

      // Create test messages for active conversations
      await setupTestMessage(app, { 
        lead_id: '1',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      });

      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(3);
      expect(response.body.activeConversations).toBe(1);
      expect(response.body.hotLeads).toBe(1);
      expect(response.body.conversionRate).toBeCloseTo(66.7, 1); // 2 out of 3 leads are WARM/HOT/CONVERTED
    });

    it('should calculate growth percentages correctly', async () => {
      // Create leads from different time periods
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);

      // Lead from last month
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['old-lead', 'Old Lead', '+1111111111', 'COLD', '550e8400-e29b-41d4-a716-446655440000', oneMonthAgo]);

      // Leads from this month
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['new-lead-1', 'New Lead 1', '+2222222222', 'COLD', '550e8400-e29b-41d4-a716-446655440000', oneWeekAgo]);
      
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['new-lead-2', 'New Lead 2', '+3333333333', 'COLD', '550e8400-e29b-41d4-a716-446655440000', new Date()]);

      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(3);
      expect(response.body.growth.leads).toBe(100); // 2 new leads vs 1 old lead = 100% growth
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalQuery = app.db.query;
      app.db.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request
        .get('/api/stats/dashboard')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch dashboard statistics');

      // Restore original method
      app.db.query = originalQuery;
    });
  });

  describe('GET /api/stats/user/progress', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should return new user stage with no activity', async () => {
      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body).toEqual({
        stage: 'new',
        stats: {
          contactsAdded: 0,
          messagesSent: 0,
          aiInteractions: 0,
          templatesUsed: 0,
          pipelineActions: 0
        },
        progressPercentage: 0,
        nextStageRequirements: ['Add your first contact to unlock messaging']
      });
    });

    it('should return beginner stage after adding contacts', async () => {
      // Add a lead
      await setupTestLead(app);

      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body.stage).toBe('beginner');
      expect(response.body.stats.contactsAdded).toBe(1);
      expect(response.body.progressPercentage).toBeGreaterThan(0);
    });

    it('should return intermediate stage with sufficient activity', async () => {
      // Add multiple leads
      for (let i = 0; i < 12; i++) {
        await setupTestLead(app, { 
          id: `lead-${i}`, 
          phone: `+123456789${i}`,
          user_id: '550e8400-e29b-41d4-a716-446655440000'
        });
      }

      // Add multiple messages
      for (let i = 0; i < 7; i++) {
        await setupTestMessage(app, { 
          id: `message-${i}`,
          lead_id: 'lead-0',
          direction: 'OUTBOUND'
        });
      }

      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body.stage).toBe('intermediate');
      expect(response.body.stats.contactsAdded).toBe(12);
      expect(response.body.stats.messagesSent).toBe(7);
    });

    it('should calculate progress percentage correctly', async () => {
      // Add some activity to be in beginner stage
      await setupTestLead(app);
      await setupTestMessage(app, { direction: 'OUTBOUND' });

      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body.stage).toBe('beginner');
      expect(response.body.progressPercentage).toBeGreaterThan(20);
      expect(response.body.progressPercentage).toBeLessThan(40);
    });

    it('should provide appropriate next stage requirements', async () => {
      // Create beginner user (1 contact, some messages)
      await setupTestLead(app);
      await setupTestMessage(app, { direction: 'OUTBOUND' });

      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body.nextStageRequirements).toContain('Add 9 more contacts');
      expect(response.body.nextStageRequirements).toContain('Send 4 more messages');
    });
  });
});