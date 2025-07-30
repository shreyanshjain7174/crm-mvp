import { FastifyRequest, FastifyReply } from 'fastify';
import { cacheService } from './cache-service';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  slowestQueries: QueryMetric[];
  cacheHitRate: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  timestamp: Date;
}

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: Date;
  route: string;
}

interface RouteMetric {
  route: string;
  method: string;
  count: number;
  totalTime: number;
  averageTime: number;
  errorCount: number;
  lastAccessed: Date;
}

/**
 * Performance monitoring service for tracking API performance
 */
class PerformanceMonitor {
  private metrics: Map<string, RouteMetric> = new Map();
  private slowQueries: QueryMetric[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;
  private activeConnections = 0;
  private startTime = Date.now();

  constructor() {
    // Clean up old metrics every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
    
    // Log performance summary every 5 minutes
    setInterval(() => this.logSummary(), 5 * 60 * 1000);
  }

  /**
   * Middleware to track request performance
   */
  requestTracker() {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      const startTime = Date.now();
      const route = `${request.method} ${request.routerPath || request.url}`;
      
      this.requestCount++;
      this.activeConnections++;

      // Track when request completes using onResponse hook
      request.server.addHook('onResponse', async (req, rep) => {
        if (req.id === request.id) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          this.activeConnections--;
          this.totalResponseTime += duration;

          // Track error responses
          if (rep.statusCode >= 400) {
            this.errorCount++;
          }

          // Update route metrics
          this.updateRouteMetrics(route, req.method, duration, rep.statusCode >= 400);

          // Track slow queries (>2 seconds)
          if (duration > 2000) {
            this.addSlowQuery({
              query: route,
              duration,
              timestamp: new Date(),
              route: req.routerPath || req.url
            });
          }

          // Log slow requests
          if (duration > 1000) {
            logger.warn(`Slow request: ${route} took ${duration}ms`);
          }
        }
      });
    };
  }

  /**
   * Update metrics for a specific route
   */
  private updateRouteMetrics(route: string, method: string, duration: number, isError: boolean) {
    const key = `${method}:${route}`;
    const existing = this.metrics.get(key);

    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.averageTime = existing.totalTime / existing.count;
      existing.lastAccessed = new Date();
      if (isError) {
        existing.errorCount++;
      }
    } else {
      this.metrics.set(key, {
        route,
        method,
        count: 1,
        totalTime: duration,
        averageTime: duration,
        errorCount: isError ? 1 : 0,
        lastAccessed: new Date()
      });
    }
  }

  /**
   * Add slow query to tracking
   */
  private addSlowQuery(query: QueryMetric) {
    this.slowQueries.push(query);
    
    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100);
    }
  }

  /**
   * Get current performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    const cacheStats = await cacheService.getStats();
    const memoryUsage = process.memoryUsage();
    
    return {
      requestCount: this.requestCount,
      averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
      slowestQueries: this.slowQueries.slice(-10), // Last 10 slow queries
      cacheHitRate: this.calculateCacheHitRate(cacheStats),
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      activeConnections: this.activeConnections,
      memoryUsage,
      cpuUsage: this.getCpuUsage(),
      timestamp: new Date()
    };
  }

  /**
   * Get route-specific performance metrics
   */
  getRouteMetrics(): RouteMetric[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 20); // Top 20 slowest routes
  }

  /**
   * Get detailed performance report
   */
  async getDetailedReport(): Promise<{
    overview: PerformanceMetrics;
    routes: RouteMetric[];
    slowQueries: QueryMetric[];
    cacheStats: any;
    systemInfo: {
      uptime: number;
      nodeVersion: string;
      platform: string;
      arch: string;
    };
  }> {
    const [overview, cacheStats] = await Promise.all([
      this.getMetrics(),
      cacheService.getStats()
    ]);

    return {
      overview,
      routes: this.getRouteMetrics(),
      slowQueries: this.slowQueries.slice(-20),
      cacheStats,
      systemInfo: {
        uptime: Date.now() - this.startTime,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.metrics.clear();
    this.slowQueries = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
    this.activeConnections = 0;
    this.startTime = Date.now();
    
    logger.info('Performance metrics reset');
  }

  /**
   * Calculate cache hit rate from stats
   */
  private calculateCacheHitRate(cacheStats: any): number {
    if (!cacheStats || !cacheStats.hits || !cacheStats.misses) {
      return 0;
    }
    
    const total = cacheStats.hits + cacheStats.misses;
    return total > 0 ? (cacheStats.hits / total) * 100 : 0;
  }

  /**
   * Get approximate CPU usage (simplified)
   */
  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  /**
   * Clean up old metrics
   */
  private cleanup() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    // Remove old route metrics
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.lastAccessed.getTime() < cutoffTime) {
        this.metrics.delete(key);
      }
    }

    // Remove old slow queries
    this.slowQueries = this.slowQueries.filter(
      query => query.timestamp.getTime() > cutoffTime
    );

    logger.debug('Performance metrics cleanup completed');
  }

  /**
   * Log performance summary
   */
  private async logSummary() {
    const metrics = await this.getMetrics();
    
    logger.info('Performance Summary:', {
      requests: metrics.requestCount,
      avgResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`,
      cacheHitRate: `${metrics.cacheHitRate.toFixed(2)}%`,
      memoryUsage: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
      activeConnections: metrics.activeConnections
    });
  }

  /**
   * Database query performance tracker
   */
  trackQuery(query: string, duration: number, route: string) {
    // Track database queries that take longer than 500ms
    if (duration > 500) {
      this.addSlowQuery({
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration,
        timestamp: new Date(),
        route
      });
    }
  }

  /**
   * Get performance alerts
   */
  getAlerts(): string[] {
    const alerts: string[] = [];
    const metrics = this.metrics;

    // Check for high error rates
    const totalRequests = this.requestCount;
    const errorRate = totalRequests > 0 ? (this.errorCount / totalRequests) * 100 : 0;
    
    if (errorRate > 5) {
      alerts.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    // Check for slow routes
    const slowRoutes = Array.from(metrics.values()).filter(m => m.averageTime > 2000);
    if (slowRoutes.length > 0) {
      alerts.push(`${slowRoutes.length} routes with avg response time > 2s`);
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    if (memUsageMB > 512) {
      alerts.push(`High memory usage: ${memUsageMB.toFixed(0)}MB`);
    }

    return alerts;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;