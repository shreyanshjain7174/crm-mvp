import { logger } from '../utils';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface QueryCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  staleWhileRevalidate?: boolean; // Return stale data while refetching
}

/**
 * Frontend query cache for API responses
 * Implements memory-based caching with TTL and stale-while-revalidate
 */
export class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingQueries = new Map<string, Promise<any>>();
  private options: Required<QueryCacheOptions>;

  constructor(options: QueryCacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 500, // 500 entries max
      staleWhileRevalidate: true,
      ...options
    };

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get data from cache or execute query
   */
  async query<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: Partial<QueryCacheOptions> = {}
  ): Promise<T> {
    const cacheKey = this.normalizeKey(key);
    const ttl = options.ttl ?? this.options.ttl;
    const staleWhileRevalidate = options.staleWhileRevalidate ?? this.options.staleWhileRevalidate;

    // Check if query is already pending
    const pendingQuery = this.pendingQueries.get(cacheKey);
    if (pendingQuery) {
      return pendingQuery;
    }

    // Check cache
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached) {
      const isStale = now - cached.timestamp > cached.ttl;
      
      if (!isStale) {
        // Fresh data, return immediately
        return cached.data;
      }

      if (staleWhileRevalidate) {
        // Return stale data and update in background
        this.updateInBackground(cacheKey, queryFn, ttl);
        return cached.data;
      }
    }

    // Execute query and cache result
    return this.executeAndCache(cacheKey, queryFn, ttl);
  }

  /**
   * Execute query and cache the result
   */
  private async executeAndCache<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      // Set pending query to prevent duplicate requests
      const queryPromise = queryFn();
      this.pendingQueries.set(key, queryPromise);

      const data = await queryPromise;
      
      // Cache the result
      this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error('Query cache error:', error);
      throw error;
    } finally {
      // Remove from pending queries
      this.pendingQueries.delete(key);
    }
  }

  /**
   * Update cache in background without blocking
   */
  private updateInBackground<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number
  ): void {
    // Don't wait for the result, just update cache when ready
    this.executeAndCache(key, queryFn, ttl).catch((error) => {
      logger.error('Background cache update failed:', error);
    });
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheKey = this.normalizeKey(key);
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.options.ttl
    };

    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    this.cache.set(cacheKey, cacheEntry);
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const cacheKey = this.normalizeKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - cached.timestamp > cached.ttl;

    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Invalidate cache entries by key or pattern
   */
  invalidate(keyOrPattern: string): void {
    if (keyOrPattern.includes('*')) {
      // Pattern matching
      const pattern = keyOrPattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Exact key match
      const cacheKey = this.normalizeKey(keyOrPattern);
      this.cache.delete(cacheKey);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingQueries.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    pendingQueries: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      pendingQueries: this.pendingQueries.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10% of entries
    const toRemove = Math.floor(entries.length * 0.1) || 1;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Normalize cache key
   */
  private normalizeKey(key: string): string {
    return key.toLowerCase().trim();
  }
}

// Create singleton instance
export const queryCache = new QueryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 500,
  staleWhileRevalidate: true
});

export default queryCache;