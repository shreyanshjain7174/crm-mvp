import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';
import { performanceMonitor } from './performance-monitor';

interface QueryAnalysis {
  query: string;
  duration: number;
  planCost: number;
  suggestions: string[];
  timestamp: Date;
}

interface OptimizationRule {
  pattern: RegExp;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Database query optimization service
 */
class QueryOptimizer {
  private slowQueryThreshold = 1000; // 1 second
  private queryAnalyses: QueryAnalysis[] = [];
  private optimizationRules: OptimizationRule[] = [
    {
      pattern: /SELECT \* FROM/i,
      suggestion: 'Avoid SELECT * - specify only needed columns',
      priority: 'medium'
    },
    {
      pattern: /WHERE.*LIKE '%.*%'/i,
      suggestion: 'Consider full-text search or indexed substring search',
      priority: 'high'
    },
    {
      pattern: /ORDER BY.*LIMIT/i,
      suggestion: 'Ensure ORDER BY columns are indexed',
      priority: 'high'
    },
    {
      pattern: /JOIN.*ON.*=.*AND/i,
      suggestion: 'Consider composite indexes for join conditions',
      priority: 'medium'
    },
    {
      pattern: /COUNT\(\*\)/i,
      suggestion: 'Consider using approximate counts for large tables',
      priority: 'low'
    },
    {
      pattern: /IN \(SELECT/i,
      suggestion: 'Consider using JOIN instead of IN with subquery',
      priority: 'medium'
    }
  ];

  /**
   * Wrap database query execution with performance monitoring
   */
  async executeQuery<T = any>(
    client: Pool | PoolClient,
    query: string,
    params: any[] = [],
    context: { route?: string; userId?: string } = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Execute the query
      const result = await client.query(query, params);
      const duration = Date.now() - startTime;

      // Track performance
      if (context.route) {
        performanceMonitor.trackQuery(query, duration, context.route);
      }

      // Analyze slow queries
      if (duration > this.slowQueryThreshold) {
        await this.analyzeSlowQuery(client, query, duration);
      }

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn(`Slow query (${duration}ms):`, {
          query: query.substring(0, 200),
          duration,
          route: context.route,
          userId: context.userId
        });
      }

      return result as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Query failed after ${duration}ms:`, {
        query: query.substring(0, 200),
        error: error instanceof Error ? error.message : 'Unknown error',
        route: context.route,
        userId: context.userId
      });
      throw error;
    }
  }

  /**
   * Analyze a slow query and provide optimization suggestions
   */
  private async analyzeSlowQuery(
    client: Pool | PoolClient,
    query: string,
    duration: number
  ): Promise<void> {
    try {
      // Get query execution plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const planResult = await client.query(explainQuery);
      const plan = planResult.rows[0]['QUERY PLAN'][0];
      
      const suggestions = this.generateOptimizationSuggestions(query, plan);
      
      const analysis: QueryAnalysis = {
        query: query.substring(0, 500), // Limit query length
        duration,
        planCost: plan['Total Cost'] || 0,
        suggestions,
        timestamp: new Date()
      };

      this.queryAnalyses.push(analysis);

      // Keep only last 100 analyses
      if (this.queryAnalyses.length > 100) {
        this.queryAnalyses = this.queryAnalyses.slice(-100);
      }

      logger.info('Query analysis completed:', {
        duration,
        cost: analysis.planCost,
        suggestions: suggestions.length
      });

    } catch (error) {
      logger.error('Failed to analyze slow query:', error);
    }
  }

  /**
   * Generate optimization suggestions based on query and execution plan
   */
  private generateOptimizationSuggestions(query: string, plan: any): string[] {
    const suggestions: string[] = [];

    // Check against optimization rules
    for (const rule of this.optimizationRules) {
      if (rule.pattern.test(query)) {
        suggestions.push(`[${rule.priority.toUpperCase()}] ${rule.suggestion}`);
      }
    }

    // Analyze execution plan
    if (plan) {
      this.analyzePlan(plan, suggestions);
    }

    return suggestions;
  }

  /**
   * Analyze execution plan for optimization opportunities
   */
  private analyzePlan(node: any, suggestions: string[]): void {
    if (!node) return;

    // Check for sequential scans on large tables
    if (node['Node Type'] === 'Seq Scan' && node['Actual Rows'] > 10000) {
      suggestions.push('[HIGH] Sequential scan on large table - consider adding index');
    }

    // Check for expensive sorts
    if (node['Node Type'] === 'Sort' && node['Actual Total Time'] > 100) {
      suggestions.push('[MEDIUM] Expensive sort operation - consider pre-sorted index');
    }

    // Check for hash joins on large datasets
    if (node['Node Type'] === 'Hash Join' && node['Actual Rows'] > 50000) {
      suggestions.push('[MEDIUM] Large hash join - consider optimizing join conditions');
    }

    // Check for nested loops with high iteration count
    if (node['Node Type'] === 'Nested Loop' && node['Actual Loops'] > 1000) {
      suggestions.push('[HIGH] High iteration nested loop - consider hash or merge join');
    }

    // Recursively analyze child plans
    if (node['Plans']) {
      for (const childPlan of node['Plans']) {
        this.analyzePlan(childPlan, suggestions);
      }
    }
  }

  /**
   * Get recent query analyses
   */
  getQueryAnalyses(limit = 20): QueryAnalysis[] {
    return this.queryAnalyses
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get optimization suggestions for a specific query
   */
  async getQuerySuggestions(
    client: Pool | PoolClient,
    query: string
  ): Promise<string[]> {
    try {
      // Get execution plan without executing
      const explainQuery = `EXPLAIN (FORMAT JSON) ${query}`;
      const planResult = await client.query(explainQuery);
      const plan = planResult.rows[0]['QUERY PLAN'][0];
      
      return this.generateOptimizationSuggestions(query, plan);
    } catch (error) {
      logger.error('Failed to get query suggestions:', error);
      return ['Unable to analyze query - please check syntax'];
    }
  }

  /**
   * Suggest database indexes based on slow queries
   */
  suggestIndexes(): Array<{
    table: string;
    columns: string[];
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const suggestions: Array<{
      table: string;
      columns: string[];
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Analyze common patterns in slow queries
    const slowQueries = this.queryAnalyses.filter(a => a.duration > this.slowQueryThreshold);
    
    for (const analysis of slowQueries) {
      const query = analysis.query.toLowerCase();

      // Suggest indexes for WHERE clauses
      const whereMatch = query.match(/where\s+(\w+)\s*[=<>]/);
      if (whereMatch) {
        suggestions.push({
          table: this.extractTableName(query),
          columns: [whereMatch[1]],
          reason: `Frequent WHERE condition on ${whereMatch[1]}`,
          priority: 'high'
        });
      }

      // Suggest indexes for ORDER BY
      const orderMatch = query.match(/order\s+by\s+(\w+)/);
      if (orderMatch) {
        suggestions.push({
          table: this.extractTableName(query),
          columns: [orderMatch[1]],
          reason: `Frequent ORDER BY on ${orderMatch[1]}`,
          priority: 'medium'
        });
      }
    }

    // Remove duplicates
    const uniqueSuggestions = suggestions.filter((suggestion, index, array) => 
      index === array.findIndex(s => 
        s.table === suggestion.table && 
        JSON.stringify(s.columns) === JSON.stringify(suggestion.columns)
      )
    );

    return uniqueSuggestions.slice(0, 10); // Top 10 suggestions
  }

  /**
   * Extract table name from query (simplified)
   */
  private extractTableName(query: string): string {
    const fromMatch = query.match(/from\s+(\w+)/);
    return fromMatch ? fromMatch[1] : 'unknown';
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalQueries: number;
    slowQueries: number;
    averageDuration: number;
    topSuggestions: string[];
  } {
    const totalQueries = this.queryAnalyses.length;
    const slowQueries = this.queryAnalyses.filter(a => a.duration > this.slowQueryThreshold);
    const averageDuration = totalQueries > 0 
      ? this.queryAnalyses.reduce((sum, a) => sum + a.duration, 0) / totalQueries 
      : 0;

    // Get most common suggestions
    const allSuggestions = this.queryAnalyses.flatMap(a => a.suggestions);
    const suggestionCounts = allSuggestions.reduce((counts: Record<string, number>, suggestion) => {
      counts[suggestion] = (counts[suggestion] || 0) + 1;
      return counts;
    }, {});

    const topSuggestions = Object.entries(suggestionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([suggestion]) => suggestion);

    return {
      totalQueries,
      slowQueries: slowQueries.length,
      averageDuration,
      topSuggestions
    };
  }

  /**
   * Clear analysis history
   */
  clearAnalyses(): void {
    this.queryAnalyses = [];
    logger.info('Query analyses cleared');
  }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();
export default queryOptimizer;