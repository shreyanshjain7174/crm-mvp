'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Clock, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { useCachedQuery, useCacheStats } from '@/hooks/useCachedQuery';
import { formatDate } from '@/lib/utils';

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  slowestQueries: Array<{
    query: string;
    duration: number;
    timestamp: string;
    route: string;
  }>;
  cacheHitRate: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: number;
  timestamp: string;
}

interface RouteMetric {
  route: string;
  method: string;
  count: number;
  totalTime: number;
  averageTime: number;
  errorCount: number;
  lastAccessed: string;
}

export function PerformanceMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Fetch performance data
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    refetch: refetchMetrics 
  } = useCachedQuery<{ metrics: PerformanceMetrics }>(
    'performance-metrics',
    () => fetch('/api/performance/metrics').then(res => res.json()),
    { 
      ttl: 30000, // 30 seconds
      refetchInterval: autoRefresh ? 30000 : undefined
    }
  );

  const { 
    data: routeMetrics, 
    isLoading: routesLoading 
  } = useCachedQuery<{ routes: RouteMetric[] }>(
    'performance-routes',
    () => fetch('/api/performance/routes').then(res => res.json()),
    { ttl: 60000 } // 1 minute
  );

  const { 
    data: alerts, 
    isLoading: alertsLoading 
  } = useCachedQuery<{ alerts: string[] }>(
    'performance-alerts',
    () => fetch('/api/performance/alerts').then(res => res.json()),
    { ttl: 30000 }
  );

  const cacheStats = useCacheStats();

  const handleRefresh = () => {
    refetchMetrics();
  };

  const formatBytes = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  const getPerformanceStatus = (averageResponseTime: number, errorRate: number) => {
    if (errorRate > 5 || averageResponseTime > 2000) {
      return { status: 'critical', color: 'destructive', icon: AlertTriangle };
    }
    if (errorRate > 2 || averageResponseTime > 1000) {
      return { status: 'warning', color: 'warning', icon: AlertTriangle };
    }
    return { status: 'healthy', color: 'success', icon: CheckCircle };
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  const performanceData = metrics?.metrics;
  if (!performanceData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load performance metrics. Please check your connection.
        </AlertDescription>
      </Alert>
    );
  }

  const { status, color, icon: StatusIcon } = getPerformanceStatus(
    performanceData.averageResponseTime,
    performanceData.errorRate
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-muted-foreground">
            Real-time application performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={metricsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts?.alerts && alerts.alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {alerts.alerts.map((alert, index) => (
                <div key={index}>{alert}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <StatusIcon className={`h-4 w-4 ${
              status === 'healthy' ? 'text-green-500' : 
              status === 'warning' ? 'text-yellow-500' : 
              'text-red-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{status}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: {formatDate(performanceData.timestamp)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.averageResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceData.requestCount} total requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.cacheHitRate.toFixed(1)}%
            </div>
            <Progress 
              value={performanceData.cacheHitRate} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(performanceData.memoryUsage.heapUsed)}
            </div>
            <p className="text-xs text-muted-foreground">
              / {formatBytes(performanceData.memoryUsage.heapTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes">Route Performance</TabsTrigger>
          <TabsTrigger value="queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="cache">Cache Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Performance</CardTitle>
              <CardDescription>
                Performance metrics for each API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading route metrics...
                </div>
              ) : (
                <div className="space-y-2">
                  {routeMetrics?.routes.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{route.method}</Badge>
                          <span className="font-mono text-sm">{route.route}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {route.count} requests • Last: {formatDate(route.lastAccessed)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-right">
                          <div className="font-medium">{route.averageTime.toFixed(0)}ms</div>
                          <div className="text-xs text-muted-foreground">avg</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${route.errorCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {route.errorCount}
                          </div>
                          <div className="text-xs text-muted-foreground">errors</div>
                        </div>
                        {route.averageTime > 1000 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Queries</CardTitle>
              <CardDescription>
                Database queries that took longer than expected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {performanceData.slowestQueries.map((query, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={query.duration > 2000 ? 'destructive' : 'secondary'}>
                        {query.duration}ms
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(query.timestamp)}
                      </span>
                    </div>
                    <div className="font-mono text-xs bg-muted p-2 rounded">
                      {query.query}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Route: {query.route}
                    </div>
                  </div>
                ))}
                {performanceData.slowestQueries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    No slow queries detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Frontend Cache</CardTitle>
                <CardDescription>Query cache statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Cache Size</span>
                  <span>{cacheStats.size} / {cacheStats.maxSize}</span>
                </div>
                <Progress value={(cacheStats.size / cacheStats.maxSize) * 100} />
                
                <div className="flex justify-between">
                  <span>Pending Queries</span>
                  <span>{cacheStats.pendingQueries}</span>
                </div>

                <div className="flex justify-between">
                  <span>Hit Rate</span>
                  <span>{cacheStats.hitRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backend Cache</CardTitle>
                <CardDescription>Redis cache performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Hit Rate</span>
                  <span>{performanceData.cacheHitRate.toFixed(1)}%</span>
                </div>
                <Progress value={performanceData.cacheHitRate} />

                <div className="flex justify-between">
                  <span>Error Rate</span>
                  <span className={performanceData.errorRate > 5 ? 'text-red-500' : 'text-green-500'}>
                    {performanceData.errorRate.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Active Connections</span>
                  <span>{performanceData.activeConnections}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}