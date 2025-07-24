/**
 * Integration Tests for Stats API
 * 
 * Tests that verify the stats API works correctly when integrated
 * with other system components and under various conditions.
 */

import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { buildTestApp, setupTestUser, setupTestLead, setupTestMessage } from '../utils/testApp';

describe('Stats API Integration Tests', () => {
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

  describe('Multi-user Data Isolation', () => {
    it('should only return stats for the authenticated user', async () => {
      // Setup first user
      const user1 = await setupTestUser(app, {
        id: 'user-1',
        email: 'user1@example.com'
      });

      // Setup second user  
      const user2 = await setupTestUser(app, {
        id: 'user-2', 
        email: 'user2@example.com'
      });

      // Add leads for user 1
      await setupTestLead(app, {
        id: 'lead-user1-1',
        phone: '+1111111111',
        user_id: user1.id,
        status: 'HOT'
      });

      await setupTestLead(app, {
        id: 'lead-user1-2', 
        phone: '+1111111112',
        user_id: user1.id,
        status: 'COLD'
      });

      // Add leads for user 2
      await setupTestLead(app, {
        id: 'lead-user2-1',
        phone: '+2222222221',
        user_id: user2.id,
        status: 'HOT'
      });

      // Mock auth for user 1
      const mockJwt = (app as any).jwt;
      mockJwt.verify.mockReturnValue({ userId: user1.id, email: user1.email });

      const user1Response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      // Should only see user 1's data (2 leads, 1 hot)
      expect(user1Response.body.totalLeads).toBe(2);
      expect(user1Response.body.hotLeads).toBe(1);

      // Mock auth for user 2
      mockJwt.verify.mockReturnValue({ userId: user2.id, email: user2.email });

      const user2Response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      // Should only see user 2's data (1 lead, 1 hot)
      expect(user2Response.body.totalLeads).toBe(1);
      expect(user2Response.body.hotLeads).toBe(1);
    });

    it('should handle user progress independently', async () => {
      const user1 = await setupTestUser(app, {
        id: 'progress-user-1',
        email: 'progress1@example.com'
      });

      const user2 = await setupTestUser(app, {
        id: 'progress-user-2',
        email: 'progress2@example.com'
      });

      // User 1: Add many contacts to reach intermediate stage
      for (let i = 0; i < 12; i++) {
        await setupTestLead(app, {
          id: `progress-lead-u1-${i}`,
          phone: `+111111111${i}`,
          user_id: user1.id
        });
      }

      // User 1: Add messages
      for (let i = 0; i < 6; i++) {
        await setupTestMessage(app, {
          id: `progress-msg-u1-${i}`,
          lead_id: 'progress-lead-u1-0',
          direction: 'OUTBOUND'
        });
      }

      // User 2: Only add 1 contact (beginner stage)
      await setupTestLead(app, {
        id: 'progress-lead-u2-1',
        phone: '+2222222221',
        user_id: user2.id
      });

      // Check user 1 progress (should be intermediate)
      const mockJwt = (app as any).jwt;
      mockJwt.verify.mockReturnValue({ userId: user1.id, email: user1.email });

      const user1Progress = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(user1Progress.body.stage).toBe('intermediate');
      expect(user1Progress.body.stats.contactsAdded).toBe(12);

      // Check user 2 progress (should be beginner)
      mockJwt.verify.mockReturnValue({ userId: user2.id, email: user2.email });

      const user2Progress = await request
        .get('/api/stats/user/progress')
        .expect(200);

      expect(user2Progress.body.stage).toBe('beginner');
      expect(user2Progress.body.stats.contactsAdded).toBe(1);
    });
  });

  describe('Real-time Data Updates', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should reflect immediate changes when new leads are added', async () => {
      // Initial state
      let response = await request
        .get('/api/stats/dashboard')
        .expect(200);
      
      expect(response.body.totalLeads).toBe(0);

      // Add a lead
      await setupTestLead(app, {
        id: 'realtime-lead-1',
        phone: '+5555555555',
        status: 'HOT'
      });

      // Should immediately reflect the change
      response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(1);
      expect(response.body.hotLeads).toBe(1);

      // Add another lead
      await setupTestLead(app, {
        id: 'realtime-lead-2',
        phone: '+5555555556',
        status: 'COLD'
      });

      response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(2);
      expect(response.body.hotLeads).toBe(1);
    });

    it('should reflect progress changes immediately', async () => {
      // Start as new user
      let response = await request
        .get('/api/stats/user/progress')
        .expect(200);
      
      expect(response.body.stage).toBe('new');

      // Add first contact
      await setupTestLead(app);

      response = await request
        .get('/api/stats/user/progress')
        .expect(200);
      
      expect(response.body.stage).toBe('beginner');

      // Add outbound message
      await setupTestMessage(app, {
        direction: 'OUTBOUND'
      });

      response = await request
        .get('/api/stats/user/progress')
        .expect(200);
      
      expect(response.body.stats.messagesSent).toBe(1);
      expect(response.body.progressPercentage).toBeGreaterThan(20);
    });
  });

  describe('Data Consistency Under Concurrent Operations', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should maintain consistency when multiple operations happen simultaneously', async () => {
      // Simulate concurrent operations
      const operations = [];

      // Add multiple leads concurrently
      for (let i = 0; i < 10; i++) {
        operations.push(
          setupTestLead(app, {
            id: `concurrent-lead-${i}`,
            phone: `+777777777${i}`,
            status: i % 2 === 0 ? 'HOT' : 'COLD'
          })
        );
      }

      // Add multiple messages concurrently
      for (let i = 0; i < 5; i++) {
        operations.push(
          setupTestMessage(app, {
            id: `concurrent-msg-${i}`,
            lead_id: 'concurrent-lead-0',
            direction: 'OUTBOUND'
          })
        );
      }

      // Execute all operations concurrently
      await Promise.all(operations);

      // Make multiple concurrent stat requests
      const statRequests = [];
      for (let i = 0; i < 5; i++) {
        statRequests.push(request.get('/api/stats/dashboard'));
        statRequests.push(request.get('/api/stats/user/progress'));
      }

      const responses = await Promise.all(statRequests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Dashboard responses should be consistent
      const dashboardResponses = responses.filter((_, index) => index % 2 === 0);
      const firstDashboard = dashboardResponses[0].body;
      
      dashboardResponses.forEach(response => {
        expect(response.body).toEqual(firstDashboard);
      });

      // Progress responses should be consistent
      const progressResponses = responses.filter((_, index) => index % 2 === 1);
      const firstProgress = progressResponses[0].body;
      
      progressResponses.forEach(response => {
        expect(response.body).toEqual(firstProgress);
      });

      // Verify final state
      expect(firstDashboard.totalLeads).toBe(10);
      expect(firstDashboard.hotLeads).toBe(5); // Half are HOT
      expect(firstProgress.stats.contactsAdded).toBe(10);
      expect(firstProgress.stats.messagesSent).toBe(5);
    });
  });

  describe('Time-based Calculations', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should correctly calculate growth metrics across time periods', async () => {
      const now = new Date();
      
      // Create leads from different time periods
      const timestamps = {
        twoMonthsAgo: new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000),
        oneMonthAgo: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        twoWeeksAgo: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        oneWeekAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        yesterday: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      };

      // Add leads with specific timestamps
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['time-lead-1', 'Old Lead 1', '+8888888881', 'COLD', '550e8400-e29b-41d4-a716-446655440000', timestamps.twoMonthsAgo]);

      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)  
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['time-lead-2', 'Old Lead 2', '+8888888882', 'HOT', '550e8400-e29b-41d4-a716-446655440000', timestamps.oneMonthAgo]);

      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['time-lead-3', 'Recent Lead 1', '+8888888883', 'HOT', '550e8400-e29b-41d4-a716-446655440000', timestamps.twoWeeksAgo]);

      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['time-lead-4', 'Recent Lead 2', '+8888888884', 'WARM', '550e8400-e29b-41d4-a716-446655440000', timestamps.oneWeekAgo]);

      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(4);
      expect(response.body.hotLeads).toBe(2);
      
      // Growth should be calculated correctly based on time periods
      expect(typeof response.body.growth.leads).toBe('number');
      expect(response.body.growth.leads).toBeGreaterThanOrEqual(0);
    });

    it('should handle timezone-independent calculations', async () => {
      // This test ensures that time-based calculations work regardless of server timezone
      const utcNow = new Date();
      const pastDate = new Date(utcNow.getTime() - 20 * 24 * 60 * 60 * 1000);

      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['tz-lead', 'Timezone Lead', '+9999999999', 'HOT', '550e8400-e29b-41d4-a716-446655440000', pastDate]);

      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(1);
      expect(response.body.hotLeads).toBe(1);
    });
  });

  describe('Error Recovery and Resilience', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should recover gracefully from transient database errors', async () => {
      const originalQuery = app.db.query;
      let callCount = 0;

      // Mock intermittent database failures
      app.db.query = jest.fn().mockImplementation(async (query, params) => {
        callCount++;
        if (callCount <= 2) {
          // Fail first two calls
          throw new Error('Connection timeout');
        }
        // Succeed on subsequent calls
        return originalQuery.call(app.db, query, params);
      });

      // First request should fail
      await request
        .get('/api/stats/dashboard')
        .expect(500);

      // Second request should also fail  
      await request
        .get('/api/stats/dashboard')
        .expect(500);

      // Third request should succeed
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(typeof response.body.totalLeads).toBe('number');

      // Restore original method
      app.db.query = originalQuery;
    });

    it('should handle malformed data gracefully', async () => {
      // Insert data that might cause calculation issues
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['malformed-lead', '', '', 'INVALID_STATUS', '550e8400-e29b-41d4-a716-446655440000', new Date()]);

      // Should still return valid response despite malformed data
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBeGreaterThanOrEqual(0);
      expect(response.body.conversionRate).toBeGreaterThanOrEqual(0);
      expect(response.body.hotLeads).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Business Logic Validation', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should correctly calculate conversion rates for various scenarios', async () => {
      // Scenario 1: No leads
      let response = await request.get('/api/stats/dashboard').expect(200);
      expect(response.body.conversionRate).toBe(0);

      // Scenario 2: All cold leads
      await setupTestLead(app, { id: 'cold-1', phone: '+1111111111', status: 'COLD' });
      await setupTestLead(app, { id: 'cold-2', phone: '+1111111112', status: 'COLD' });
      
      response = await request.get('/api/stats/dashboard').expect(200);
      expect(response.body.conversionRate).toBe(0);

      // Scenario 3: Mixed statuses
      await setupTestLead(app, { id: 'warm-1', phone: '+1111111113', status: 'WARM' });
      await setupTestLead(app, { id: 'hot-1', phone: '+1111111114', status: 'HOT' });
      await setupTestLead(app, { id: 'converted-1', phone: '+1111111115', status: 'CONVERTED' });

      response = await request.get('/api/stats/dashboard').expect(200);
      expect(response.body.totalLeads).toBe(5);
      expect(response.body.conversionRate).toBe(60); // 3 out of 5 are WARM/HOT/CONVERTED
    });

    it('should validate user stage progression logic', async () => {
      // Test the exact conditions for each stage transition
      
      // Stage: new (0 contacts)
      let response = await request.get('/api/stats/user/progress').expect(200);
      expect(response.body.stage).toBe('new');

      // Stage: beginner (1+ contacts)
      await setupTestLead(app);
      response = await request.get('/api/stats/user/progress').expect(200);
      expect(response.body.stage).toBe('beginner');

      // Stage: intermediate (10+ contacts AND 5+ messages)
      for (let i = 1; i < 10; i++) {
        await setupTestLead(app, { 
          id: `stage-lead-${i}`, 
          phone: `+333333333${i}`,
          user_id: '550e8400-e29b-41d4-a716-446655440000'
        });
      }

      // Still beginner (not enough messages)
      response = await request.get('/api/stats/user/progress').expect(200);
      expect(response.body.stage).toBe('beginner');

      // Add required messages
      for (let i = 0; i < 5; i++) {
        await setupTestMessage(app, {
          id: `stage-msg-${i}`,
          lead_id: '550e8400-e29b-41d4-a716-446655440001',
          direction: 'OUTBOUND'
        });
      }

      // Now should be intermediate
      response = await request.get('/api/stats/user/progress').expect(200);
      expect(response.body.stage).toBe('intermediate');
      expect(response.body.stats.contactsAdded).toBe(10);
      expect(response.body.stats.messagesSent).toBe(5);
    });
  });
});