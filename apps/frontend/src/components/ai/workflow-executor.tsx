'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Settings, RefreshCw, Zap, AlertTriangle } from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  agent: string;
  duration?: number;
  error?: string;
  output?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  trigger: string;
  lastRun?: string;
  successRate: number;
}

export function WorkflowExecutor() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'New Lead Processing',
      description: 'Process incoming leads with AI qualification and initial response',
      status: 'idle',
      trigger: 'lead.created',
      lastRun: '2 minutes ago',
      successRate: 94,
      steps: [
        { id: '1a', name: 'Lead Qualification', status: 'completed', agent: 'Lead Qualification Agent', duration: 1.2 },
        { id: '1b', name: 'Generate Welcome Message', status: 'completed', agent: 'Message Generation Agent', duration: 0.8 },
        { id: '1c', name: 'Schedule Follow-up', status: 'completed', agent: 'Follow-up Scheduler', duration: 0.3 },
        { id: '1d', name: 'Update CRM Status', status: 'completed', agent: 'CRM Integration Agent', duration: 0.5 }
      ]
    },
    {
      id: '2',
      name: 'Message Response Workflow',
      description: 'Analyze incoming messages and generate contextual responses',
      status: 'running',
      trigger: 'message.received',
      lastRun: 'Just now',
      successRate: 89,
      steps: [
        { id: '2a', name: 'Intent Recognition', status: 'completed', agent: 'Intent Recognition Agent', duration: 0.4 },
        { id: '2b', name: 'Context Retrieval', status: 'completed', agent: 'Context Memory Agent', duration: 0.6 },
        { id: '2c', name: 'Response Generation', status: 'running', agent: 'Message Generation Agent' },
        { id: '2d', name: 'Human Approval', status: 'pending', agent: 'Human Review System' }
      ]
    },
    {
      id: '3',
      name: 'Daily Lead Scoring',
      description: 'Batch process to update lead scores and priorities',
      status: 'idle',
      trigger: 'schedule.daily',
      lastRun: '18 hours ago',
      successRate: 96,
      steps: [
        { id: '3a', name: 'Gather Lead Data', status: 'pending', agent: 'Data Collection Agent' },
        { id: '3b', name: 'Calculate AI Scores', status: 'pending', agent: 'Lead Scoring Agent' },
        { id: '3c', name: 'Update Priorities', status: 'pending', agent: 'Priority Management Agent' },
        { id: '3d', name: 'Generate Reports', status: 'pending', agent: 'Reporting Agent' }
      ]
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // Simulate real-time workflow updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkflows(prev => prev.map(workflow => {
        if (workflow.status === 'running') {
          // Update running steps
          const updatedSteps = workflow.steps.map(step => {
            if (step.status === 'running' && Math.random() > 0.7) {
              return { ...step, status: 'completed' as const, duration: Math.random() * 2 + 0.5 };
            }
            if (step.status === 'pending' && workflow.steps.findIndex(s => s.status === 'running') === -1) {
              return { ...step, status: 'running' as const };
            }
            return step;
          });

          // Check if workflow is complete
          const allCompleted = updatedSteps.every(step => step.status === 'completed');
          if (allCompleted) {
            return { ...workflow, status: 'completed' as const, steps: updatedSteps };
          }

          return { ...workflow, steps: updatedSteps };
        }
        return workflow;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const executeWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(workflow => {
      if (workflow.id === workflowId) {
        return {
          ...workflow,
          status: 'running',
          steps: workflow.steps.map((step, index) => ({
            ...step,
            status: index === 0 ? 'running' : 'pending'
          }))
        };
      }
      return workflow;
    }));
  };

  const stopWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(workflow => {
      if (workflow.id === workflowId) {
        return {
          ...workflow,
          status: 'idle',
          steps: workflow.steps.map(step => ({
            ...step,
            status: step.status === 'running' ? 'failed' : step.status
          }))
        };
      }
      return workflow;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'idle': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const runningWorkflows = workflows.filter(w => w.status === 'running').length;
  const totalExecutions = workflows.reduce((sum, w) => sum + (w.lastRun ? 1 : 0), 0);
  const avgSuccessRate = Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Active Workflows</p>
              <p className="text-2xl font-bold text-blue-900">{runningWorkflows}</p>
            </div>
            <Play className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-green-900">{avgSuccessRate}%</p>
            </div>
            <Zap className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Workflows</p>
              <p className="text-2xl font-bold text-purple-900">{workflows.length}</p>
            </div>
            <Settings className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Executions Today</p>
              <p className="text-2xl font-bold text-orange-900">{totalExecutions}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(workflow.status)}>
                    {workflow.status.toUpperCase()}
                  </Badge>
                  <div className="flex space-x-2">
                    {workflow.status === 'idle' ? (
                      <Button 
                        size="sm" 
                        onClick={() => executeWorkflow(workflow.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    ) : workflow.status === 'running' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => stopWorkflow(workflow.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => executeWorkflow(workflow.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Re-run
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedWorkflow(
                        selectedWorkflow === workflow.id ? null : workflow.id
                      )}
                    >
                      {selectedWorkflow === workflow.id ? 'Hide' : 'Details'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Trigger: {workflow.trigger}</span>
                <span>Success Rate: {workflow.successRate}%</span>
                {workflow.lastRun && <span>Last Run: {workflow.lastRun}</span>}
              </div>
            </CardHeader>

            {selectedWorkflow === workflow.id && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Workflow Steps</h4>
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300">
                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h5 className="font-medium text-gray-900">{step.name}</h5>
                          <Badge className={`text-xs ${getStepStatusColor(step.status)}`}>
                            {step.status}
                          </Badge>
                          {step.duration && (
                            <span className="text-xs text-gray-500">{step.duration}s</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{step.agent}</p>
                        {step.error && (
                          <div className="flex items-center mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {step.error}
                          </div>
                        )}
                        {step.output && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            Output: {step.output}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}