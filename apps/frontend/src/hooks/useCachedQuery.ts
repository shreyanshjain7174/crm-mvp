import { useState, useEffect, useCallback, useRef } from 'react';
import { queryCache } from '../lib/cache/QueryCache';
import { logger } from '../lib/utils';

interface UseCachedQueryOptions {
  enabled?: boolean;
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  refetchInterval?: number; // Auto-refetch interval in milliseconds
  retry?: number; // Number of retries on failure
  retryDelay?: number; // Delay between retries in milliseconds
}

interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  lastFetched: number | null;
}

/**
 * Hook for cached API queries with automatic revalidation
 */
export function useCachedQuery<T>(
  key: string | null,
  queryFn: () => Promise<T>,
  options: UseCachedQueryOptions = {}
) {
  const {
    enabled = true,
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    refetchInterval,
    retry = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    isStale: false,
    lastFetched: null
  });

  const retryCountRef = useRef(0);
  const refetchIntervalRef = useRef<NodeJS.Timeout>();

  // Generate stable cache key
  const cacheKey = key ? `query:${key}` : null;

  const executeQuery = useCallback(async (isRefetch = false) => {
    if (!cacheKey || !enabled) return;

    setState(prev => ({
      ...prev,
      isLoading: !isRefetch, // Don't show loading for background refreshes
      isError: false,
      error: null
    }));

    try {
      const data = await queryCache.query(cacheKey, queryFn, { ttl, staleWhileRevalidate });
      
      setState(prev => ({
        ...prev,
        data,
        isLoading: false,
        isError: false,
        error: null,
        isStale: false,
        lastFetched: Date.now()
      }));

      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      const err = error as Error;
      
      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        logger.debug(`Retrying query ${cacheKey}, attempt ${retryCountRef.current}/${retry}`);
        
        setTimeout(() => {
          executeQuery(isRefetch);
        }, retryDelay * retryCountRef.current); // Exponential backoff
        
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: err
      }));
      
      logger.error(`Query failed: ${cacheKey}`, err);
    }
  }, [cacheKey, enabled, queryFn, ttl, staleWhileRevalidate, retry, retryDelay]);

  // Initial load and cache check
  useEffect(() => {
    if (!cacheKey || !enabled) return;

    // Check if data is already in cache
    const cachedData = queryCache.get<T>(cacheKey);
    if (cachedData) {
      setState(prev => ({
        ...prev,
        data: cachedData,
        isStale: false,
        lastFetched: Date.now()
      }));
    } else {
      // Execute query if no cached data
      executeQuery();
    }
  }, [cacheKey, enabled, executeQuery]);

  // Auto-refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled || !cacheKey) return;

    refetchIntervalRef.current = setInterval(() => {
      executeQuery(true); // Background refetch
    }, refetchInterval);

    return () => {
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current);
      }
    };
  }, [refetchInterval, enabled, cacheKey, executeQuery]);

  // Manual refetch function
  const refetch = useCallback(() => {
    if (cacheKey) {
      queryCache.invalidate(cacheKey);
      executeQuery();
    }
  }, [cacheKey, executeQuery]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    if (cacheKey) {
      queryCache.invalidate(cacheKey);
      setState(prev => ({ ...prev, isStale: true }));
    }
  }, [cacheKey]);

  return {
    ...state,
    refetch,
    invalidate,
    cacheKey
  };
}

/**
 * Hook for cached mutations with automatic cache invalidation
 */
export function useCachedMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateKeys?: string[]; // Cache keys to invalidate on success
  } = {}
) {
  const [state, setState] = useState<{
    data: TData | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: false,
    isError: false,
    error: null
  });

  const mutate = useCallback(async (variables: TVariables) => {
    setState({
      data: null,
      isLoading: true,
      isError: false,
      error: null
    });

    try {
      const data = await mutationFn(variables);
      
      setState({
        data,
        isLoading: false,
        isError: false,
        error: null
      });

      // Invalidate related cache keys
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryCache.invalidate(key);
        });
      }

      options.onSuccess?.(data, variables);
      return data;
    } catch (error) {
      const err = error as Error;
      
      setState({
        data: null,
        isLoading: false,
        isError: true,
        error: err
      });

      options.onError?.(err, variables);
      throw err;
    }
  }, [mutationFn, options]);

  return {
    ...state,
    mutate
  };
}

/**
 * Hook to get cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState(() => queryCache.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(queryCache.getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
}