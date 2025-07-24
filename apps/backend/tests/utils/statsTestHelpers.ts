/**
 * Stats Test Helpers
 * 
 * Utility functions and data generators for testing stats APIs
 * with various data scenarios and edge cases.
 */

import { FastifyInstance } from 'fastify';

export interface TestDataScenario {
  name: string;
  description: string;
  setup: (app: FastifyInstance) => Promise<any>;
  expectedResults: any;
}

/**
 * Generate test data for various business scenarios
 */
export class StatsTestDataGenerator {
  static async createEmptyBusinessScenario(app: FastifyInstance) {
    // No additional setup needed - fresh business
    return {
      expectedDashboard: {
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
      },
      expectedProgress: {
        stage: 'new',
        stats: {
          contactsAdded: 0,
          messagesSent: 0,
          aiInteractions: 0,
          templatesUsed: 0,
          pipelineActions: 0
        },
        progressPercentage: 0
      }
    };
  }

  static async createStartupBusinessScenario(app: FastifyInstance, userId = '550e8400-e29b-41d4-a716-446655440000') {
    // Small business just getting started
    const leads = [
      { id: 'startup-1', phone: '+1001001001', status: 'COLD', name: 'John Smith' },
      { id: 'startup-2', phone: '+1001001002', status: 'WARM', name: 'Jane Doe' },
      { id: 'startup-3', phone: '+1001001003', status: 'HOT', name: 'Bob Johnson' }
    ];

    for (const lead of leads) {
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [lead.id, lead.name, lead.phone, lead.status, userId]);
    }

    // Add some messages
    await app.db.query(`
      INSERT INTO messages (id, lead_id, content, direction, message_type, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, ['startup-msg-1', 'startup-2', 'Thanks for your interest!', 'OUTBOUND', 'TEXT', 'SENT']);

    await app.db.query(`
      INSERT INTO messages (id, lead_id, content, direction, message_type, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, ['startup-msg-2', 'startup-3', 'Can we schedule a call?', 'OUTBOUND', 'TEXT', 'SENT']);

    return {
      expectedDashboard: {
        totalLeads: 3,
        activeConversations: 2,
        conversionRate: 66.7, // 2 out of 3 are WARM/HOT
        hotLeads: 1
      },
      expectedProgress: {
        stage: 'beginner',
        stats: {
          contactsAdded: 3,
          messagesSent: 2,
          aiInteractions: 0,
          templatesUsed: 0,
          pipelineActions: 0
        }
      }
    };
  }

  static async createGrowingBusinessScenario(app: FastifyInstance, userId = '550e8400-e29b-41d4-a716-446655440000') {
    // Medium-sized business with good activity
    const leads = [];
    for (let i = 0; i < 25; i++) {
      const statuses = ['COLD', 'WARM', 'HOT', 'CONVERTED'];
      const status = statuses[i % 4];
      leads.push({
        id: `growing-${i}`,
        phone: `+200200200${i.toString().padStart(2, '0')}`,
        status,
        name: `Lead ${i}`
      });
    }

    for (const lead of leads) {
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [lead.id, lead.name, lead.phone, lead.status, userId]);
    }

