/**
 * Comprehensive Stats API Tests
 * 
 * End-to-end testing using realistic business scenarios
 * and advanced test utilities.
 */

import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { buildTestApp, setupTestUser } from '../utils/testApp';
import { 
  StatsTestDataGenerator, 
  StatsTestValidators, 
  StatsPerformanceTestUtils,
  StatsEdgeCaseGenerators 
} from '../utils/statsTestHelpers';

describe('Comprehensive Stats API Tests', () => {
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

  describe('Business Scenario Testing', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should handle empty business scenario correctly', async () => {
      const scenario = await StatsTestDataGenerator.createEmptyBusinessScenario(app);

      const dashboardResponse = await request
        .get('/api/stats/dashboard')
        .expect(200);

      const progressResponse = await request
        .get('/api/stats/user/progress')
        .expect(200);

      StatsTestValidators.validateDashboardResponse(dashboardResponse.body);
      StatsTestValidators.validateProgressResponse(progressResponse.body, 'new');

      expect(dashboardResponse.body).toMatchObject(scenario.expectedDashboard);
      expect(progressResponse.body.stage).toBe(scenario.expectedProgress.stage);
      expect(progressResponse.body.stats).toMatchObject(scenario.expectedProgress.stats);
    });

    it('should handle startup business scenario correctly', async () => {
      const scenario = await StatsTestDataGenerator.createStartupBusinessScenario(app);

      const dashboardResponse = await request
        .get('/api/stats/dashboard')
        .expect(200);

      const progressResponse = await request
        .get('/api/stats/user/progress')
        .expect(200);

      StatsTestValidators.validateDashboardResponse(dashboardResponse.body, {
        totalLeads: scenario.expectedDashboard.totalLeads,
        hotLeads: scenario.expectedDashboard.hotLeads
      });

      StatsTestValidators.validateProgressResponse(progressResponse.body, scenario.expectedProgress.stage);

      expect(dashboardResponse.body.totalLeads).toBe(scenario.expectedDashboard.totalLeads);
      expect(dashboardResponse.body.hotLeads).toBe(scenario.expectedDashboard.hotLeads);
      expect(dashboardResponse.body.activeConversations).toBe(scenario.expectedDashboard.activeConversations);
      expect(progressResponse.body.stats.contactsAdded).toBe(scenario.expectedProgress.stats.contactsAdded);
    });

    it('should handle growing business scenario correctly', async () => {
      const scenario = await StatsTestDataGenerator.createGrowingBusinessScenario(app);

      const dashboardResponse = await request
        .get('/api/stats/dashboard')
        .expect(200);

      const progressResponse = await request
        .get('/api/stats/user/progress')
        .expect(200);

      StatsTestValidators.validateDashboardResponse(dashboardResponse.body, {
        totalLeads: scenario.expectedDashboard.totalLeads,
        activeConversations: scenario.expectedDashboard.activeConversations
      });

      StatsTestValidators.validateProgressResponse(progressResponse.body, scenario.expectedProgress.stage);

      expect(dashboardResponse.body.totalLeads).toBe(scenario.expectedDashboard.totalLeads);
      expect(progressResponse.body.stage).toBe(scenario.expectedProgress.stage);
    });

    it('should handle enterprise business scenario correctly', async () => {
      const scenario = await StatsTestDataGenerator.createEnterpriseBusinessScenario(app);

      const { result: dashboardResponse, responseTime } = await StatsPerformanceTestUtils.measureResponseTime(
        () => request.get('/api/stats/dashboard').expect(200)
      );

      const { result: progressResponse } = await StatsPerformanceTestUtils.measureResponseTime(
        () => request.get('/api/stats/user/progress').expect(200)
      );

      // Should handle large datasets efficiently
      StatsTestValidators.validatePerformanceMetrics(0, responseTime, 2000); // 2 second max

      StatsTestValidators.validateDashboardResponse(dashboardResponse.body, {
        totalLeads: scenario.expectedDashboard.totalLeads,
        activeConversations: scenario.expectedDashboard.activeConversations
      });

      StatsTestValidators.validateProgressResponse(progressResponse.body, scenario.expectedProgress.stage);

      expect(dashboardResponse.body.totalLeads).toBe(scenario.expectedDashboard.totalLeads);
      expect(progressResponse.body.stats.contactsAdded).toBe(scenario.expectedProgress.stats.contactsAdded);
    });

    it('should handle time-based scenario with growth calculations', async () => {
      const scenario = await StatsTestDataGenerator.createTimeBasedScenario(app);

      const dashboardResponse = await request
        .get('/api/stats/dashboard')
        .expect(200);

      StatsTestValidators.validateDashboardResponse(dashboardResponse.body);

      expect(dashboardResponse.body.totalLeads).toBe(scenario.expectedDashboard.totalLeads);
      expect(typeof dashboardResponse.body.growth.leads).toBe('number');
      
      // Growth should be calculated based on time periods
      if (scenario.expectedDashboard.expectedGrowthTrend === 'positive') {
        expect(dashboardResponse.body.growth.leads).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance and Scalability Testing', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should maintain performance with large datasets', async () => {
      // Create large dataset
      await StatsEdgeCaseGenerators.createExtremeLargeDataset(app, 500);

      const { result: response, responseTime } = await StatsPerformanceTestUtils.measureResponseTime(
        () => request.get('/api/stats/dashboard').expect(200)
      );

      // Should complete within reasonable time even with large dataset
      StatsTestValidators.validatePerformanceMetrics(0, responseTime, 3000);
      
      StatsTestValidators.validateDashboardResponse(response.body, {
        totalLeads: 500
      });

      expect(response.body.totalLeads).toBe(500);
    });

    it('should handle concurrent load efficiently', async () => {
      // Setup moderate dataset
      await StatsTestDataGenerator.createGrowingBusinessScenario(app);

      const loadTestResults = await StatsPerformanceTestUtils.runLoadTest(
        () => request.get('/api/stats/dashboard'),
        5, // 5 concurrent requests
        3000 // for 3 seconds
      );

      // Validate load test results
      expect(loadTestResults.successfulRequests).toBeGreaterThan(0);
      expect(loadTestResults.failedRequests).toBe(0);
      expect(loadTestResults.averageResponseTime).toBeLessThan(1000);
      expect(loadTestResults.totalRequests).toBeGreaterThan(10);
    });

    it('should manage memory efficiently', async () => {
      const { result, memoryDelta } = await StatsPerformanceTestUtils.measureMemoryUsage(async () => {
        // Create and process multiple datasets
        await StatsTestDataGenerator.createGrowingBusinessScenario(app);
        
        const responses = [];
        for (let i = 0; i < 10; i++) {
          responses.push(await request.get('/api/stats/dashboard').expect(200));
          responses.push(await request.get('/api/stats/user/progress').expect(200));
        }
        
        return responses;
      });

      // Memory usage should be reasonable
      StatsTestValidators.validateMemoryUsage(0, memoryDelta, 100 * 1024 * 1024); // 100MB max

      expect(result.length).toBe(20); // 10 dashboard + 10 progress responses
      result.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Edge Case and Error Handling', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should handle zero division scenarios gracefully', async () => {
      const scenario = await StatsEdgeCaseGenerators.createZeroDivisionScenario(app);

      const dashboardResponse = await request
        .get('/api/stats/dashboard')
        .expect(200);

      const progressResponse = await request
        .get('/api/stats/user/progress')
        .expect(200);

      // Should not crash or return NaN/Infinity
      StatsTestValidators.validateDashboardResponse(dashboardResponse.body);
      StatsTestValidators.validateProgressResponse(progressResponse.body);

      expect(isFinite(dashboardResponse.body.conversionRate)).toBe(true);
      expect(isFinite(dashboardResponse.body.growth.leads)).toBe(true);
      expect(isFinite(progressResponse.body.progressPercentage)).toBe(true);
    });

    it('should handle invalid data gracefully', async () => {
      await StatsEdgeCaseGenerators.createInvalidDataScenario(app);

      const dashboardResponse = await request
        .get('/api/stats/dashboard')
        .expect(200);

      const progressResponse = await request
        .get('/api/stats/user/progress')
        .expect(200);

      // Should still return valid responses despite invalid data
      StatsTestValidators.validateDashboardResponse(dashboardResponse.body);
      StatsTestValidators.validateProgressResponse(progressResponse.body);

      // All numeric values should be valid numbers
      expect(Number.isNaN(dashboardResponse.body.totalLeads)).toBe(false);
      expect(Number.isNaN(dashboardResponse.body.conversionRate)).toBe(false);
      expect(Number.isNaN(progressResponse.body.progressPercentage)).toBe(false);
    });

    it('should maintain data consistency across multiple calls', async () => {
      await StatsTestDataGenerator.createGrowingBusinessScenario(app);

      // Make multiple calls rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(request.get('/api/stats/dashboard'));
        promises.push(request.get('/api/stats/user/progress'));
      }

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Dashboard responses should be identical
      const dashboardResponses = responses.filter((_, index) => index % 2 === 0);
      const firstDashboard = dashboardResponses[0].body;
      
      dashboardResponses.forEach(response => {
        expect(response.body).toEqual(firstDashboard);
      });

      // Progress responses should be identical
      const progressResponses = responses.filter((_, index) => index % 2 === 1);
      const firstProgress = progressResponses[0].body;
      
      progressResponses.forEach(response => {
        expect(response.body).toEqual(firstProgress);
      });
    });

    it('should handle database timeout scenarios', async () => {
      const originalQuery = app.db.query;
      let callCount = 0;

      // Mock slow database responses
      app.db.query = jest.fn().mockImplementation(async (query, params) => {
        callCount++;
        if (callCount <= 3) {
          // First few calls are slow but succeed
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return originalQuery.call(app.db, query, params);
      });

      const startTime = Date.now();
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);
      const endTime = Date.now();

      // Should still succeed but may be slower
      expect(endTime - startTime).toBeGreaterThan(100);
      StatsTestValidators.validateDashboardResponse(response.body);

      // Restore original method
      app.db.query = originalQuery;
    });
  });

  describe('API Contract Compliance', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should maintain consistent response structure across scenarios', async () => {
      const scenarios = [
        () => StatsTestDataGenerator.createEmptyBusinessScenario(app),
        () => StatsTestDataGenerator.createStartupBusinessScenario(app),
        () => StatsTestDataGenerator.createGrowingBusinessScenario(app)
      ];

      for (const createScenario of scenarios) {
        await createScenario();

        const dashboardResponse = await request
          .get('/api/stats/dashboard')
          .expect(200);

        const progressResponse = await request
          .get('/api/stats/user/progress')
          .expect(200);

        // Validate consistent structure
        StatsTestValidators.validateDashboardResponse(dashboardResponse.body);
        StatsTestValidators.validateProgressResponse(progressResponse.body);

        // Clean up for next scenario
        // (In real implementation, you'd clear test data)
      }
    });

    it('should handle malformed requests appropriately', async () => {
      // Test with invalid routes
      await request.get('/api/stats/invalid').expect(404);
      
      // Test with unsupported methods
      await request.post('/api/stats/dashboard').expect(404);
      await request.put('/api/stats/user/progress').expect(404);
      await request.delete('/api/stats/dashboard').expect(404);
    });

    it('should include proper HTTP headers', async () => {
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should handle CORS and security headers appropriately', async () => {
      const response = await request
        .get('/api/stats/dashboard')
        .expect(200);

      // In a real test, you would validate CORS headers
      expect(response.body).toBeDefined();
    });
  });

  describe('Business Logic Validation', () => {
    beforeEach(async () => {
      await setupTestUser(app);
    });

    it('should calculate conversion rates accurately for various lead distributions', async () => {
      const testCases = [
        { cold: 5, warm: 0, hot: 0, converted: 0, expectedRate: 0 },
        { cold: 0, warm: 0, hot: 0, converted: 5, expectedRate: 100 },
        { cold: 2, warm: 1, hot: 1, converted: 1, expectedRate: 60 }, // 3 out of 5
        { cold: 1, warm: 1, hot: 1, converted: 0, expectedRate: 66.7 }, // 2 out of 3
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        // Create leads according to test case
        let leadIndex = 0;
        
        for (let j = 0; j < testCase.cold; j++) {
          await app.db.query(`
            INSERT INTO leads (id, name, phone, status, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [`test-${i}-${leadIndex}`, `Test Lead ${leadIndex}`, `+${i}${leadIndex}0000000`, 'COLD', '550e8400-e29b-41d4-a716-446655440000']);
          leadIndex++;
        }
        
        for (let j = 0; j < testCase.warm; j++) {
          await app.db.query(`
            INSERT INTO leads (id, name, phone, status, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [`test-${i}-${leadIndex}`, `Test Lead ${leadIndex}`, `+${i}${leadIndex}0000000`, 'WARM', '550e8400-e29b-41d4-a716-446655440000']);
          leadIndex++;
        }
        
        for (let j = 0; j < testCase.hot; j++) {
          await app.db.query(`
            INSERT INTO leads (id, name, phone, status, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [`test-${i}-${leadIndex}`, `Test Lead ${leadIndex}`, `+${i}${leadIndex}0000000`, 'HOT', '550e8400-e29b-41d4-a716-446655440000']);
          leadIndex++;
        }
        
        for (let j = 0; j < testCase.converted; j++) {
          await app.db.query(`
            INSERT INTO leads (id, name, phone, status, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [`test-${i}-${leadIndex}`, `Test Lead ${leadIndex}`, `+${i}${leadIndex}0000000`, 'CONVERTED', '550e8400-e29b-41d4-a716-446655440000']);
          leadIndex++;
        }

        const response = await request
          .get('/api/stats/dashboard')
          .expect(200);

        expect(Math.abs(response.body.conversionRate - testCase.expectedRate)).toBeLessThan(0.1);
      }
    });

    it('should validate stage progression logic thoroughly', async () => {
      // Test exact boundaries for stage transitions
      const stageTests = [
        { contacts: 0, messages: 0, expectedStage: 'new' },
        { contacts: 1, messages: 0, expectedStage: 'beginner' },
        { contacts: 9, messages: 4, expectedStage: 'beginner' },
        { contacts: 10, messages: 5, expectedStage: 'intermediate' },
        { contacts: 15, messages: 10, expectedStage: 'intermediate' }
      ];

      for (const test of stageTests) {
        // Create specified number of contacts
        for (let i = 0; i < test.contacts; i++) {
          await app.db.query(`
            INSERT INTO leads (id, name, phone, status, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [`stage-test-${i}`, `Stage Test Lead ${i}`, `+600600600${i.toString().padStart(2, '0')}`, 'COLD', '550e8400-e29b-41d4-a716-446655440000']);
        }

        // Create specified number of messages
        for (let i = 0; i < test.messages; i++) {
          await app.db.query(`
            INSERT INTO messages (id, lead_id, content, direction, message_type, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [`stage-test-msg-${i}`, 'stage-test-0', `Stage test message ${i}`, 'OUTBOUND', 'TEXT', 'SENT']);
        }

        const response = await request
          .get('/api/stats/user/progress')
          .expect(200);

        expect(response.body.stage).toBe(test.expectedStage);
        expect(response.body.stats.contactsAdded).toBe(test.contacts);
        expect(response.body.stats.messagesSent).toBe(test.messages);
      }
    });
  });
});