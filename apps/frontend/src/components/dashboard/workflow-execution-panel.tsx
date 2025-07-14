'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Workflow, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Bot,
  Zap,
  RotateCcw,
  Timer
} from 'lucide-react';
import { useWorkflows } from '@/hooks/use-workflows';
import { formatDistanceToNow } from 'date-fns';

export function WorkflowExecutionPanel() {
  const { 
    executions, 
    stats, 
    isLoading, 
    isConnected,
    pauseWorkflow, 
    resumeWorkflow, 
    cancelWorkflow,
    retryStep,
    getRunningExecutions 
  } = useWorkflows();

  const runningExecutions = getRunningExecutions();

  const getStepIcon = (type: string, status: string) => {
    if (status === 'running') return <Zap className="h-4 w-4 text-blue-600 animate-pulse" />;
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'failed') return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (status === 'waiting_approval') return <User className="h-4 w-4 text-yellow-600" />;
    
    switch (type) {
      case 'agent_task': return <Bot className="h-4 w-4 text-gray-400" />;
      case 'human_approval': return <User className="h-4 w-4 text-gray-400" />;
      case 'webhook': return <Zap className="h-4 w-4 text-gray-400" />;
      case 'delay': return <Timer className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'waiting_approval': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Workflow className="mr-2 h-5 w-5" />
            Workflow Executions
            <div className={`ml-2 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {stats.runningExecutions} running • {stats.completedExecutions} completed • {Math.round(stats.avgSuccessRate)}% success
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
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
            <div className="text-lg font-semibold text-gray-900">{stats.totalExecutions}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {executions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Workflow className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No workflow executions</p>
              </div>
            ) : (
              executions.map((execution) => (
                <div key={execution.id} className="bg-white border rounded-lg p-4 space-y-4">
                  {/* Execution Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{execution.workflowName}</h3>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(execution.status)}`}>
                          {execution.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Triggered by: {execution.trigger}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Started {formatDistanceToNow(new Date(execution.startTime), { addSuffix: true })}
                        {execution.endTime && ` • Completed ${formatDistanceToNow(new Date(execution.endTime), { addSuffix: true })}`}
                      </p>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center space-x-2">
                      {execution.status === 'running' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pauseWorkflow(execution.id)}
                            disabled={isLoading}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelWorkflow(execution.id)}
                            disabled={isLoading}
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {execution.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resumeWorkflow(execution.id)}
                          disabled={isLoading}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{execution.progress}%</span>
                    </div>
                    <Progress value={execution.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{execution.metrics.completedSteps}/{execution.metrics.totalSteps} steps completed</span>
                      <span>Avg: {execution.metrics.averageStepDuration}ms per step</span>
                    </div>
                  </div>

                  {/* Context Information */}
                  {execution.context.leadId && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Context:</strong> Lead {execution.context.leadId}
                      {execution.context.variables?.customerName && ` • ${execution.context.variables.customerName}`}
                      {execution.context.variables?.product && ` • ${execution.context.variables.product}`}
                    </div>
                  )}

                  {/* Steps */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Execution Steps</h4>
                    <div className="space-y-2">
                      {execution.steps.map((step, index) => (
                        <div 
                          key={step.id} 
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${getStepStatusColor(step.status)}`}
                        >
                          <div className="flex-shrink-0">
                            {getStepIcon(step.type, step.status)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {index + 1}. {step.name}
                              </p>
                              <div className="flex items-center space-x-2">
                                {step.duration && (
                                  <span className="text-xs text-gray-500">
                                    {step.duration}ms
                                  </span>
                                )}
                                {step.status === 'failed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => retryStep(execution.id, step.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-600 capitalize">
                                {step.type.replace('_', ' ')}
                                {step.agentId && ` • Agent ${step.agentId}`}
                              </p>
                              
                              {step.status === 'running' && step.startTime && (
                                <span className="text-xs text-blue-600">
                                  Running for {formatDistanceToNow(new Date(step.startTime))}
                                </span>
                              )}
                            </div>
                            
                            {step.error && (
                              <p className="text-xs text-red-600 mt-1 bg-red-50 p-1 rounded">
                                Error: {step.error}
                              </p>
                            )}
                            
                            {step.status === 'waiting_approval' && (
                              <div className="mt-2 flex space-x-2">
                                <Button size="sm" className="h-6 text-xs">
                                  Approve
                                </Button>
                                <Button variant="outline" size="sm" className="h-6 text-xs">
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}