'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Zap,
  Target
} from 'lucide-react';
import { useAgentMonitoring } from '@/hooks/use-agent-monitoring';

export function AgentMetricsDashboard() {
  const { 
    agentMetrics, 
    systemHealth,
    selectedTimeRange,
    isLoading,
    setSelectedTimeRange,
    refreshMetrics,
    exportExecutionHistory,
    getExecutionTrends
  } = useAgentMonitoring();

  const trends = getExecutionTrends();

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (value: number, type: 'cpu' | 'memory' | 'response' = 'cpu') => {
    if (type === 'response') {
      if (value < 1000) return 'text-green-600';
      if (value < 2000) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    if (value < 50) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              System Health & Performance
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMetrics}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-6 gap-6 mb-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(systemHealth.overallStatus)}`}>
                {systemHealth.overallStatus === 'healthy' && <CheckCircle className="h-4 w-4 mr-1" />}
                {systemHealth.overallStatus === 'warning' && <AlertTriangle className="h-4 w-4 mr-1" />}
                {systemHealth.overallStatus === 'critical' && <AlertTriangle className="h-4 w-4 mr-1" />}
                {systemHealth.overallStatus.charAt(0).toUpperCase() + systemHealth.overallStatus.slice(1)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Overall Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{systemHealth.activeAgents}/{systemHealth.totalAgents}</div>
              <div className="text-xs text-gray-600">Active Agents</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPerformanceColor(systemHealth.systemCpuUsage)}`}>
                {systemHealth.systemCpuUsage}%
              </div>
              <div className="text-xs text-gray-600">System CPU</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPerformanceColor(systemHealth.systemMemoryUsage, 'memory')}`}>
                {systemHealth.systemMemoryUsage}%
              </div>
              <div className="text-xs text-gray-600">System Memory</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPerformanceColor(systemHealth.averageResponseTime, 'response')}`}>
                {systemHealth.averageResponseTime}ms
              </div>
              <div className="text-xs text-gray-600">Avg Response</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{systemHealth.uptime}%</div>
              <div className="text-xs text-gray-600">Uptime</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Queue Size</span>
                <span className="font-medium">{systemHealth.queueSize} items</span>
              </div>
              <Progress value={Math.min((systemHealth.queueSize / 50) * 100, 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Throughput</span>
                <span className="font-medium">{systemHealth.throughput}/hour</span>
              </div>
              <Progress value={Math.min((systemHealth.throughput / 100) * 100, 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Error Rate</span>
                <span className="font-medium">{systemHealth.errorRate}%</span>
              </div>
              <Progress value={systemHealth.errorRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agentMetrics.map((metrics) => (
          <Card key={metrics.agentId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{metrics.agentName}</CardTitle>
                <Badge variant="outline" className={`${metrics.successRate > 90 ? 'text-green-700 bg-green-50' : metrics.successRate > 70 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'}`}>
                  {metrics.successRate}% Success
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{metrics.timeRange}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{metrics.totalExecutions}</div>
                  <div className="text-xs text-gray-600">Total Executions</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${getPerformanceColor(metrics.averageResponseTime, 'response')}`}>
                    {metrics.averageResponseTime}ms
                  </div>
                  <div className="text-xs text-gray-600">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{metrics.throughputPerHour.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">Per Hour</div>
                </div>
              </div>

              {/* Performance Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center">
                      <Cpu className="h-3 w-3 mr-1" />
                      CPU Usage
                    </span>
                    <span className={`font-medium ${getPerformanceColor(metrics.averageCpuUsage)}`}>
                      {metrics.averageCpuUsage}% (Peak: {metrics.peakCpuUsage}%)
                    </span>
                  </div>
                  <Progress value={metrics.averageCpuUsage} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center">
                      <MemoryStick className="h-3 w-3 mr-1" />
                      Memory Usage
                    </span>
                    <span className={`font-medium ${getPerformanceColor(metrics.averageMemoryUsage, 'memory')}`}>
                      {metrics.averageMemoryUsage}% (Peak: {metrics.peakMemoryUsage}%)
                    </span>
                  </div>
                  <Progress value={metrics.averageMemoryUsage} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      Success Rate
                    </span>
                    <span className="font-medium text-green-600">
                      {metrics.successfulExecutions}/{metrics.totalExecutions}
                    </span>
                  </div>
                  <Progress value={metrics.successRate} className="h-2" />
                </div>
              </div>

              {/* Most Common Tasks */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Most Common Tasks</h4>
                <div className="space-y-2">
                  {metrics.mostCommonTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{task.taskType.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{task.count}</span>
                        <span className="text-gray-500">({task.averageTime}ms avg)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Errors */}
              {metrics.recentErrors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                    Recent Errors ({metrics.recentErrors.length})
                  </h4>
                  <div className="space-y-2">
                    {metrics.recentErrors.slice(0, 2).map((error, index) => (
                      <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-200">
                        <div className="font-medium text-red-700">{error.taskType}</div>
                        <div className="text-red-600">{error.error}</div>
                        <div className="text-gray-500 mt-1">
                          {new Date(error.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution Trends */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Execution Trends (Last 24 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const trendData = trends.find(t => t.hour === hour);
                const total = trendData?.total || 0;
                const success = trendData?.success || 0;
                const failed = trendData?.failed || 0;
                const successRate = trendData?.successRate || 0;
                
                return (
                  <div key={hour} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{hour.toString().padStart(2, '0')}:00</div>
                    <div className="h-20 bg-gray-100 rounded relative overflow-hidden">
                      {total > 0 && (
                        <>
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-green-500 opacity-70"
                            style={{ height: `${(success / Math.max(...trends.map(t => t.total), 1)) * 100}%` }}
                          />
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-red-500 opacity-70"
                            style={{ 
                              height: `${(failed / Math.max(...trends.map(t => t.total), 1)) * 100}%`,
                              bottom: `${(success / Math.max(...trends.map(t => t.total), 1)) * 100}%`
                            }}
                          />
                        </>
                      )}
                    </div>
                    <div className="text-xs mt-1">
                      <div className="font-medium">{total}</div>
                      {total > 0 && (
                        <div className={`${successRate > 90 ? 'text-green-600' : successRate > 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {successRate}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-1" />
                <span>Successful Executions</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-1" />
                <span>Failed Executions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}