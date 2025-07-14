'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bot, Activity, MessageCircle, Brain, Target, RefreshCw, Play, Pause, Cpu, HardDrive, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useAIAgents } from '@/hooks/use-ai-agents';

export function AIAgentStatus() {
  const { agents, stats, isLoading, isConnected, toggleAgent, refreshAgents } = useAIAgents();

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'lead_qualification': return Target;
      case 'message_generation': return MessageCircle;
      case 'follow_up_scheduler': return RefreshCw;
      case 'intent_recognition': return Brain;
      case 'context_memory': return Activity;
      default: return Bot;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'idle': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value < 30) return 'text-green-600';
    if (value < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            AI Agent Status
            <div className={`ml-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {stats.activeAgents}/{stats.totalAgents} active • {stats.totalTasks} tasks • {stats.totalTasksInProgress} in progress • {stats.avgSuccessRate}% success
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAgents}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* System Overview */}
        <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.avgCpu}%</div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <Cpu className="h-3 w-3 mr-1" />
              Avg CPU
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.avgMemory}%</div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <HardDrive className="h-3 w-3 mr-1" />
              Avg Memory
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.totalQueueSize}</div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <Clock className="h-3 w-3 mr-1" />
              Queue Size
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.totalErrors}</div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Total Errors
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {agents.map((agent) => {
            const StatusIcon = getStatusIcon(agent.type);
            return (
              <div key={agent.id} className="bg-white border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {agent.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAgent(agent.id)}
                    className="h-6 w-6 p-0"
                  >
                    {agent.status === 'paused' ? 
                      <Play className="h-3 w-3" /> : 
                      <Pause className="h-3 w-3" />
                    }
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(agent.status)}`}
                  >
                    {agent.status === 'processing' && <Zap className="h-3 w-3 mr-1" />}
                    {agent.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {agent.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </Badge>
                  
                  {agent.currentTask && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                      {agent.currentTask}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Tasks:</span>
                    <span className="font-medium">{agent.tasksCompleted} ({agent.tasksInProgress} active)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Avg Time:</span>
                    <span className="font-medium">{agent.averageResponseTime}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Success:</span>
                    <span className="font-medium">{agent.successRate}%</span>
                  </div>
                  {agent.errorCount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Errors:</span>
                      <span className="font-medium text-red-600">{agent.errorCount}</span>
                    </div>
                  )}
                </div>
                
                {/* Performance Metrics */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">CPU</span>
                      <span className={`font-medium ${getPerformanceColor(agent.performance.cpu)}`}>
                        {agent.performance.cpu}%
                      </span>
                    </div>
                    <Progress value={agent.performance.cpu} className="h-1" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Memory</span>
                      <span className={`font-medium ${getPerformanceColor(agent.performance.memory)}`}>
                        {agent.performance.memory}%
                      </span>
                    </div>
                    <Progress value={agent.performance.memory} className="h-1" />
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Queue:</span>
                    <span className="font-medium">{agent.performance.queueSize} items</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                  Last: {agent.lastActive}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}