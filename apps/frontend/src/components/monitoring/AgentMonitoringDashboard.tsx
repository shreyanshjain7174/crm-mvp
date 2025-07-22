/**
 * Agent Monitoring Dashboard
 * 
 * Real-time monitoring dashboard for AI agents including performance metrics,
 * health checks, task execution tracking, and error monitoring.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bot,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Circle,
  AlertCircle,
  Info,
  MessageSquare,
  Phone,
  Database,
  Cpu,
  Timer,
  BarChart3,
  Eye,
  Settings,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Loader
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentMetrics {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'error' | 'maintenance'
  performance: {
    successRate: number
    avgResponseTime: number
    tasksCompleted: number
    tasksPerMinute: number
    errorRate: number
    uptime: number
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
    concurrentTasks: number
    maxConcurrentTasks: number
  }
  lastActivity: string
  healthChecks: {
    connectivity: 'pass' | 'fail' | 'warning'
    authentication: 'pass' | 'fail' | 'warning'
    dependencies: 'pass' | 'fail' | 'warning'
    performance: 'pass' | 'fail' | 'warning'
  }
}

interface TaskExecution {
  id: string
  agentId: string
  agentName: string
  taskType: string
  status: 'running' | 'completed' | 'failed' | 'queued'
  startTime: string
  duration: number
  input?: any
  output?: any
  error?: string
}

interface AgentMonitoringProps {
  businessId: string
}

export function AgentMonitoringDashboard({ businessId }: AgentMonitoringProps) {
  const [agents, setAgents] = useState<AgentMetrics[]>([])
  const [recentTasks, setRecentTasks] = useState<TaskExecution[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [realTimeUpdates, setRealTimeUpdates] = useState(true)
  const [loading, setLoading] = useState(true)

  const loadAgentMetrics = useCallback(async () => {
    // Mock data for development - replace with actual API calls  
    // Note: businessId will be used in actual API call
    const mockAgents: AgentMetrics[] = [
      {
        id: 'cozmox-voice-agent',
        name: 'Cozmox Voice Assistant',
        type: 'voice',
        status: 'active',
        performance: {
          successRate: 94.2,
          avgResponseTime: 1240,
          tasksCompleted: 127,
          tasksPerMinute: 2.3,
          errorRate: 5.8,
          uptime: 99.1
        },
        resources: {
          cpuUsage: 23.4,
          memoryUsage: 456,
          concurrentTasks: 3,
          maxConcurrentTasks: 10
        },
        lastActivity: '2 minutes ago',
        healthChecks: {
          connectivity: 'pass',
          authentication: 'pass',
          dependencies: 'warning',
          performance: 'pass'
        }
      },
      {
        id: 'whatsapp-ai-responder',
        name: 'WhatsApp AI Responder',
        type: 'messaging',
        status: 'active',
        performance: {
          successRate: 98.7,
          avgResponseTime: 340,
          tasksCompleted: 412,
          tasksPerMinute: 8.7,
          errorRate: 1.3,
          uptime: 99.8
        },
        resources: {
          cpuUsage: 12.8,
          memoryUsage: 234,
          concurrentTasks: 7,
          maxConcurrentTasks: 20
        },
        lastActivity: '30 seconds ago',
        healthChecks: {
          connectivity: 'pass',
          authentication: 'pass',
          dependencies: 'pass',
          performance: 'pass'
        }
      },
      {
        id: 'data-enricher',
        name: 'Contact Data Enricher',
        type: 'data',
        status: 'idle',
        performance: {
          successRate: 87.4,
          avgResponseTime: 2100,
          tasksCompleted: 89,
          tasksPerMinute: 0.8,
          errorRate: 12.6,
          uptime: 96.2
        },
        resources: {
          cpuUsage: 8.2,
          memoryUsage: 145,
          concurrentTasks: 0,
          maxConcurrentTasks: 5
        },
        lastActivity: '15 minutes ago',
        healthChecks: {
          connectivity: 'pass',
          authentication: 'warning',
          dependencies: 'pass',
          performance: 'warning'
        }
      }
    ]

    const mockTasks: TaskExecution[] = [
      {
        id: '1',
        agentId: 'cozmox-voice-agent',
        agentName: 'Cozmox Voice Assistant',
        taskType: 'make_call',
        status: 'running',
        startTime: '2024-07-22T14:30:00Z',
        duration: 45000,
        input: { phoneNumber: '+91XXXXXXXXXX', purpose: 'lead_qualification' }
      },
      {
        id: '2',
        agentId: 'whatsapp-ai-responder',
        agentName: 'WhatsApp AI Responder',
        taskType: 'send_message',
        status: 'completed',
        startTime: '2024-07-22T14:32:00Z',
        duration: 1200,
        output: { messagesSent: 3, responseGenerated: true }
      },
      {
        id: '3',
        agentId: 'data-enricher',
        agentName: 'Contact Data Enricher',
        taskType: 'enrich_contact',
        status: 'failed',
        startTime: '2024-07-22T14:25:00Z',
        duration: 5000,
        error: 'API rate limit exceeded'
      }
    ]

    await new Promise(resolve => setTimeout(resolve, 600))
    setAgents(mockAgents)
    setRecentTasks(mockTasks)
  }, []) // businessId will be used when implementing actual API calls

  useEffect(() => {
    loadAgentMetrics()
    setLoading(false)
  }, [loadAgentMetrics])

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return

    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        performance: {
          ...agent.performance,
          tasksPerMinute: Math.max(0, agent.performance.tasksPerMinute + (Math.random() - 0.5) * 2),
          avgResponseTime: Math.max(100, agent.performance.avgResponseTime + (Math.random() - 0.5) * 200)
        },
        resources: {
          ...agent.resources,
          cpuUsage: Math.max(5, Math.min(50, agent.resources.cpuUsage + (Math.random() - 0.5) * 10)),
          memoryUsage: Math.max(50, Math.min(800, agent.resources.memoryUsage + (Math.random() - 0.5) * 50)),
          concurrentTasks: Math.max(0, Math.min(agent.resources.maxConcurrentTasks, agent.resources.concurrentTasks + Math.floor((Math.random() - 0.5) * 3)))
        }
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [realTimeUpdates])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAgentMetrics()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'idle': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'maintenance': return <Settings className="h-4 w-4 text-blue-500" />
      default: return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getHealthIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'fail': return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const filteredAgents = selectedAgent === 'all' ? agents : agents.filter(a => a.id === selectedAgent)
  const overallStats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    avgSuccessRate: agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length,
    totalTasks: agents.reduce((sum, a) => sum + a.performance.tasksCompleted, 0)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Agent Monitoring</h1>
            <p className="text-gray-600">Real-time monitoring of your AI workforce</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
            className={realTimeUpdates ? 'text-green-600 border-green-200' : ''}
          >
            <Circle className={cn('h-3 w-3 mr-2', realTimeUpdates ? 'fill-green-500 text-green-500' : 'text-gray-400')} />
            Real-time
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{overallStats.activeAgents}/{overallStats.totalAgents}</div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{overallStats.avgSuccessRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Avg Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{overallStats.totalTasks}</div>
                <div className="text-sm text-gray-600">Tasks Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {filteredAgents.reduce((sum, a) => sum + a.performance.tasksPerMinute, 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Tasks/Min</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredAgents.map(agent => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    agent.type === 'voice' ? 'bg-blue-100' :
                    agent.type === 'messaging' ? 'bg-green-100' :
                    'bg-purple-100'
                  )}>
                    {agent.type === 'voice' ? <Phone className="w-5 h-5 text-blue-600" /> :
                     agent.type === 'messaging' ? <MessageSquare className="w-5 h-5 text-green-600" /> :
                     <Database className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(agent.status)}
                      <span className="text-sm text-gray-600 capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Success Rate</div>
                  <div className="font-semibold text-green-600">{agent.performance.successRate}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg Response</div>
                  <div className="font-semibold">{agent.performance.avgResponseTime}ms</div>
                </div>
                <div>
                  <div className="text-gray-600">Tasks/Min</div>
                  <div className="font-semibold">{agent.performance.tasksPerMinute.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Uptime</div>
                  <div className="font-semibold">{agent.performance.uptime}%</div>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU Usage</span>
                  <span>{agent.resources.cpuUsage}%</span>
                </div>
                <Progress value={agent.resources.cpuUsage} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>Active Tasks</span>
                  <span>{agent.resources.concurrentTasks}/{agent.resources.maxConcurrentTasks}</span>
                </div>
                <Progress value={(agent.resources.concurrentTasks / agent.resources.maxConcurrentTasks) * 100} className="h-2" />
              </div>

              {/* Health Checks */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-1">
                  {getHealthIcon(agent.healthChecks.connectivity)}
                  <span>Connectivity</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getHealthIcon(agent.healthChecks.authentication)}
                  <span>Auth</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getHealthIcon(agent.healthChecks.dependencies)}
                  <span>Deps</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getHealthIcon(agent.healthChecks.performance)}
                  <span>Perf</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-2">
                Last activity: {agent.lastActivity}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Task Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Task Executions</CardTitle>
          <CardDescription>Live feed of agent task executions and results</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {task.status === 'running' && <Loader className="h-4 w-4 animate-spin text-blue-500" />}
                    {task.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {task.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {task.status === 'queued' && <Clock className="h-4 w-4 text-yellow-500" />}
                    
                    <div>
                      <div className="font-medium">{task.agentName}</div>
                      <div className="text-sm text-gray-600">{task.taskType.replace('_', ' ')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{(task.duration / 1000).toFixed(1)}s</div>
                    <div className="text-gray-500">Duration</div>
                  </div>
                  
                  <Badge className={cn(
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  )}>
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}