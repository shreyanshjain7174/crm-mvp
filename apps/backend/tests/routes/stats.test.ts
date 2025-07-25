import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { buildTestApp, setupTestUser } from '../utils/testApp';

describe('Stats API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
    await setupTestUser(app);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Dashboard Stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app.server)
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body).toMatchObject({
        totalLeads: expect.any(Number),
        activeConversations: expect.any(Number),
        conversionRate: expect.any(Number),
        hotLeads: expect.any(Number),
        growth: {
          leads: expect.any(Number),
          conversations: expect.any(Number),
          hotLeads: expect.any(Number),
          conversionRate: expect.any(Number)
        }
      });
    });

    it('should handle empty dashboard', async () => {
      const response = await request(app.server)
        .get('/api/stats/dashboard')
        .expect(200);

      expect(response.body.totalLeads).toBe(0);
      expect(response.body.activeConversations).toBe(0);
    });
  });

  describe('User Progress', () => {
    it('should return user progress statistics', async () => {
      const response = await request(app.server)
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body).toMatchObject({
        stage: expect.stringMatching(/^(new|beginner|intermediate|advanced|expert)$/),
        stats: {
          contactsAdded: expect.any(Number),
          messagesSent: expect.any(Number),
          aiInteractions: expect.any(Number),
          templatesUsed: expect.any(Number),
          pipelineActions: expect.any(Number)
        },
        progressPercentage: expect.any(Number),
        nextStageRequirements: expect.any(Array)
      });
    });

    it('should calculate progress percentage correctly', async () => {
      const response = await request(app.server)
        .get('/api/stats/user/progress')
        .expect(200);

      expect(response.body.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(response.body.progressPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const originalQuery = app.db.query;
      app.db.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app.server)
        .get('/api/stats/dashboard')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch dashboard statistics');
      
      app.db.query = originalQuery;
    });
  });
});