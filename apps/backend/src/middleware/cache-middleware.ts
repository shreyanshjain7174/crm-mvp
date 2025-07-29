import { FastifyRequest, FastifyReply } from 'fastify';
import { cacheService } from '../services/cache-service';
import { logger } from '../utils/logger';

interface CacheMiddlewareOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (request: FastifyRequest) => string;
  condition?: (request: FastifyRequest) => boolean;
  invalidatePatterns?: string[]; // Patterns to invalidate on cache miss
}

/**
 * Cache middleware for Fastify routes
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `route:${req.method}:${req.url}`,
    condition = () => true,
    invalidatePatterns = [] // eslint-disable-line @typescript-eslint/no-unused-vars
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Only cache GET requests by default
    if (request.method !== 'GET') {
      return;
    }

    // Check if caching should be applied
    if (!condition(request)) {
      return;
    }

    const cacheKey = keyGenerator(request);

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        reply.header('X-Cache', 'HIT');
        reply.send(cachedData);
        return;
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);
      reply.header('X-Cache', 'MISS');

      // Store original send method
      const originalSend = reply.send.bind(reply);

      // Override send method to cache the response
      reply.send = function(data: any) {
        // Only cache successful responses
        if (reply.statusCode >= 200 && reply.statusCode < 300) {
          cacheService.set(cacheKey, data, { ttl }).catch((error) => {
            logger.error('Failed to cache response:', error);
          });
        }
        
        return originalSend(data);
      };

    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without caching on error
    }
  };
}

/**
 * Invalidate cache patterns - useful for mutations
 */
export function invalidateCache(patterns: string[]) {
  return async (_request: FastifyRequest, _reply: FastifyReply) => {
    try {
      for (const pattern of patterns) {
        await cacheService.delPattern(pattern);
        logger.debug(`Invalidated cache pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  };
}

/**
 * Cache key generators for common patterns
 */
export const cacheKeyGenerators = {
  // Cache by route and user ID
  userSpecific: (request: FastifyRequest): string => {
    const userId = (request.user as any)?.id || 'anonymous';
    return `user:${userId}:route:${request.method}:${request.url}`;
  },

  // Cache by route and query parameters
  withQuery: (request: FastifyRequest): string => {
    const queryString = new URLSearchParams(request.query as any).toString();
    return `route:${request.method}:${request.url}${queryString ? '?' + queryString : ''}`;
  },

  // Cache by route, user, and query
  userWithQuery: (request: FastifyRequest): string => {
    const userId = (request.user as any)?.id || 'anonymous';
    const queryString = new URLSearchParams(request.query as any).toString();
    return `user:${userId}:route:${request.method}:${request.url}${queryString ? '?' + queryString : ''}`;
  },

  // Cache specific resource by ID
  resourceById: (resourceType: string) => (request: FastifyRequest): string => {
    const id = (request.params as any).id;
    const userId = (request.user as any)?.id || 'anonymous';
    return `user:${userId}:${resourceType}:${id}`;
  }
};

/**
 * Cache conditions for common scenarios
 */
export const cacheConditions = {
  // Only cache for authenticated users
  authenticated: (request: FastifyRequest): boolean => {
    return !!(request.user as any)?.id;
  },

  // Cache only if no sensitive query parameters
  noSensitiveParams: (request: FastifyRequest): boolean => {
    const sensitiveParams = ['password', 'token', 'secret', 'key'];
    const query = request.query as Record<string, any>;
    return !sensitiveParams.some(param => param in query);
  },

  // Cache only for specific HTTP methods
  methodsOnly: (methods: string[]) => (request: FastifyRequest): boolean => {
    return methods.includes(request.method);
  }
};