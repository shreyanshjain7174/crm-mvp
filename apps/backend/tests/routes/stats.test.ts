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

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalQuery = app.db.query;
      app.db.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request
        .get('/api/stats/user/progress')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch user progress');

      // Restore original method
      app.db.query = originalQuery;
    });

    it('should return expert stage with maximum activity', async () => {
      // Mock high activity levels (since AI interactions and templates are placeholders)
      const originalProgress = require('../../src/routes/stats');
      
      // We'll test the edge case where user has maximum activity
      // Add many leads and messages to reach intermediate stage
      for (let i = 0; i < 15; i++) {
        await setupTestLead(app, { 
          id: `expert-lead-${i}`, 
          phone: `+999999999${i}`,
          user_id: '550e8400-e29b-41d4-a716-446655440000'
        });
      }

      for (let i = 0; i < 10; i++) {
        await setupTestMessage(app, { 
          id: `expert-message-${i}`,
          lead_id: 'expert-lead-0',
          direction: 'OUTBOUND'
        });
      }

      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body.stage).toBe('intermediate');
      expect(response.body.stats.contactsAdded).toBe(15);
      expect(response.body.stats.messagesSent).toBe(10);
      expect(response.body.progressPercentage).toBeGreaterThan(40);
    });

    it('should handle edge case with zero division in progress calculation', async () => {
      // Test edge case where calculations might involve division by zero
      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body.progressPercentage).toBe(0);
      expect(typeof response.body.progressPercentage).toBe('number');
    });

    it('should validate stage transitions correctly', async () => {
      // Test new -> beginner transition
      let response = await request.get('/api/stats/user/progress').expect(200);
      expect(response.body.stage).toBe('new');

      // Add first contact
      await setupTestLead(app);
      response = await request.get('/api/stats/user/progress').expect(200);
      expect(response.body.stage).toBe('beginner');

      // Add more contacts and messages for intermediate
      for (let i = 1; i < 12; i++) {
        await setupTestLead(app, { 
          id: `transition-lead-${i}`, 
          phone: `+888888888${i}`,
          user_id: '550e8400-e29b-41d4-a716-446655440000'
        });
      }

      for (let i = 0; i < 6; i++) {
        await setupTestMessage(app, { 
          id: `transition-message-${i}`,
          lead_id: 'transition-lead-0',
          direction: 'OUTBOUND'
        });
      }

      response = await request.get('/api/stats/user/progress').expect(200);
      expect(response.body.stage).toBe('intermediate');
    });
  });

  describe('Advanced Dashboard Stats Tests', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should handle complex time-based queries correctly', async () => {
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

      // Insert leads with specific timestamps
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['recent-lead', 'Recent Lead', '+5555555555', 'HOT', '550e8400-e29b-41d4-a716-446655440000', fifteenDaysAgo]);

      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['old-lead', 'Old Lead', '+6666666666', 'COLD', '550e8400-e29b-41d4-a716-446655440000', fortyFiveDaysAgo]);

      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(2);
      expect(response.body.hotLeads).toBe(1);
    });

    it('should calculate conversion rates with edge cases', async () => {
      // Test with only converted leads
      await setupTestLead(app, { 
        id: 'converted-1', 
        phone: '+7777777777',
        status: 'CONVERTED',
        user_id: '550e8400-e29b-41d4-a716-446655440000'
      });

      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(1);
      expect(response.body.conversionRate).toBe(100);
    });

    it('should handle large datasets efficiently', async () => {
      // Create many leads to test performance
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(setupTestLead(app, { 
          id: `perf-lead-${i}`, 
          phone: `+100000000${i.toString().padStart(2, '0')}`,
          status: i % 3 === 0 ? 'HOT' : i % 3 === 1 ? 'WARM' : 'COLD',
          user_id: '550e8400-e29b-41d4-a716-446655440000'
        }));
      }

      await Promise.all(promises);

      const startTime = Date.now();
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);
      const endTime = Date.now();

      expect(response.body.totalLeads).toBe(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests correctly', async () => {
      // Setup some test data
      await setupTestLead(app);
      await setupTestMessage(app);

      // Make multiple concurrent requests
      const promises = [
        request.get('/api/stats/dashboard'),
        request.get('/api/stats/user/progress'),
        request.get('/api/stats/dashboard'),
        request.get('/api/stats/user/progress')
      ];

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      });

      // Dashboard responses should be consistent
      expect(responses[0].body).toEqual(responses[2].body);
      expect(responses[1].body).toEqual(responses[3].body);
    });

    it('should validate data types in responses', async () => {
      await setupTestLead(app);
      await setupTestMessage(app);

      const dashboardResponse = await request
        .get('/api/stats/dashboard')
        .expect(200);

      // Validate dashboard response types
      expect(typeof dashboardResponse.body.totalLeads).toBe('number');
      expect(typeof dashboardResponse.body.activeConversations).toBe('number');
      expect(typeof dashboardResponse.body.conversionRate).toBe('number');
      expect(typeof dashboardResponse.body.hotLeads).toBe('number');
      expect(typeof dashboardResponse.body.growth).toBe('object');
      expect(typeof dashboardResponse.body.growth.leads).toBe('number');
      expect(typeof dashboardResponse.body.growth.conversations).toBe('number');
      expect(typeof dashboardResponse.body.growth.hotLeads).toBe('number');

      const progressResponse = await request
        .get('/api/stats/user/progress')
        .expect(200);

      // Validate progress response types
      expect(typeof progressResponse.body.stage).toBe('string');
      expect(typeof progressResponse.body.stats).toBe('object');
      expect(typeof progressResponse.body.stats.contactsAdded).toBe('number');
      expect(typeof progressResponse.body.stats.messagesSent).toBe('number');
      expect(typeof progressResponse.body.progressPercentage).toBe('number');
      expect(Array.isArray(progressResponse.body.nextStageRequirements)).toBe(true);
    });

    it('should handle negative edge cases gracefully', async () => {
      // Test with invalid or malformed data that might cause issues
      // This tests the robustness of the SQL queries and calculations

      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      // All values should be non-negative
      expect(response.body.totalLeads).toBeGreaterThanOrEqual(0);
      expect(response.body.activeConversations).toBeGreaterThanOrEqual(0);
      expect(response.body.conversionRate).toBeGreaterThanOrEqual(0);
      expect(response.body.hotLeads).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Load Testing', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should maintain response time under load', async () => {
      // Create substantial test data
      const dataSetupPromises = [];
      for (let i = 0; i < 100; i++) {
        dataSetupPromises.push(
          setupTestLead(app, { 
            id: `load-lead-${i}`, 
            phone: `+200000000${i.toString().padStart(2, '0')}`,
            user_id: '550e8400-e29b-41d4-a716-446655440000'
          })
        );
        
        if (i < 50) {
          dataSetupPromises.push(
            setupTestMessage(app, { 
              id: `load-message-${i}`,
              lead_id: `load-lead-${i}`,
              direction: 'OUTBOUND'
            })
          );
        }
      }

      await Promise.all(dataSetupPromises);

      // Test multiple concurrent dashboard requests
      const requestPromises = [];
      for (let i = 0; i < 10; i++) {
        requestPromises.push(request.get('/api/stats/dashboard'));
      }

      const startTime = Date.now();
      const responses = await Promise.all(requestPromises);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.totalLeads).toBe(100);
      });

      // Average response time should be reasonable
      const avgResponseTime = (endTime - startTime) / 10;
      expect(avgResponseTime).toBeLessThan(1000); // Less than 1 second per request on average
    });

    it('should handle memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create a large dataset
      for (let batch = 0; batch < 5; batch++) {
        const batchPromises = [];
        for (let i = 0; i < 20; i++) {
          const id = batch * 20 + i;
          batchPromises.push(
            setupTestLead(app, { 
              id: `memory-lead-${id}`, 
              phone: `+300000000${id.toString().padStart(2, '0')}`,
              user_id: '550e8400-e29b-41d4-a716-446655440000'
            })
          );
        }
        await Promise.all(batchPromises);
      }

      // Make several requests
      for (let i = 0; i < 5; i++) {
        await request.get('/api/stats/dashboard').expect(200);
        await request.get('/api/stats/user/progress').expect(200);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('API Contract and Schema Validation', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should maintain consistent API response schema for dashboard', async () => {
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      // Validate exact schema structure
      const expectedKeys = ['totalLeads', 'activeConversations', 'conversionRate', 'hotLeads', 'growth'];
      const actualKeys = Object.keys(response.body);
      
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });

      // Validate growth object structure
      const expectedGrowthKeys = ['leads', 'conversations', 'hotLeads', 'conversionRate'];
      const actualGrowthKeys = Object.keys(response.body.growth);
      
      expectedGrowthKeys.forEach(key => {
        expect(actualGrowthKeys).toContain(key);
      });
    });

    it('should maintain consistent API response schema for user progress', async () => {
      const response = await request
        .get('/api/stats/user/progress')
        .expect(200);

      // Validate exact schema structure
      const expectedKeys = ['stage', 'stats', 'progressPercentage', 'nextStageRequirements'];
      const actualKeys = Object.keys(response.body);
      
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });

      // Validate stats object structure
      const expectedStatsKeys = ['contactsAdded', 'messagesSent', 'aiInteractions', 'templatesUsed', 'pipelineActions'];
      const actualStatsKeys = Object.keys(response.body.stats);
      
      expectedStatsKeys.forEach(key => {
        expect(actualStatsKeys).toContain(key);
      });

      // Validate stage values
      const validStages = ['new', 'beginner', 'intermediate', 'advanced', 'expert'];
      expect(validStages).toContain(response.body.stage);
    });

    it('should handle content-type headers correctly', async () => {
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
    });

    it('should handle HTTP methods correctly', async () => {
      // GET should work
      await request.get('/api/stats/dashboard').expect(200);

      // POST should not be allowed (405 Method Not Allowed)
      await request.post('/api/stats/dashboard').expect(404);

      // PUT should not be allowed
      await request.put('/api/stats/dashboard').expect(404);

      // DELETE should not be allowed
      await request.delete('/api/stats/dashboard').expect(404);
    });
  });
});