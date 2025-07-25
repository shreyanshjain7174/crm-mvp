'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Activity, 
  Clock, 
  Cpu, 
  HardDrive, 
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Code,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface AgentExecution {
  id: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime: string;
  endTime?: string;
  input?: any;
  output?: any;
  error?: string;
  resourceUsage?: {
    executionTime: number;
    memoryUsed: number;
    apiCallsMade: number;
  };
}

interface RuntimeStats {
  executions: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  sandboxes: {
    totalSandboxes: number;
    maxConcurrent: number;
    sandboxes: any[];
  };
  uptime: number;
  memoryUsage: any;
}

// Mock API client (replace with actual API calls)
const apiClient = {
    async getExecutions() {
      // Mock data for demonstration
      return {
        data: {
          executions: [
            {
              id: 'exec_1',
              agentId: 'crm_assistant_v1',
              status: 'completed' as const,
              startTime: new Date(Date.now() - 300000).toISOString(),
              endTime: new Date(Date.now() - 285000).toISOString(),
              input: { action: 'analyze_leads' },
              output: {
                analysis: { totalLeads: 15, hotLeads: 3, recommendations: ['Focus on hot leads'] }
              },
              resourceUsage: { executionTime: 15000, memoryUsed: 45.2, apiCallsMade: 8 }
            },
            {
              id: 'exec_2', 
              agentId: 'crm_assistant_v1',
              status: 'running' as const,
              startTime: new Date(Date.now() - 30000).toISOString(),
              input: { action: 'send_follow_ups', leadIds: ['lead_1', 'lead_2'] }
            }
          ]
        }
      };
    },

    async getRuntimeStats() {
      return {
        data: {
          executions: { total: 45, running: 1, completed: 38, failed: 6 },
          sandboxes: { totalSandboxes: 1, maxConcurrent: 10, sandboxes: [] },
          uptime: 86400,
          memoryUsage: { heapUsed: 125000000, heapTotal: 256000000 }
        }
      };
    },

    async executeAgent(agentId: string, input: any) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        data: {
          executionId: `exec_${Date.now()}`,
          status: 'started',
          message: 'Agent execution initiated successfully'
        }
      };
    },

    async stopExecution(executionId: string) {
      return {
        data: {
          executionId,
          status: 'stopped',
          message: 'Execution stopped successfully'
        }
      };
    }
  };

export function AgentRuntimeDashboard() {
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [runtimeStats, setRuntimeStats] = useState<RuntimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [executionsResponse, statsResponse] = await Promise.all([
        apiClient.getExecutions(),
        apiClient.getRuntimeStats()
      ]);

      setExecutions(executionsResponse.data.executions);
      setRuntimeStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch runtime data:', error);
      toast({
        title: "Error",
        description: "Failed to load runtime data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExecuteAgent = async () => {
    try {
      setExecuting('crm_assistant_v1');
      
      const response = await apiClient.executeAgent('crm_assistant_v1', {
        action: 'analyze_leads'
      });

      toast({
        title: "Success",
        description: "Agent execution started successfully"
      });

      // Refresh data to show new execution
      setTimeout(fetchData, 1000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start agent execution",
        variant: "destructive"
      });
    } finally {
      setExecuting(null);
    }
  };

  const handleStopExecution = async (executionId: string) => {
    try {
      await apiClient.stopExecution(executionId);
      
      toast({
        title: "Success",
        description: "Execution stopped successfully"
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop execution",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading runtime dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Runtime Statistics */}
      {runtimeStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                  <p className="text-2xl font-bold">{runtimeStats.executions.total}</p>
                </div>
                <Terminal className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Running</p>
                  <p className="text-2xl font-bold text-blue-600">{runtimeStats.executions.running}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {runtimeStats.executions.total > 0 
                      ? Math.round((runtimeStats.executions.completed / runtimeStats.executions.total) * 100)
                      : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(runtimeStats.memoryUsage.heapUsed / 1024 / 1024)}MB
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleExecuteAgent}
              disabled={executing !== null}
              className="flex items-center gap-2"
            >
              {executing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {executing ? 'Starting...' : 'Run CRM Assistant'}
            </Button>

            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {executions.map((execution) => (
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Execution Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <p className="font-medium">{execution.agentId}</p>
                        <p className="text-sm text-muted-foreground">
                          {execution.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                      
                      {execution.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStopExecution(execution.id)}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Execution Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p>{new Date(execution.startTime).toLocaleString()}</p>
                    </div>
                    
                    {execution.endTime && (
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p>{formatDuration(new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime())}</p>
                      </div>
                    )}

                    {execution.resourceUsage && (
                      <div>
                        <p className="text-muted-foreground">Resources</p>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3 w-3" />
                          <span>{formatDuration(execution.resourceUsage.executionTime)}</span>
                          <HardDrive className="h-3 w-3 ml-2" />
                          <span>{execution.resourceUsage.memoryUsed.toFixed(1)}MB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input/Output */}
                  {execution.input && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Input</p>
                      <div className="bg-muted p-2 rounded text-xs font-mono">
                        {JSON.stringify(execution.input, null, 2)}
                      </div>
                    </div>
                  )}

                  {execution.output && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Output</p>
                      <div className="bg-muted p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        {JSON.stringify(execution.output, null, 2)}
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Error</p>
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-2 rounded text-xs text-red-700 dark:text-red-300">
                        {execution.error}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {executions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No executions found</p>
                <p className="text-sm">Start an agent to see executions here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}