    // Add messages for most leads
    for (let i = 0; i < 15; i++) {
      await app.db.query(`
        INSERT INTO messages (id, lead_id, content, direction, message_type, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [`growing-msg-${i}`, `growing-${i}`, `Message to lead ${i}`, 'OUTBOUND', 'TEXT', 'SENT']);
    }

    return {
      expectedDashboard: {
        totalLeads: 25,
        activeConversations: 15,
        conversionRate: 75, // 18.75 out of 25 are WARM/HOT/CONVERTED (75%)
        hotLeads: 6 // Every 4th starting from index 2
      },
      expectedProgress: {
        stage: 'intermediate',
        stats: {
          contactsAdded: 25,
          messagesSent: 15,
          aiInteractions: 0,
          templatesUsed: 0,
          pipelineActions: 0
        }
      }
    };
  }

  static async createEnterpriseBusinessScenario(app: FastifyInstance, userId = '550e8400-e29b-41d4-a716-446655440000') {
    // Large business with extensive activity
    const leads = [];
    for (let i = 0; i < 100; i++) {
      const statuses = ['COLD', 'WARM', 'HOT', 'CONVERTED'];
      const status = statuses[Math.floor(Math.random() * 4)];
      leads.push({
        id: `enterprise-${i}`,
        phone: `+300300300${i.toString().padStart(2, '0')}`,
        status,
        name: `Enterprise Lead ${i}`
      });
    }

    for (const lead of leads) {
      await app.db.query(`
        INSERT INTO leads (id, name, phone, status, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [lead.id, lead.name, lead.phone, lead.status, userId]);
    }

    // Add many messages
    for (let i = 0; i < 80; i++) {
      await app.db.query(`
        INSERT INTO messages (id, lead_id, content, direction, message_type, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [`enterprise-msg-${i}`, `enterprise-${i % 100}`, `Enterprise message ${i}`, 'OUTBOUND', 'TEXT', 'SENT']);
    }

    return {
      expectedDashboard: {
        totalLeads: 100,
        activeConversations: 80
        // Conversion rate and hot leads will vary due to randomness
      },
      expectedProgress: {
        stage: 'intermediate', // Would be advanced/expert with AI interactions
        stats: {
          contactsAdded: 100,
          messagesSent: 80,
          aiInteractions: 0,
          templatesUsed: 0,
          pipelineActions: 0
        }
      }
    };
  }

  static async createTimeBasedScenario(app: FastifyInstance, userId = '550e8400-e29b-41d4-a716-446655440000') {
    // Scenario with data spread across different time periods for testing growth calculations
    const now = new Date();
    const timeOffsets = {
      twoMonthsAgo: 65 * 24 * 60 * 60 * 1000,
      oneMonthAgo: 35 * 24 * 60 * 60 * 1000,
      twoWeeksAgo: 14 * 24 * 60 * 60 * 1000,
      oneWeekAgo: 7 * 24 * 60 * 60 * 1000,
      today: 0
    };

    const timeBasedData = [
      // Previous period (30-60 days ago)
      { period: 'twoMonthsAgo', count: 2, statusPattern: ['COLD', 'WARM'] },
      { period: 'oneMonthAgo', count: 3, statusPattern: ['COLD', 'HOT', 'CONVERTED'] },
      
      // Current period (last 30 days)
      { period: 'twoWeeksAgo', count: 4, statusPattern: ['WARM', 'HOT', 'HOT', 'CONVERTED'] },
      { period: 'oneWeekAgo', count: 2, statusPattern: ['HOT', 'CONVERTED'] },
      { period: 'today', count: 1, statusPattern: ['WARM'] }
    ];

    let leadIndex = 0;
    for (const data of timeBasedData) {
      const timestamp = new Date(now.getTime() - timeOffsets[data.period as keyof typeof timeOffsets]);
      
      for (let i = 0; i < data.count; i++) {
        const status = data.statusPattern[i % data.statusPattern.length];
        await app.db.query(`
          INSERT INTO leads (id, name, phone, status, user_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [`time-lead-${leadIndex}`, `Time Lead ${leadIndex}`, `+400400400${leadIndex.toString().padStart(2, '0')}`, status, userId, timestamp]);
        
        leadIndex++;
      }
    }

    return {
      expectedDashboard: {
        totalLeads: 12,
        // Recent period: 7 leads vs Previous period: 5 leads = 40% growth
        expectedGrowthTrend: 'positive'
      },
      timeDistribution: timeBasedData
    };
  }
}

/**
 * Test assertion helpers for stats validation
 */
export class StatsTestValidators {
  static validateDashboardResponse(response: any, expectedMinimums?: any) {
    expect(response).toBeDefined();
    expect(typeof response.totalLeads).toBe('number');
    expect(typeof response.activeConversations).toBe('number');
    expect(typeof response.conversionRate).toBe('number');
    expect(typeof response.hotLeads).toBe('number');
    expect(typeof response.growth).toBe('object');

    // Validate all values are non-negative
    expect(response.totalLeads).toBeGreaterThanOrEqual(0);
    expect(response.activeConversations).toBeGreaterThanOrEqual(0);
    expect(response.conversionRate).toBeGreaterThanOrEqual(0);
    expect(response.hotLeads).toBeGreaterThanOrEqual(0);

    // Validate logical constraints
    expect(response.activeConversations).toBeLessThanOrEqual(response.totalLeads);
    expect(response.hotLeads).toBeLessThanOrEqual(response.totalLeads);
    expect(response.conversionRate).toBeLessThanOrEqual(100);

    // Growth object structure
    expect(typeof response.growth.leads).toBe('number');
    expect(typeof response.growth.conversations).toBe('number');
    expect(typeof response.growth.hotLeads).toBe('number');
    expect(typeof response.growth.conversionRate).toBe('number');

    // Check minimums if provided
    if (expectedMinimums) {
      Object.keys(expectedMinimums).forEach(key => {
        if (expectedMinimums[key] !== undefined) {
          expect(response[key]).toBeGreaterThanOrEqual(expectedMinimums[key]);
        }
      });
    }
  }

