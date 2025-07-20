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

export default function SystemMonitoringPage() {
  const router = useRouter();
  const canAccessMonitoring = useCanAccessFeature()('monitoring:system');
  const { stats } = useUserProgressStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    timestamp: Date.now(),
    cpuUsage: 23.4,
    memoryUsage: 45.7,
    diskUsage: 62.1,
    networkLatency: 12.8
  });

  // Simulate real-time data updates
  useEffect(() => {
    if (!canAccessMonitoring) return;
    
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        timestamp: Date.now(),
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(80, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        diskUsage: Math.max(30, Math.min(95, prev.diskUsage + (Math.random() - 0.5) * 2)),
        networkLatency: Math.max(5, Math.min(50, prev.networkLatency + (Math.random() - 0.5) * 5))
      }));
    }, 3000);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
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

  // Mock system metrics
  const systemMetrics = {
    uptime: '15 days, 7 hours, 23 minutes',
    totalRequests: 1247890,
    successRate: 99.8,
    avgResponseTime: 142,
    activeUsers: 1247,
    dataProcessed: '2.4TB',
    lastBackup: '2 hours ago',
    securityAlerts: 0
  };

  const services = [
    { name: 'Frontend App', status: 'healthy', uptime: '99.9%', responseTime: '120ms', port: '3000' },
    { name: 'Backend API', status: 'healthy', uptime: '99.8%', responseTime: '89ms', port: '8000' },
    { name: 'Chat Service', status: 'healthy', uptime: '99.7%', responseTime: '156ms', port: '8001' },
    { name: 'AI Service', status: 'warning', uptime: '98.2%', responseTime: '340ms', port: '8002' },
    { name: 'PostgreSQL', status: 'healthy', uptime: '99.9%', responseTime: '23ms', port: '5432' },
    { name: 'Redis Cache', status: 'healthy', uptime: '99.9%', responseTime: '8ms', port: '6379' }
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      message: 'AI Service response time elevated',
      timestamp: '5 minutes ago',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      message: 'Scheduled backup completed successfully',
      timestamp: '2 hours ago',
      severity: 'low'
    },
    {
      id: 3,
      type: 'success',
      message: 'All security checks passed',
      timestamp: '6 hours ago',
      severity: 'low'
    }
  ];

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
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Circle className="h-3 w-3 mr-1 fill-current" />
            All Systems Operational
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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