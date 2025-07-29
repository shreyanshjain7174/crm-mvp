'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Play, Pause, Square, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgentUpdates } from '@/hooks/useWebSocket';

interface AgentStatusMonitorProps {
  className?: string;
  maxVisible?: number;
  showControls?: boolean;
}

interface AgentStatus {
  id: string;
  status: 'running' | 'paused' | 'stopped' | 'error' | 'starting';
  data: {
    name: string;
    type: string;
    lastActivity?: number;
    messagesProcessed?: number;
    errorCount?: number;
    performance?: number;
  };
  lastUpdated: number;
}

function AgentCard({ agent, showControls }: { agent: AgentStatus; showControls: boolean }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return {
          icon: Play,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          label: 'Running',
          variant: 'default' as const,
        };
      case 'paused':
        return {
          icon: Pause,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          label: 'Paused',
          variant: 'secondary' as const,
        };
      case 'stopped':
        return {
          icon: Square,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          label: 'Stopped',
          variant: 'outline' as const,
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          label: 'Error',
          variant: 'destructive' as const,
        };
      case 'starting':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          label: 'Starting',
          variant: 'secondary' as const,
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          label: 'Unknown',
          variant: 'outline' as const,
        };
    }
  };

  const config = getStatusConfig(agent.status);
  const Icon = config.icon;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div>
                <h4 className="font-medium text-sm">{agent.data.name}</h4>
                <p className="text-xs text-muted-foreground">{agent.data.type}</p>
              </div>
            </div>
            <Badge variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span>{formatTime(agent.lastUpdated)}</span>
            </div>
            
            {agent.data.lastActivity && (
              <div className="flex justify-between">
                <span>Last Activity:</span>
                <span>{formatTimeAgo(agent.data.lastActivity)}</span>
              </div>
            )}
            
            {agent.data.messagesProcessed !== undefined && (
              <div className="flex justify-between">
                <span>Messages:</span>
                <span>{agent.data.messagesProcessed}</span>
              </div>
            )}
            
            {agent.data.performance !== undefined && (
              <div className="flex justify-between">
                <span>Performance:</span>
                <span className={
                  agent.data.performance > 80 ? 'text-green-600' :
                  agent.data.performance > 60 ? 'text-yellow-600' : 'text-red-600'
                }>
                  {agent.data.performance}%
                </span>
              </div>
            )}
            
            {agent.data.errorCount !== undefined && agent.data.errorCount > 0 && (
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="text-red-600">{agent.data.errorCount}</span>
              </div>
            )}
          </div>

          {showControls && (
            <div className="flex gap-2 mt-3">
              {agent.status === 'running' ? (
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AgentStatusMonitor({ 
  className = '', 
  maxVisible = 6,
  showControls = false
}: AgentStatusMonitorProps) {
  const { agents, isConnected } = useAgentUpdates();

  const visibleAgents = agents.slice(0, maxVisible);

  // Mock data when no real agents are available
  const mockAgents: AgentStatus[] = [
    {
      id: '1',
      status: 'running',
      data: {
        name: 'Lead Qualifier',
        type: 'Sales Agent',
        lastActivity: Date.now() - 300000, // 5 minutes ago
        messagesProcessed: 42,
        performance: 87,
      },
      lastUpdated: Date.now(),
    },
    {
      id: '2',
      status: 'paused',
      data: {
        name: 'Support Bot',
        type: 'Customer Support',
        lastActivity: Date.now() - 900000, // 15 minutes ago
        messagesProcessed: 156,
        performance: 92,
      },
      lastUpdated: Date.now() - 60000,
    },
    {
      id: '3',
      status: 'running',
      data: {
        name: 'Follow-up Assistant',
        type: 'Automation',
        lastActivity: Date.now() - 120000, // 2 minutes ago
        messagesProcessed: 28,
        performance: 95,
      },
      lastUpdated: Date.now() - 30000,
    },
  ];

  const displayAgents = visibleAgents.length > 0 ? visibleAgents : mockAgents;

  if (!isConnected && visibleAgents.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agent Status Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Agent monitoring unavailable
              </p>
              <p className="text-xs text-muted-foreground">
                Reconnecting to agent status updates...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agent Status Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                  Demo Data
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {displayAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  showControls={showControls}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {agents.length > maxVisible && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm">
                View {agents.length - maxVisible} More Agents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentStatusMonitor;