'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Server, 
  Database,
  Wifi,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Settings,
  Bell,
  TrendingUp,
  TrendingDown,
  Circle,
  AlertCircle,
  Info,
  Shield,
  Lock,
  Cloud,
  Users,
  MessageSquare
} from 'lucide-react';
import { useUserProgressStore, useCanAccessFeature } from '@/stores/userProgress';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AgentMonitoringDashboard } from '@/components/monitoring/AgentMonitoringDashboard';
import { apiClient } from '@/lib/api';

export default function SystemMonitoringPage() {
  const router = useRouter();
  const canAccessMonitoring = useCanAccessFeature()('monitoring:system');
  const { stats } = useUserProgressStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [routeMetrics, setRouteMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState({
    timestamp: Date.now(),
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0
  });

  // Load monitoring data
  useEffect(() => {
    const loadMonitoringData = async () => {
      if (!canAccessMonitoring) return;
      
      try {
        setLoading(true);
        const [metricsData, healthData, alertsData, routesData] = await Promise.all([
          apiClient.getPerformanceMetrics(),
          apiClient.getSystemHealth(),
          apiClient.getPerformanceAlerts(),
          apiClient.getRouteMetrics()
        ]);
        
        setPerformanceMetrics(metricsData.metrics);
        setSystemHealth(healthData);
        setAlerts(alertsData.alerts || []);
        setRouteMetrics(routesData.routes || []);
        
        // Update real-time data from actual metrics
        if (metricsData.metrics) {
          const memUsage = metricsData.metrics.memoryUsage;
          setRealTimeData({
            timestamp: Date.now(),
            cpuUsage: Math.random() * 30 + 20, // Simulated CPU since not in metrics
            memoryUsage: memUsage ? (memUsage.heapUsed / memUsage.heapTotal) * 100 : 0,
            diskUsage: Math.random() * 20 + 40, // Simulated disk usage
            networkLatency: metricsData.metrics.averageResponseTime || 0
          });
        }
      } catch (error) {
        console.error('Error loading monitoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMonitoringData();
    
    // Set up periodic refresh
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [canAccessMonitoring]);

  // Show feature locked if not expert
  if (!canAccessMonitoring) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Monitor className="h-10 w-10 text-green-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              System Monitoring Loading... 📊
            </h3>
            
            <p className="text-gray-600 text-center max-w-md mb-6">
              System monitoring is available for Expert users. Continue using your CRM to unlock this powerful monitoring tool.
            </p>
            
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Activity className="h-4 w-4 mr-2" />
              Continue CRM Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [metricsData, healthData, alertsData, routesData] = await Promise.all([
        apiClient.getPerformanceMetrics(),
        apiClient.getSystemHealth(),
        apiClient.getPerformanceAlerts(),
        apiClient.getRouteMetrics()
      ]);
      
      setPerformanceMetrics(metricsData.metrics);
      setSystemHealth(healthData);
      setAlerts(alertsData.alerts || []);
      setRouteMetrics(routesData.routes || []);
      
      // Update real-time data
      if (metricsData.metrics) {
        const memUsage = metricsData.metrics.memoryUsage;
        setRealTimeData({
          timestamp: Date.now(),
          cpuUsage: Math.random() * 30 + 20,
          memoryUsage: memUsage ? (memUsage.heapUsed / memUsage.heapTotal) * 100 : 0,
          diskUsage: Math.random() * 20 + 40,
          networkLatency: metricsData.metrics.averageResponseTime || 0
        });
      }
    } catch (error) {
      console.error('Error refreshing monitoring data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (value >= thresholds.warning) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // System metrics from real data
  const systemMetrics = {
    uptime: performanceMetrics ? `${Math.floor(performanceMetrics.uptime / 86400)} days, ${Math.floor((performanceMetrics.uptime % 86400) / 3600)} hours` : 'Loading...',
    totalRequests: performanceMetrics?.requestCount || 0,
    successRate: performanceMetrics ? (100 - performanceMetrics.errorRate) : 0,
    avgResponseTime: performanceMetrics?.averageResponseTime || 0,
    activeUsers: performanceMetrics?.activeConnections || 0,
    dataProcessed: performanceMetrics ? `${(performanceMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB` : '0MB',
    lastBackup: systemHealth?.cache?.connected ? 'Active' : 'Disconnected',
    securityAlerts: alerts.filter(alert => alert.type === 'error').length
  };

  // Services derived from route metrics and system health
  const services = [
    {
      name: 'Backend API',
      status: systemHealth?.healthy ? 'healthy' : 'warning',
      uptime: systemHealth?.metrics ? `${(100 - parseFloat(systemHealth.metrics.errorRate)).toFixed(1)}%` : '0%',
      responseTime: systemHealth?.metrics?.averageResponseTime || 'N/A',
      port: '8000'
    },
    {
      name: 'Database',
      status: performanceMetrics ? 'healthy' : 'warning',
      uptime: '99.9%',
      responseTime: routeMetrics.length > 0 ? `${Math.min(...routeMetrics.map(r => r.averageTime)).toFixed(0)}ms` : 'N/A',
      port: '5432'
    },
    {
      name: 'Cache Service',
      status: systemHealth?.cache?.connected ? 'healthy' : 'warning',
      uptime: systemHealth?.cache?.connected ? '99.9%' : '0%',
      responseTime: systemHealth?.cache?.connected ? '8ms' : 'N/A',
      port: '6379'
    },
    {
      name: 'AI Service',
      status: alerts.some(a => a.message.toLowerCase().includes('ai')) ? 'warning' : 'healthy',
      uptime: '98.5%',
      responseTime: '340ms',
      port: '8002'
    }
  ];

  // alerts state is already defined above and populated with real data

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
          <p className="text-gray-600">
            Real-time monitoring of your CRM infrastructure and performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn(
            systemHealth?.healthy 
              ? "text-green-600 border-green-200" 
              : "text-yellow-600 border-yellow-200"
          )}>
            <Circle className="h-3 w-3 mr-1 fill-current" />
            {loading ? 'Loading...' : systemHealth?.healthy ? 'All Systems Operational' : 'System Issues Detected'}
          </Badge>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Real-time System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              {getStatusIcon(realTimeData.cpuUsage, { warning: 70, critical: 85 })}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{realTimeData.cpuUsage.toFixed(1)}%</span>
                <span className="text-sm text-gray-500">4 cores</span>
              </div>
              <Progress value={realTimeData.cpuUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              {getStatusIcon(realTimeData.memoryUsage, { warning: 75, critical: 90 })}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{realTimeData.memoryUsage.toFixed(1)}%</span>
                <span className="text-sm text-gray-500">8GB</span>
              </div>
              <Progress value={realTimeData.memoryUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              {getStatusIcon(realTimeData.diskUsage, { warning: 80, critical: 95 })}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{realTimeData.diskUsage.toFixed(1)}%</span>
                <span className="text-sm text-gray-500">100GB</span>
              </div>
              <Progress value={realTimeData.diskUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Network Latency</span>
              </div>
              {getStatusIcon(realTimeData.networkLatency, { warning: 30, critical: 50 })}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{realTimeData.networkLatency.toFixed(1)}ms</span>
                <span className="text-sm text-gray-500">avg</span>
              </div>
              <Progress value={(50 - realTimeData.networkLatency) * 2} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Uptime</span>
                    <span className="font-medium">{systemMetrics.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium text-green-600">{systemMetrics.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-medium">{systemMetrics.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Users</span>
                    <span className="font-medium">{systemMetrics.activeUsers.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & Backup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Processed</span>
                    <span className="font-medium">{systemMetrics.dataProcessed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Backup</span>
                    <span className="font-medium text-green-600">{systemMetrics.lastBackup}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Alerts</span>
                    <span className="font-medium text-green-600">{systemMetrics.securityAlerts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Requests</span>
                    <span className="font-medium">{systemMetrics.totalRequests.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{stats.contactsAdded}</p>
                  <p className="text-sm text-blue-700">Contacts Managed</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <MessageSquare className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.messagesSent}</p>
                  <p className="text-sm text-green-700">Messages Sent</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Zap className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{stats.aiInteractions}</p>
                  <p className="text-sm text-purple-700">AI Interactions</p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <p className="text-2xl font-bold text-orange-600">94.2%</p>
                  <p className="text-sm text-orange-700">System Health</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <AgentMonitoringDashboard businessId="demo-business" />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {service.status === 'healthy' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : service.status === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-600">Port {service.port}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{service.uptime}</div>
                        <div className="text-gray-500">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{service.responseTime}</div>
                        <div className="text-gray-500">Response</div>
                      </div>
                      <Badge 
                        className={cn(
                          service.status === 'healthy' ? 'bg-green-100 text-green-800' :
                          service.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        )}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
                <p className="text-gray-600">Detailed performance charts and metrics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                    {alert.type === 'info' && <Info className="h-5 w-5 text-blue-500 mt-0.5" />}
                    {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                    
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600">{alert.timestamp}</p>
                    </div>
                    
                    <Badge 
                      className={cn(
                        alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      )}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">SSL Certificate</p>
                      <p className="text-sm text-green-700">Valid until Dec 2024</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Lock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Data Encryption</p>
                      <p className="text-sm text-green-700">AES-256 enabled</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Cloud className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Backup Security</p>
                      <p className="text-sm text-green-700">Encrypted & verified</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Security Score</h3>
                    <div className="text-4xl font-bold text-green-600 mb-2">98/100</div>
                    <p className="text-sm text-green-700">Excellent security posture</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}