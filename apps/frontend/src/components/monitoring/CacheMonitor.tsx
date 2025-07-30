'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Activity, 
  TrendingUp,
  Clock,
  HardDrive,
  Zap
} from 'lucide-react';
import { useCachedQuery, useCachedMutation, useCacheStats } from '@/hooks/useCachedQuery';
import { queryCache } from '@/lib/cache/QueryCache';

interface CacheStats {
  connected: boolean;
  keys: number;
  memory: string;
  hits: number;
  misses: number;
}

export function CacheMonitor() {
  const [isClearing, setIsClearing] = useState(false);
  const frontendCacheStats = useCacheStats();

  // Backend cache stats
  const { 
    data: backendCache, 
    isLoading: backendLoading, 
    refetch: refetchBackend 
  } = useCachedQuery<{ cache: CacheStats | null }>(
    'cache-stats',
    () => fetch('/api/performance/cache').then(res => res.json()),
    { ttl: 30000 } // 30 seconds
  );

  // Clear cache mutation
  const { mutate: clearCache, isLoading: clearingCache } = useCachedMutation(
    () => fetch('/api/performance/cache', { method: 'DELETE' }).then(res => res.json()),
    {
      onSuccess: () => {
        refetchBackend();
        // Clear frontend cache as well
        queryCache.clear();
      }
    }
  );

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cache? This may temporarily slow down the application.')) {
      setIsClearing(true);
      try {
        await clearCache();
      } finally {
        setIsClearing(false);
      }
    }
  };

  const calculateHitRate = (stats: CacheStats | null) => {
    if (!stats || (stats.hits + stats.misses) === 0) return 0;
    return (stats.hits / (stats.hits + stats.misses)) * 100;
  };

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-500';
    if (hitRate >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Monitor</h2>
          <p className="text-muted-foreground">
            Monitor and manage application cache performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchBackend()}
            disabled={backendLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${backendLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearCache}
            disabled={clearingCache || isClearing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Cache Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frontend Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Frontend Cache</span>
            </CardTitle>
            <CardDescription>
              Client-side query cache statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cache Size */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Cache Size</span>
                <span className="text-sm text-muted-foreground">
                  {frontendCacheStats.size} / {frontendCacheStats.maxSize}
                </span>
              </div>
              <Progress 
                value={(frontendCacheStats.size / frontendCacheStats.maxSize) * 100}
                className="h-2"
              />
            </div>

            {/* Pending Queries */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Pending Queries</span>
              </div>
              <Badge variant={frontendCacheStats.pendingQueries > 0 ? "secondary" : "outline"}>
                {frontendCacheStats.pendingQueries}
              </Badge>
            </div>

            {/* Hit Rate (placeholder - not implemented yet) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hit Rate</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {frontendCacheStats.hitRate.toFixed(1)}%
              </span>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryCache.clear()}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Frontend Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backend Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Backend Cache (Redis)</span>
            </CardTitle>
            <CardDescription>
              Server-side Redis cache statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {backendLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : backendCache?.cache ? (
              <>
                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Connection</span>
                  </div>
                  <Badge variant={backendCache.cache.connected ? "default" : "destructive"}>
                    {backendCache.cache.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                {/* Memory Usage */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm font-mono">
                    {backendCache.cache.memory}
                  </span>
                </div>

                {/* Key Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Cached Keys</span>
                  </div>
                  <Badge variant="outline">
                    {backendCache.cache.keys.toLocaleString()}
                  </Badge>
                </div>

                {/* Hit Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Hit Rate</span>
                    </div>
                    <span className={`text-sm font-mono ${getHitRateColor(calculateHitRate(backendCache.cache))}`}>
                      {calculateHitRate(backendCache.cache).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={calculateHitRate(backendCache.cache)}
                    className="h-2"
                  />
                </div>

                {/* Hit/Miss Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {backendCache.cache.hits.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Hits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {backendCache.cache.misses.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Misses</div>
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Redis cache is not available or not configured
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Optimization Tips</CardTitle>
          <CardDescription>
            Recommendations to improve cache performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Frontend Cache</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use longer TTL for static data</li>
                  <li>• Enable stale-while-revalidate for better UX</li>
                  <li>• Invalidate cache after mutations</li>
                  <li>• Monitor cache size vs hit rate</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Backend Cache</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Aim for &gt;80% hit rate</li>
                  <li>• Use appropriate TTL values</li>
                  <li>• Cache expensive database queries</li>
                  <li>• Monitor Redis memory usage</li>
                </ul>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    frontendCacheStats.size / frontendCacheStats.maxSize > 0.8 
                      ? 'text-red-500' 
                      : 'text-green-500'
                  }`}>
                    {((frontendCacheStats.size / frontendCacheStats.maxSize) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Frontend Usage</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getHitRateColor(
                    backendCache?.cache ? calculateHitRate(backendCache.cache) : 0
                  )}`}>
                    {backendCache?.cache ? calculateHitRate(backendCache.cache).toFixed(0) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Backend Hit Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    frontendCacheStats.pendingQueries > 5 
                      ? 'text-yellow-500' 
                      : 'text-green-500'
                  }`}>
                    {frontendCacheStats.pendingQueries}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending Queries</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}