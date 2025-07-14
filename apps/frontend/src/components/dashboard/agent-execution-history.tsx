'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Play,
  Download,
  Filter,
  Search,
  Cpu,
  MemoryStick,
  Zap,
  Calendar
} from 'lucide-react';
import { useAgentMonitoring } from '@/hooks/use-agent-monitoring';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function AgentExecutionHistory() {
  const { 
    executions, 
    selectedTimeRange, 
    selectedAgent,
    stats,
    isLoading,
    setSelectedTimeRange, 
    setSelectedAgent,
    getExecutionsByAgent,
    getExecutionsByTimeRange,
    exportExecutionHistory 
  } = useAgentMonitoring();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  // Filter executions
  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = searchTerm === '' || 
      execution.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    const matchesAgent = !selectedAgent || execution.agentId === selectedAgent;
    
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const handleExport = () => {
    exportExecutionHistory(selectedAgent || undefined, selectedTimeRange);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Agent Execution History
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-5 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.totalExecutions}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{stats.runningExecutions}</div>
            <div className="text-xs text-gray-600">Running</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{stats.completedExecutions}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{stats.failedExecutions}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.successRate}%</div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search executions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Time Range</label>
            <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Agent</label>
            <Select value={selectedAgent || 'all'} onValueChange={(value) => setSelectedAgent(value === 'all' ? null : value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="1">Lead Qualification</SelectItem>
                <SelectItem value="2">Message Generation</SelectItem>
                <SelectItem value="3">Follow-up Scheduler</SelectItem>
                <SelectItem value="4">Intent Recognition</SelectItem>
                <SelectItem value="5">Context Memory</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredExecutions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <History className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No executions found matching your filters</p>
              </div>
            ) : (
              filteredExecutions.map((execution) => (
                <div key={execution.id} className="bg-white border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
                  {/* Execution Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">{execution.taskName}</h3>
                        <p className="text-sm text-gray-600">{execution.agentName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(execution.metadata.priority)}`}>
                        {execution.metadata.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Execution Details */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 text-xs">Started</div>
                      <div className="font-medium">
                        {formatDistanceToNow(new Date(execution.startTime), { addSuffix: true })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(execution.startTime), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600 text-xs">Duration</div>
                      <div className="font-medium">{formatDuration(execution.duration)}</div>
                      {execution.performance.responseTime > 0 && (
                        <div className="text-xs text-gray-500">
                          Response: {execution.performance.responseTime}ms
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-gray-600 text-xs">Performance</div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="flex items-center">
                          <Cpu className="h-3 w-3 mr-1" />
                          {execution.performance.cpuUsage}%
                        </div>
                        <div className="flex items-center">
                          <MemoryStick className="h-3 w-3 mr-1" />
                          {execution.performance.memoryUsage}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600 text-xs">Context</div>
                      <div className="text-xs">
                        {execution.context.leadId && `Lead: ${execution.context.leadId.slice(-6)}`}
                        {execution.context.workflowId && (
                          <div>Workflow: {execution.context.workflowId?.replace('-', ' ')}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {execution.metadata.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-600">Tags:</span>
                      {execution.metadata.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Input/Output */}
                  {(execution.input || execution.output || execution.error) && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      {execution.input && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Input</div>
                          <div className="text-xs bg-gray-50 p-2 rounded border font-mono">
                            {typeof execution.input === 'string' 
                              ? execution.input 
                              : JSON.stringify(execution.input, null, 2)}
                          </div>
                        </div>
                      )}
                      
                      {execution.output && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Output</div>
                          <div className="text-xs bg-green-50 p-2 rounded border font-mono">
                            {typeof execution.output === 'string' 
                              ? execution.output 
                              : JSON.stringify(execution.output, null, 2)}
                          </div>
                        </div>
                      )}
                      
                      {execution.error && (
                        <div>
                          <div className="text-xs font-medium text-red-700 mb-1">Error</div>
                          <div className="text-xs bg-red-50 p-2 rounded border text-red-700 font-mono">
                            {execution.error}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Retry Information */}
                  {execution.metadata.retryCount > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border-l-2 border-orange-200">
                      Retry {execution.metadata.retryCount}/{execution.metadata.maxRetries}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}