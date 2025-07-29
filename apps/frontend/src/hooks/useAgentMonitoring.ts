/**
 * Agent Monitoring Hook
 * 
 * Custom hook for real-time agent monitoring with WebSocket integration,
 * performance metrics tracking, and alert management.
 */

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

export interface AgentStatus {
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
  healthChecks: {
    connectivity: 'pass' | 'fail' | 'warning'
    authentication: 'pass' | 'fail' | 'warning'
    dependencies: 'pass' | 'fail' | 'warning'
    performance: 'pass' | 'fail' | 'warning'
  }
  lastActivity: string
}

export interface TaskExecution {
  id: string
  agentId: string
  agentName: string
  taskType: string
  status: 'running' | 'completed' | 'failed' | 'queued'
  startTime: string
  duration: number
  error?: string
}

export interface MonitoringAlert {
  id: string
  agentId: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  resolved: boolean
}

export interface UseAgentMonitoringOptions {
  businessId: string
  autoRefresh?: boolean
  refreshInterval?: number
  realTimeUpdates?: boolean
}

export function useAgentMonitoring({
  businessId,
  autoRefresh = true,
  refreshInterval = 30000,
  realTimeUpdates = true
}: UseAgentMonitoringOptions) {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [recentTasks, setRecentTasks] = useState<TaskExecution[]>([])
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage } = useWebSocket()

  // Handle real-time WebSocket updates
  function handleRealtimeUpdate(data: any) {
    try {
      switch (data.type) {
        case 'agent_metrics_update':
          updateAgentMetrics(data.payload)
          break
        case 'task_execution_update':
          updateTaskExecution(data.payload)
          break
        case 'new_alert':
          addAlert(data.payload)
          break
        case 'alert_resolved':
          resolveAlert(data.payload.alertId)
          break
        default:
          console.log('Unknown real-time update:', data)
      }
    } catch (err) {
      console.error('Error processing real-time update:', err)
    }
  }

  // Update agent metrics from real-time data
  const updateAgentMetrics = useCallback((metricsUpdate: Partial<AgentStatus> & { id: string }) => {
    setAgents(prev => prev.map(agent => 
      agent.id === metricsUpdate.id 
        ? { ...agent, ...metricsUpdate, lastActivity: new Date().toISOString() }
        : agent
    ))
    setLastUpdated(new Date())
  }, [])

  // Update task execution from real-time data
  const updateTaskExecution = useCallback((taskUpdate: Partial<TaskExecution> & { id: string }) => {
    setRecentTasks(prev => {
      const existing = prev.find(task => task.id === taskUpdate.id)
      if (existing) {
        return prev.map(task => 
          task.id === taskUpdate.id ? { ...task, ...taskUpdate } : task
        )
      } else {
        // New task, add to beginning
        return [taskUpdate as TaskExecution, ...prev.slice(0, 49)]
      }
    })
  }, [])

  // Add new alert
  const addAlert = useCallback((alert: MonitoringAlert) => {
    setAlerts(prev => [alert, ...prev])
  }, [])

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }, [])

  // Fetch initial monitoring data
  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null)
      
      const [agentsResponse, tasksResponse, alertsResponse] = await Promise.all([
        fetch(`/api/monitoring/businesses/${businessId}/agents/metrics`),
        fetch(`/api/monitoring/businesses/${businessId}/agents/tasks?limit=20`),
        fetch(`/api/monitoring/businesses/${businessId}/agents/alerts`)
      ])

      if (!agentsResponse.ok || !tasksResponse.ok || !alertsResponse.ok) {
        throw new Error('Failed to fetch monitoring data')
      }

      const [agentsData, tasksData, alertsData] = await Promise.all([
        agentsResponse.json(),
        tasksResponse.json(),
        alertsResponse.json()
      ])

      if (agentsData.success) setAgents(agentsData.data)
      if (tasksData.success) setRecentTasks(tasksData.data)
      if (alertsData.success) setAlerts(alertsData.data)

      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  // Manual refresh
  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchMonitoringData()
  }, [fetchMonitoringData])

  // Get monitoring summary
  const getSummary = useCallback(() => {
    const activeAgents = agents.filter(a => a.status === 'active').length
    const totalTasks = agents.reduce((sum, a) => sum + a.performance.tasksCompleted, 0)
    const avgSuccessRate = agents.length > 0 
      ? agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length
      : 0
    const criticalAlerts = alerts.filter(a => !a.resolved && a.severity === 'critical').length
    const healthyAgents = agents.filter(a => 
      a.healthChecks.connectivity === 'pass' && 
      a.healthChecks.authentication === 'pass'
    ).length

    return {
      totalAgents: agents.length,
      activeAgents,
      healthyAgents,
      totalTasks,
      avgSuccessRate,
      activeAlerts: alerts.filter(a => !a.resolved).length,
      criticalAlerts,
      runningTasks: recentTasks.filter(t => t.status === 'running').length
    }
  }, [agents, alerts, recentTasks])

  // Get agent by ID
  const getAgent = useCallback((agentId: string) => {
    return agents.find(a => a.id === agentId)
  }, [agents])

  // Resolve alert API call
  const resolveAlertAPI = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      resolveAlert(alertId)
    } catch (err) {
      console.error('Error resolving alert:', err)
      throw err
    }
  }, [resolveAlert])

  // Subscribe to real-time updates on WebSocket connection
  useEffect(() => {
    if (isConnected && realTimeUpdates) {
      sendMessage('subscribe_monitoring', { businessId })

      return () => {
        sendMessage('unsubscribe_monitoring', { businessId })
      }
    }
  }, [isConnected, realTimeUpdates, businessId, sendMessage])

  // Initial data fetch
  useEffect(() => {
    fetchMonitoringData()
  }, [fetchMonitoringData])

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && !realTimeUpdates) {
      const interval = setInterval(fetchMonitoringData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, realTimeUpdates, refreshInterval, fetchMonitoringData])

  return {
    // Data
    agents,
    recentTasks,
    alerts,
    summary: getSummary(),
    
    // State
    loading,
    error,
    lastUpdated,
    isConnected,
    
    // Actions
    refresh,
    getAgent,
    resolveAlert: resolveAlertAPI,
    
    // Configuration
    realTimeUpdates,
    autoRefresh
  }
}