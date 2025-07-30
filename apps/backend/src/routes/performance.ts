import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache-middleware';
import { performanceMonitor } from '../services/performance-monitor';
import { cacheService } from '../services/cache-service';
import { logger } from '../utils/logger';

export async function performanceRoutes(fastify: FastifyInstance) {
  // Get performance metrics
  fastify.get('/metrics', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 30, // 30 seconds cache for performance metrics
        keyGenerator: () => 'performance:metrics'
      })
    ]
  }, async (request, reply) => {
    try {
      const metrics = await performanceMonitor.getMetrics();
      
      reply.send({
        success: true,
        metrics
      });
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get performance metrics'
      });
    }
  });

  // Get detailed performance report
  fastify.get('/report', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const report = await performanceMonitor.getDetailedReport();
      
      reply.send({
        success: true,
        report
      });
    } catch (error) {
      logger.error('Failed to get performance report:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get performance report'
      });
    }
  });

  // Get route-specific metrics
  fastify.get('/routes', {
    preHandler: [
      authenticate,
      cacheMiddleware({
        ttl: 60, // 1 minute cache for route metrics
        keyGenerator: () => 'performance:routes'
      })
    ]
  }, async (request, reply) => {
    try {
      const routes = performanceMonitor.getRouteMetrics();
      
      reply.send({
        success: true,
        routes
      });
    } catch (error) {
      logger.error('Failed to get route metrics:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get route metrics'
      });
    }
  });

  // Get cache statistics
  fastify.get('/cache', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const stats = await cacheService.getStats();
      
      reply.send({
        success: true,
        cache: stats
      });
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get cache stats'
      });
    }
  });

  // Get performance alerts
  fastify.get('/alerts', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const alerts = performanceMonitor.getAlerts();
      
      reply.send({
        success: true,
        alerts
      });
    } catch (error) {
      logger.error('Failed to get performance alerts:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get performance alerts'
      });
    }
  });

  // Clear cache (admin only)
  fastify.delete('/cache', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      await cacheService.flush();
      
      reply.send({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  });

  // Reset performance metrics (admin only)
  fastify.delete('/metrics', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      performanceMonitor.reset();
      
      reply.send({
        success: true,
        message: 'Performance metrics reset successfully'
      });
    } catch (error) {
      logger.error('Failed to reset metrics:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to reset metrics'
      });
    }
  });

  // Warm up cache for critical routes
  fastify.post('/warmup', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const criticalRoutes = [
        '/api/stats/dashboard',
        '/api/contacts',
        '/api/achievements',
        '/api/notifications'
      ];

      const warmupPromises = criticalRoutes.map(async (route) => {
        try {
          // Make internal request to warm up cache
          const response = await fastify.inject({
            method: 'GET',
            url: route,
            headers: request.headers
          });
          return { route, status: response.statusCode };
        } catch (error) {
          return { route, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(warmupPromises);
      
      reply.send({
        success: true,
        message: 'Cache warmup completed',
        results
      });
    } catch (error) {
      logger.error('Failed to warm up cache:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to warm up cache'
      });
    }
  });

  // Health check with performance info
  fastify.get('/health', async (request, reply) => {
    try {
      const metrics = await performanceMonitor.getMetrics();
      const cacheStats = await cacheService.getStats();
      const alerts = performanceMonitor.getAlerts();
      
      const isHealthy = alerts.length === 0 && metrics.errorRate < 5;
      
      reply.status(isHealthy ? 200 : 503).send({
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        metrics: {
          averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
          errorRate: `${metrics.errorRate.toFixed(2)}%`,
          cacheHitRate: `${metrics.cacheHitRate.toFixed(2)}%`,
          memoryUsage: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
          activeConnections: metrics.activeConnections
        },
        cache: cacheStats ? {
          connected: cacheStats.connected,
          keys: cacheStats.keys,
          memory: cacheStats.memory
        } : null,
        alerts
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      reply.status(503).send({
        healthy: false,
        error: 'Health check failed'
      });
    }
  });
}