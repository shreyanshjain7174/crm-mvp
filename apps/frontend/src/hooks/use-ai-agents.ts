'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';

export interface AgentStatus {
  id: string;
  name: string;
  type: 'lead_qualification' | 'message_generation' | 'follow_up_scheduler' | 'intent_recognition' | 'context_memory';
  status: 'active' | 'idle' | 'processing' | 'error' | 'paused';
  lastActive: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageResponseTime: string;
  successRate: number;
  errorCount: number;
  currentTask?: string;
  performance: {
    cpu: number;
    memory: number;
    queueSize: number;
  };
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'status_changed';
  message: string;
  timestamp: string;
  details?: any;
}

export function useAIAgents() {
  const { socket, isConnected } = useSocket();
  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      id: '1',
      name: 'Lead Qualification Agent',
      type: 'lead_qualification',
      status: 'active',
      lastActive: '2 minutes ago',
      tasksCompleted: 23,
      tasksInProgress: 2,
      averageResponseTime: '1.2s',
      successRate: 94,
      errorCount: 1,
      currentTask: 'Analyzing lead from WhatsApp',
      performance: { cpu: 45, memory: 67, queueSize: 3 }
    },
    {
      id: '2',
      name: 'Message Generation Agent',
      type: 'message_generation',
      status: 'processing',
      lastActive: 'Just now',
      tasksCompleted: 147,
      tasksInProgress: 1,
      averageResponseTime: '0.8s',
      successRate: 89,
      errorCount: 16,
      currentTask: 'Generating response for premium lead',
      performance: { cpu: 78, memory: 82, queueSize: 5 }
    },
    {
      id: '3',
      name: 'Follow-up Scheduler',
      type: 'follow_up_scheduler',
      status: 'idle',
      lastActive: '15 minutes ago',
      tasksCompleted: 56,
      tasksInProgress: 0,
      averageResponseTime: '0.5s',
      successRate: 96,
      errorCount: 2,
      performance: { cpu: 12, memory: 34, queueSize: 0 }
    },
    {
      id: '4',
      name: 'Intent Recognition Agent',
      type: 'intent_recognition',
      status: 'active',
      lastActive: '30 seconds ago',
      tasksCompleted: 89,
      tasksInProgress: 3,
      averageResponseTime: '0.3s',
      successRate: 91,
      errorCount: 8,
      currentTask: 'Processing customer intent classification',
      performance: { cpu: 34, memory: 45, queueSize: 2 }
    },
    {
      id: '5',
      name: 'Context Memory Agent',
      type: 'context_memory',
      status: 'active',
      lastActive: '1 minute ago',
      tasksCompleted: 203,
      tasksInProgress: 1,
      averageResponseTime: '0.4s',
      successRate: 98,
      errorCount: 4,
      currentTask: 'Updating conversation embeddings',
      performance: { cpu: 56, memory: 71, queueSize: 1 }
    }
  ]);

  const [recentActivity, setRecentActivity] = useState<AgentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for real-time agent updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('agent:status_update', (data: Partial<AgentStatus> & { id: string }) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.id ? { ...agent, ...data } : agent
      ));
    });

    socket.on('agent:task_started', (data: { agentId: string; task: string }) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.agentId 
          ? { 
              ...agent, 
              status: 'processing', 
              currentTask: data.task,
              tasksInProgress: agent.tasksInProgress + 1,
              lastActive: 'Just now'
            }
          : agent
      ));
      
      const agent = agents.find(a => a.id === data.agentId);
      if (agent) {
        const activity: AgentActivity = {
          id: Date.now().toString(),
          agentId: data.agentId,
          agentName: agent.name,
          type: 'task_started',
          message: `Started: ${data.task}`,
          timestamp: new Date().toISOString(),
        };
        setRecentActivity(prev => [activity, ...prev.slice(0, 49)]);
      }
    });

    socket.on('agent:task_completed', (data: { agentId: string; task: string; duration: number }) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.agentId 
          ? { 
              ...agent, 
              tasksCompleted: agent.tasksCompleted + 1,
              tasksInProgress: Math.max(0, agent.tasksInProgress - 1),
              lastActive: 'Just now',
              status: agent.tasksInProgress <= 1 ? 'active' : 'processing'
            }
          : agent
      ));

      const agent = agents.find(a => a.id === data.agentId);
      if (agent) {
        const activity: AgentActivity = {
          id: Date.now().toString(),
          agentId: data.agentId,
          agentName: agent.name,
          type: 'task_completed',
          message: `Completed: ${data.task} (${data.duration}ms)`,
          timestamp: new Date().toISOString(),
          details: { duration: data.duration }
        };
        setRecentActivity(prev => [activity, ...prev.slice(0, 49)]);
      }
    });

    socket.on('agent:task_failed', (data: { agentId: string; task: string; error: string }) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.agentId 
          ? { 
              ...agent, 
              errorCount: agent.errorCount + 1,
              tasksInProgress: Math.max(0, agent.tasksInProgress - 1),
              status: 'error',
              lastActive: 'Just now'
            }
          : agent
      ));

      const agent = agents.find(a => a.id === data.agentId);
      if (agent) {
        const activity: AgentActivity = {
          id: Date.now().toString(),
          agentId: data.agentId,
          agentName: agent.name,
          type: 'task_failed',
          message: `Failed: ${data.task} - ${data.error}`,
          timestamp: new Date().toISOString(),
          details: { error: data.error }
        };
        setRecentActivity(prev => [activity, ...prev.slice(0, 49)]);
      }
    });

    socket.on('agent:performance_update', (data: { agentId: string; performance: AgentStatus['performance'] }) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.agentId 
          ? { ...agent, performance: data.performance }
          : agent
      ));
    });

    return () => {
      socket.off('agent:status_update');
      socket.off('agent:task_started');
      socket.off('agent:task_completed');
      socket.off('agent:task_failed');
      socket.off('agent:performance_update');
    };
  }, [socket, isConnected, agents]);

  const toggleAgent = useCallback(async (agentId: string) => {
    if (!socket) return;

    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const newStatus = agent.status === 'paused' ? 'active' : 'paused';
    
    // Optimistic update
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: newStatus } : a
    ));

    // Emit to backend
    socket.emit('agent:toggle', { agentId, status: newStatus });
  }, [socket, agents]);

  const refreshAgents = useCallback(async () => {
    if (!socket) return;
    
    setIsLoading(true);
    socket.emit('agent:get_status', {}, (response: AgentStatus[]) => {
      if (response) {
        setAgents(response);
      }
      setIsLoading(false);
    });
  }, [socket]);

  const stats = {
    activeAgents: agents.filter(a => a.status === 'active' || a.status === 'processing').length,
    totalAgents: agents.length,
    totalTasks: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
    totalTasksInProgress: agents.reduce((sum, a) => sum + a.tasksInProgress, 0),
    avgSuccessRate: Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length),
    totalErrors: agents.reduce((sum, a) => sum + a.errorCount, 0),
    avgCpu: Math.round(agents.reduce((sum, a) => sum + a.performance.cpu, 0) / agents.length),
    avgMemory: Math.round(agents.reduce((sum, a) => sum + a.performance.memory, 0) / agents.length),
    totalQueueSize: agents.reduce((sum, a) => sum + a.performance.queueSize, 0)
  };

  return {
    agents,
    recentActivity,
    stats,
    isLoading,
    isConnected,
    toggleAgent,
    refreshAgents
  };
}