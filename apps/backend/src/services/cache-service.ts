import Redis from 'ioredis';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  json?: boolean; // Whether to JSON stringify/parse the value
}

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;
  private defaultTTL = 300; // 5 minutes

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.redis.ping();
      logger.info('Redis cache service initialized');
    } catch (error) {
      logger.warn('Redis not available, caching disabled:', error);
      this.redis = null;
      this.isConnected = false;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const ttl = options.ttl || this.defaultTTL;
      const serializedValue = options.json !== false ? JSON.stringify(value) : value;
      
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }

      return options.json !== false ? JSON.parse(value) : value as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache del error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delPattern error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern - if key doesn't exist, call the factory function and cache the result
   */
  async getOrSet<T = any>(
    key: string, 
    factory: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, get from factory
    const value = await factory();
    
    // Cache the result
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Generate cache keys for different data types
   */
  generateKey(type: string, id: string | number, suffix?: string): string {
    const parts = ['crm', type, id.toString()];
    if (suffix) {
      parts.push(suffix);
    }
    return parts.join(':');
  }

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.flushdb();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
    hits: number;
    misses: number;
  } | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const info = await this.redis.info('stats');
      const dbsize = await this.redis.dbsize();
      // Get memory usage stats
      const memoryStats = await this.redis.info('memory');

      // Parse stats from Redis INFO command
      const stats = info.split('\r\n').reduce((acc: any, line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Parse memory stats
      const memoryInfo = memoryStats.split('\r\n').reduce((acc: any, line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      return {
        connected: this.isConnected,
        keys: dbsize,
        memory: `${Math.round((parseInt(memoryInfo.used_memory) || 0) / 1024 / 1024 * 100) / 100} MB`,
        hits: parseInt(stats.keyspace_hits) || 0,
        misses: parseInt(stats.keyspace_misses) || 0,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;