  static validateProgressResponse(response: any, expectedStage?: string) {
    expect(response).toBeDefined();
    expect(typeof response.stage).toBe('string');
    expect(typeof response.stats).toBe('object');
    expect(typeof response.progressPercentage).toBe('number');
    expect(Array.isArray(response.nextStageRequirements)).toBe(true);

    // Validate stage values
    const validStages = ['new', 'beginner', 'intermediate', 'advanced', 'expert'];
    expect(validStages).toContain(response.stage);

    // Validate stats structure
    expect(typeof response.stats.contactsAdded).toBe('number');
    expect(typeof response.stats.messagesSent).toBe('number');
    expect(typeof response.stats.aiInteractions).toBe('number');
    expect(typeof response.stats.templatesUsed).toBe('number');
    expect(typeof response.stats.pipelineActions).toBe('number');

    // Validate all stats are non-negative
    Object.values(response.stats).forEach((value: any) => {
      expect(value).toBeGreaterThanOrEqual(0);
    });

    // Validate progress percentage
    expect(response.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(response.progressPercentage).toBeLessThanOrEqual(100);

    // Check expected stage if provided
    if (expectedStage) {
      expect(response.stage).toBe(expectedStage);
    }

    // Validate next stage requirements
    expect(response.nextStageRequirements.length).toBeGreaterThan(0);
    response.nextStageRequirements.forEach((req: string) => {
      expect(typeof req).toBe('string');
      expect(req.length).toBeGreaterThan(0);
    });
  }

  static validateGrowthCalculations(currentPeriod: any, previousPeriod: any, growthResponse: any) {
    // Validate growth percentage calculations
    if (previousPeriod.totalLeads === 0) {
      if (currentPeriod.totalLeads > 0) {
        expect(growthResponse.leads).toBe(100); // 100% growth from zero
      } else {
        expect(growthResponse.leads).toBe(0); // No growth
      }
    } else {
      const expectedGrowth = ((currentPeriod.totalLeads - previousPeriod.totalLeads) / previousPeriod.totalLeads) * 100;
      expect(Math.abs(growthResponse.leads - expectedGrowth)).toBeLessThan(0.1); // Allow small rounding differences
    }
  }

  static validatePerformanceMetrics(startTime: number, endTime: number, maxResponseTime: number = 1000) {
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(maxResponseTime);
  }

  static validateMemoryUsage(initialMemory: number, finalMemory: number, maxIncrease: number = 50 * 1024 * 1024) {
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(maxIncrease);
  }
}

/**
 * Performance testing utilities
 */
export class StatsPerformanceTestUtils {
  static async measureResponseTime<T>(operation: () => Promise<T>): Promise<{ result: T; responseTime: number }> {
    const startTime = Date.now();
    const result = await operation();
    const endTime = Date.now();
    
    return {
      result,
      responseTime: endTime - startTime
    };
  }

  static async measureMemoryUsage<T>(operation: () => Promise<T>): Promise<{ result: T; memoryDelta: number }> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = process.memoryUsage().heapUsed;
    const result = await operation();
    
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    
    return {
      result,
      memoryDelta: finalMemory - initialMemory
    };
  }

  static async runLoadTest(
    operation: () => Promise<any>,
    concurrency: number = 10,
    duration: number = 5000
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
  }> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    const promises: Promise<any>[] = [];
    const results: Array<{ success: boolean; responseTime: number }> = [];

    // Start concurrent operations
    for (let i = 0; i < concurrency; i++) {
      promises.push(
        (async () => {
          while (Date.now() < endTime) {
            const operationStart = Date.now();
            try {
              await operation();
              results.push({ success: true, responseTime: Date.now() - operationStart });
            } catch (error) {
              results.push({ success: false, responseTime: Date.now() - operationStart });
            }
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        })()
      );
    }

    await Promise.all(promises);

    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const responseTimes = results.map(r => r.responseTime);

    return {
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: results.length - successfulResults.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes)
    };
  }
}

/**
 * Edge case test data generators
 */
export class StatsEdgeCaseGenerators {
  static async createExtremeLargeDataset(app: FastifyInstance, size: number = 1000, userId = '550e8400-e29b-41d4-a716-446655440000') {
    // Create a very large dataset to test performance limits
    const batchSize = 100;
    const batches = Math.ceil(size / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const promises = [];
      const currentBatchSize = Math.min(batchSize, size - batch * batchSize);

      for (let i = 0; i < currentBatchSize; i++) {
        const index = batch * batchSize + i;
        promises.push(
          app.db.query(`
            INSERT INTO leads (id, name, phone, status, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [`extreme-${index}`, `Extreme Lead ${index}`, `+500500500${index.toString().padStart(3, '0')}`, 'COLD', userId])
        );
      }

      await Promise.all(promises);
    }
  }

  static async createZeroDivisionScenario(app: FastifyInstance, userId = '550e8400-e29b-41d4-a716-446655440000') {
    // Create scenarios that might cause division by zero
    // No data at all - should handle gracefully
    return { scenario: 'empty', expectedBehavior: 'graceful_handling' };
  }

  static async createInvalidDataScenario(app: FastifyInstance, userId = '550e8400-e29b-41d4-a716-446655440000') {
    // Create leads with invalid or edge-case data
    const invalidData = [
      { id: 'invalid-1', name: '', phone: '', status: 'INVALID_STATUS' },
      { id: 'invalid-2', name: null, phone: null, status: 'COLD' },
      { id: 'invalid-3', name: 'Very'.repeat(100), phone: '+'.repeat(50), status: 'HOT' }
    ];

    for (const data of invalidData) {
      try {
        await app.db.query(`
          INSERT INTO leads (id, name, phone, status, user_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [data.id, data.name, data.phone, data.status, userId]);
      } catch (error) {
        // Some insertions may fail due to constraints - that's expected
        console.log(`Expected constraint violation for ${data.id}`);
      }
    }
  }
}