'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';

export interface AgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  taskType: string;
  taskName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  input: any;
  output?: any;
  error?: string;
  metadata: {
    workflowId?: string;
    workflowExecutionId?: string;
    stepId?: string;
    retryCount: number;
    maxRetries: number;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    tags: string[];
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    throughput: number;
  };
  context: {
    leadId?: string;
    messageId?: string;
    userId?: string;
    businessId?: string;
    sessionId?: string;
    workflowId?: string;
  };
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  timeRange: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageResponseTime: number;
  totalProcessingTime: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  peakCpuUsage: number;
  peakMemoryUsage: number;
  throughputPerHour: number;
  errorRate: number;
  mostCommonTasks: Array<{
    taskType: string;
    count: number;
    averageTime: number;
  }>;
  recentErrors: Array<{
    timestamp: string;
    error: string;
    taskType: string;
  }>;
}

export interface SystemHealth {
  timestamp: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  errorAgents: number;
  systemCpuUsage: number;
  systemMemoryUsage: number;
  queueSize: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

export function useAgentMonitoring() {
  const { socket, isConnected } = useSocket();
  
  const [executions, setExecutions] = useState<AgentExecution[]>([
    // Sample data for demonstration
    {
      id: 'exec_1',
      agentId: '1',
      agentName: 'Lead Qualification Agent',
      taskType: 'lead_analysis',
      taskName: 'Analyze incoming lead from WhatsApp',
      status: 'completed',
      startTime: new Date(Date.now() - 120000).toISOString(),
      endTime: new Date(Date.now() - 118000).toISOString(),
      duration: 2000,
      input: { message: 'Hi, I am interested in your premium plan', leadId: 'lead-123' },
      output: { leadScore: 85, category: 'hot', intent: 'purchase_inquiry' },
      metadata: {
        workflowId: 'lead-qualification-flow',
        workflowExecutionId: 'wf_exec_1',
        stepId: 'leadQualification',
        retryCount: 0,
        maxRetries: 3,
        priority: 'high',
        tags: ['qualification', 'whatsapp', 'premium']
      },
      performance: {
        cpuUsage: 45,
        memoryUsage: 67,
        responseTime: 2000,
        throughput: 0.5
      },
      context: {
        leadId: 'lead-123',
        messageId: 'msg-456',
        userId: 'user-789',
        businessId: 'business-1',
        sessionId: 'session-abc'
      }
    },
    {
      id: 'exec_2',
      agentId: '2',
      agentName: 'Message Generation Agent',
      taskType: 'message_generation',
      taskName: 'Generate personalized response',
      status: 'running',
      startTime: new Date(Date.now() - 30000).toISOString(),
      input: { leadData: { name: 'Priya Sharma', score: 85 }, intent: 'purchase_inquiry' },
      metadata: {
        workflowId: 'lead-qualification-flow',
        workflowExecutionId: 'wf_exec_1',
        stepId: 'responseGeneration',
        retryCount: 0,
        maxRetries: 3,
        priority: 'high',
        tags: ['generation', 'whatsapp', 'personalization']
      },
      performance: {
        cpuUsage: 78,
        memoryUsage: 82,
        responseTime: 0,
        throughput: 0
      },
      context: {
        leadId: 'lead-123',
        messageId: 'msg-456',
        userId: 'user-789',
        businessId: 'business-1',
        sessionId: 'session-abc'
      }
    }
  ]);

  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([
    {
      agentId: '1',
      agentName: 'Lead Qualification Agent',
      timeRange: 'Last 24 hours',
      totalExecutions: 247,
      successfulExecutions: 232,
      failedExecutions: 15,
      successRate: 94,
      averageResponseTime: 1200,
      totalProcessingTime: 296400,
      averageCpuUsage: 45,
      averageMemoryUsage: 67,
      peakCpuUsage: 89,
      peakMemoryUsage: 92,
      throughputPerHour: 10.3,
      errorRate: 6.1,
      mostCommonTasks: [
        { taskType: 'lead_analysis', count: 180, averageTime: 1100 },
        { taskType: 'lead_scoring', count: 67, averageTime: 1400 }
      ],
      recentErrors: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), error: 'Timeout waiting for LLM response', taskType: 'lead_analysis' },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), error: 'Invalid input format', taskType: 'lead_scoring' }
      ]
    },
    {
      agentId: '2',
      agentName: 'Message Generation Agent',
      timeRange: 'Last 24 hours',
      totalExecutions: 189,
      successfulExecutions: 168,
      failedExecutions: 21,
      successRate: 89,
      averageResponseTime: 800,
      totalProcessingTime: 151200,
      averageCpuUsage: 62,
      averageMemoryUsage: 74,
      peakCpuUsage: 95,
      peakMemoryUsage: 88,
      throughputPerHour: 7.9,
      errorRate: 11.1,
      mostCommonTasks: [
        { taskType: 'message_generation', count: 150, averageTime: 750 },
        { taskType: 'response_personalization', count: 39, averageTime: 950 }
      ],
      recentErrors: [
        { timestamp: new Date(Date.now() - 1800000).toISOString(), error: 'Content policy violation detected', taskType: 'message_generation' },
        { timestamp: new Date(Date.now() - 5400000).toISOString(), error: 'Rate limit exceeded', taskType: 'message_generation' }
      ]
    }
  ]);

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    timestamp: new Date().toISOString(),
    overallStatus: 'healthy',
    totalAgents: 5,
    activeAgents: 4,
    idleAgents: 1,
    errorAgents: 0,
    systemCpuUsage: 34,
    systemMemoryUsage: 56,
    queueSize: 12,
    averageResponseTime: 950,
    throughput: 24.7,
    errorRate: 8.2,
    uptime: 99.8
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for real-time agent execution updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('agent:execution_started', (data: AgentExecution) => {
      setExecutions(prev => [data, ...prev.slice(0, 49)]);
    });

    socket.on('agent:execution_completed', (data: { executionId: string; endTime: string; duration: number; output: any; performance: any }) => {
      setExecutions(prev => prev.map(exec => 
        exec.id === data.executionId 
          ? { 
              ...exec, 
              status: 'completed', 
              endTime: data.endTime, 
              duration: data.duration,
              output: data.output,
              performance: { ...exec.performance, ...data.performance }
            }
          : exec
      ));
    });

    socket.on('agent:execution_failed', (data: { executionId: string; endTime: string; error: string }) => {
      setExecutions(prev => prev.map(exec => 
        exec.id === data.executionId 
          ? { 
              ...exec, 
              status: 'failed', 
              endTime: data.endTime, 
              error: data.error
            }
          : exec
      ));
    });

    socket.on('agent:metrics_update', (data: AgentMetrics) => {
      setAgentMetrics(prev => prev.map(metric => 
        metric.agentId === data.agentId ? data : metric
      ));
    });

    socket.on('system:health_update', (data: SystemHealth) => {
      setSystemHealth(data);
    });

    return () => {
      socket.off('agent:execution_started');
      socket.off('agent:execution_completed');
      socket.off('agent:execution_failed');
      socket.off('agent:metrics_update');
      socket.off('system:health_update');
    };
  }, [socket, isConnected]);

  // Simulate real-time updates for demo
  useEffect(() => {
    const interval = setInterval(() => {
      // Update system health
      setSystemHealth(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        systemCpuUsage: Math.max(20, Math.min(90, prev.systemCpuUsage + (Math.random() - 0.5) * 10)),
        systemMemoryUsage: Math.max(30, Math.min(95, prev.systemMemoryUsage + (Math.random() - 0.5) * 8)),
        queueSize: Math.max(0, Math.min(50, prev.queueSize + Math.floor((Math.random() - 0.5) * 6))),
        averageResponseTime: Math.max(500, Math.min(3000, prev.averageResponseTime + (Math.random() - 0.5) * 200)),
      }));

      // Randomly complete running executions
      setExecutions(prev => prev.map(exec => {
        if (exec.status === 'running' && Math.random() > 0.7) {
          const duration = Date.now() - new Date(exec.startTime).getTime();
          return {
            ...exec,
            status: Math.random() > 0.1 ? 'completed' : 'failed',
            endTime: new Date().toISOString(),
            duration,
            output: Math.random() > 0.1 ? { result: 'Task completed successfully' } : undefined,
            error: Math.random() <= 0.1 ? 'Execution failed due to timeout' : undefined,
          };
        }
        return exec;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getExecutionsByAgent = useCallback((agentId: string) => {
    return executions.filter(exec => exec.agentId === agentId);
  }, [executions]);

  const getExecutionsByTimeRange = useCallback((timeRange: string) => {
    const now = new Date();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    
    const cutoff = new Date(now.getTime() - ranges[timeRange as keyof typeof ranges]);
    return executions.filter(exec => new Date(exec.startTime) >= cutoff);
  }, [executions]);

  const getAgentMetrics = useCallback((agentId: string) => {
    return agentMetrics.find(metric => metric.agentId === agentId);
  }, [agentMetrics]);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation, would fetch fresh metrics from backend
    console.log('Refreshing agent metrics...');
    
    setIsLoading(false);
  }, []);

  const exportExecutionHistory = useCallback((agentId?: string, timeRange?: string) => {
    let dataToExport = executions;
    
    if (agentId) {
      dataToExport = dataToExport.filter(exec => exec.agentId === agentId);
    }
    
    if (timeRange) {
      dataToExport = getExecutionsByTimeRange(timeRange);
    }
    
    // Convert to CSV format
    const csvHeader = 'ID,Agent,Task,Status,Start Time,Duration,Error\n';
    const csvRows = dataToExport.map(exec => 
      `${exec.id},${exec.agentName},${exec.taskName},${exec.status},${exec.startTime},${exec.duration || 0},"${exec.error || ''}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-execution-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [executions, getExecutionsByTimeRange]);

  const getExecutionTrends = useCallback(() => {
    const last24h = getExecutionsByTimeRange('24h');
    const grouped = last24h.reduce((acc, exec) => {
      const hour = new Date(exec.startTime).getHours();
      if (!acc[hour]) acc[hour] = { total: 0, success: 0, failed: 0 };
      acc[hour].total++;
      if (exec.status === 'completed') acc[hour].success++;
      if (exec.status === 'failed') acc[hour].failed++;
      return acc;
    }, {} as Record<number, { total: number; success: number; failed: number }>);

    return Object.entries(grouped).map(([hour, data]) => ({
      hour: parseInt(hour),
      ...data,
      successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0
    }));
  }, [getExecutionsByTimeRange]);

  const stats = {
    totalExecutions: executions.length,
    runningExecutions: executions.filter(e => e.status === 'running').length,
    completedExecutions: executions.filter(e => e.status === 'completed').length,
    failedExecutions: executions.filter(e => e.status === 'failed').length,
    avgExecutionTime: executions.filter(e => e.duration).length > 0 
      ? Math.round(executions.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / executions.filter(e => e.duration).length)
      : 0,
    successRate: executions.length > 0 
      ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
      : 0
  };

  return {
    executions,
    agentMetrics,
    systemHealth,
    selectedTimeRange,
    selectedAgent,
    stats,
    isLoading,
    isConnected,
    setSelectedTimeRange,
    setSelectedAgent,
    getExecutionsByAgent,
    getExecutionsByTimeRange,
    getAgentMetrics,
    getExecutionTrends,
    refreshMetrics,
    exportExecutionHistory
  };
}