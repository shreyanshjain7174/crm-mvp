'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Monitor, 
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Database,
  Zap
} from 'lucide-react';
import { useAgentMonitoring } from '@/hooks/use-agent-monitoring';
import { useAIAgents } from '@/hooks/use-ai-agents';

export function SystemMonitoring() {
  const { systemHealth } = useAgentMonitoring();
  const { agents, stats: agentStats, isConnected } = useAIAgents();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (value: number, thresholds = { warning: 70, critical: 90 }) => {
    if (value < thresholds.warning) return 'text-green-600';
    if (value < thresholds.critical) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAgentHealth = () => {
    const errorAgents = agents.filter(agent => agent.errorCount > 5).length;
    const highCpuAgents = agents.filter(agent => agent.performance.cpu > 80).length;
    const highMemoryAgents = agents.filter(agent => agent.performance.memory > 80).length;
    
    if (errorAgents > 2 || highCpuAgents > 2 || highMemoryAgents > 2) return 'critical';
    if (errorAgents > 0 || highCpuAgents > 0 || highMemoryAgents > 0) return 'warning';
    return 'healthy';
  };

  const agentHealthStatus = getAgentHealth();

  // Mock additional system metrics
  const diskUsage = 45;
  const networkLatency = 12;
  const databaseConnections = 23;
  const redisMemory = 67;

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="mr-2 h-5 w-5" />
            System Status Overview
            <div className={`ml-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            {/* Overall System Health */}
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(systemHealth.overallStatus)}
              </div>
              <Badge variant="outline" className={`mb-2 ${getStatusColor(systemHealth.overallStatus)}`}>
                {systemHealth.overallStatus.charAt(0).toUpperCase() + systemHealth.overallStatus.slice(1)}
              </Badge>
              <div className="text-sm text-gray-600">System Health</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{systemHealth.uptime}%</div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>

            {/* Agent Health */}
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(agentHealthStatus)}
              </div>
              <Badge variant="outline" className={`mb-2 ${getStatusColor(agentHealthStatus)}`}>
                {agentHealthStatus.charAt(0).toUpperCase() + agentHealthStatus.slice(1)}
              </Badge>
              <div className="text-sm text-gray-600">Agent Health</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{agentStats.activeAgents}/{agentStats.totalAgents}</div>
              <div className="text-xs text-gray-500">Active Agents</div>
            </div>

            {/* Performance */}
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 mb-2">Performance</div>
              <div className={`text-lg font-bold ${getPerformanceColor(systemHealth.averageResponseTime, { warning: 1500, critical: 2500 })}`}>
                {systemHealth.averageResponseTime}ms
              </div>
              <div className="text-xs text-gray-500">Avg Response</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{systemHealth.throughput}</div>
              <div className="text-xs text-gray-500">Tasks/Hour</div>
            </div>

            {/* Queue Status */}
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 mb-2">Queue Status</div>
              <div className="text-lg font-bold text-gray-900">{systemHealth.queueSize}</div>
              <div className="text-xs text-gray-500">Pending Tasks</div>
              <div className={`text-lg font-bold mt-1 ${getPerformanceColor(systemHealth.errorRate, { warning: 5, critical: 10 })}`}>
                {systemHealth.errorRate}%
              </div>
              <div className="text-xs text-gray-500">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Monitoring */}
      <div className="grid grid-cols-2 gap-6">
        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* CPU Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Cpu className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className={`text-sm font-bold ${getPerformanceColor(systemHealth.systemCpuUsage)}`}>
                  {systemHealth.systemCpuUsage}%
                </span>
              </div>
              <Progress value={systemHealth.systemCpuUsage} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                8 cores, 3.2 GHz average
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <MemoryStick className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className={`text-sm font-bold ${getPerformanceColor(systemHealth.systemMemoryUsage)}`}>
                  {systemHealth.systemMemoryUsage}%
                </span>
              </div>
              <Progress value={systemHealth.systemMemoryUsage} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                14.2 GB used of 32 GB total
              </div>
            </div>

            {/* Disk Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <span className={`text-sm font-bold ${getPerformanceColor(diskUsage)}`}>
                  {diskUsage}%
                </span>
              </div>
              <Progress value={diskUsage} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                450 GB used of 1 TB total
              </div>
            </div>

            {/* Network */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Network className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Network Latency</span>
                </div>
                <span className={`text-sm font-bold ${getPerformanceColor(networkLatency, { warning: 20, critical: 50 })}`}>
                  {networkLatency}ms
                </span>
              </div>
              <Progress value={(networkLatency / 100) * 100} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                External API response time
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Service Health
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Database */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">PostgreSQL</div>
                  <div className="text-xs text-gray-500">{databaseConnections} active connections</div>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Healthy
                </Badge>
              </div>
            </div>

            {/* Redis */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <MemoryStick className="h-4 w-4 mr-3 text-red-600" />
                <div>
                  <div className="font-medium">Redis Cache</div>
                  <div className="text-xs text-gray-500">{redisMemory}% memory usage</div>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Healthy
                </Badge>
              </div>
            </div>

            {/* LangGraph Service */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-3 text-purple-600" />
                <div>
                  <div className="font-medium">LangGraph Engine</div>
                  <div className="text-xs text-gray-500">Workflow orchestration</div>
                </div>
              </div>
              <div className="flex items-center">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      Disconnected
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* OpenAI API */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-3 text-green-600" />
                <div>
                  <div className="font-medium">OpenAI API</div>
                  <div className="text-xs text-gray-500">GPT-4o model access</div>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Operational
                </Badge>
              </div>
            </div>

            {/* WhatsApp API */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Network className="h-4 w-4 mr-3 text-green-600" />
                <div>
                  <div className="font-medium">WhatsApp API</div>
                  <div className="text-xs text-gray-500">360dialog integration</div>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            System Alerts & Warnings
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {systemHealth.systemCpuUsage > 80 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-3" />
                <div>
                  <div className="font-medium text-yellow-800">High CPU Usage</div>
                  <div className="text-sm text-yellow-700">System CPU usage is at {systemHealth.systemCpuUsage}%</div>
                </div>
              </div>
            )}
            
            {systemHealth.queueSize > 30 && (
              <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600 mr-3" />
                <div>
                  <div className="font-medium text-orange-800">High Queue Size</div>
                  <div className="text-sm text-orange-700">Task queue has {systemHealth.queueSize} pending items</div>
                </div>
              </div>
            )}
            
            {systemHealth.errorRate > 10 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-3" />
                <div>
                  <div className="font-medium text-red-800">High Error Rate</div>
                  <div className="text-sm text-red-700">Error rate is at {systemHealth.errorRate}% - investigate failing tasks</div>
                </div>
              </div>
            )}
            
            {agentStats.totalErrors > 20 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-3" />
                <div>
                  <div className="font-medium text-red-800">Multiple Agent Errors</div>
                  <div className="text-sm text-red-700">Agents have accumulated {agentStats.totalErrors} errors total</div>
                </div>
              </div>
            )}

            {systemHealth.overallStatus === 'healthy' && 
             systemHealth.systemCpuUsage <= 80 && 
             systemHealth.queueSize <= 30 && 
             systemHealth.errorRate <= 10 && 
             agentStats.totalErrors <= 20 && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-green-800">All Systems Operational</div>
                  <div className="text-sm text-green-700">No alerts or warnings detected. System is running smoothly.</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}