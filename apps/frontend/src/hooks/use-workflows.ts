'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';
// Placeholder imports for removed LangGraph dependencies

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent_task' | 'human_approval' | 'condition' | 'webhook' | 'delay';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';
  agentId?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  input?: any;
  output?: any;
  error?: string;
  metadata?: {
    retryCount?: number;
    maxRetries?: number;
    approvalRequired?: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  trigger: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  steps: WorkflowStep[];
  context: {
    leadId?: string;
    messageId?: string;
    userId?: string;
    businessId?: string;
    variables?: Record<string, any>;
  };
  metrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    averageStepDuration: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_nurturing' | 'message_automation' | 'follow_up' | 'qualification' | 'custom';
  isActive: boolean;
  triggerType: 'manual' | 'event' | 'schedule';
  steps: Omit<WorkflowStep, 'status' | 'duration' | 'startTime' | 'endTime'>[];
  estimatedDuration: string;
  successRate: number;
  executionCount: number;
}

export function useWorkflows() {
  const { socket, isConnected } = useSocket();
  
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<Map<string, any>>(new Map());

  const [templates, setTemplates] = useState<WorkflowTemplate[]>([
    {
      id: 'lead-qualification-flow',
      name: 'Lead Qualification & Response',
      description: 'LangGraph-powered lead qualification with AI agent coordination',
      category: 'lead_nurturing',
      isActive: true,
      triggerType: 'event',
      estimatedDuration: '2-3 minutes',
      successRate: 92,
      executionCount: 847,
      steps: [
        { id: 'intentRecognition', name: 'Intent Recognition', type: 'agent_task', agentId: '4' },
        { id: 'leadQualification', name: 'Lead Qualification Analysis', type: 'agent_task', agentId: '1' },
        { id: 'responseGeneration', name: 'Response Generation', type: 'agent_task', agentId: '2' },
        { id: 'humanApproval', name: 'Human Approval', type: 'human_approval' },
        { id: 'sendMessage', name: 'Send WhatsApp Message', type: 'webhook' }
      ]
    },
    {
      id: 'follow-up-sequence',
      name: 'Automated Follow-up Sequence',
      description: 'LangGraph-powered multi-step follow-up with context analysis',
      category: 'follow_up',
      isActive: true,
      triggerType: 'schedule',
      estimatedDuration: '1-2 minutes',
      successRate: 78,
      executionCount: 523,
      steps: [
        { id: 'contextAnalysis', name: 'Context Analysis', type: 'agent_task', agentId: '5' },
        { id: 'followUpStrategy', name: 'Follow-up Strategy', type: 'agent_task', agentId: '3' },
        { id: 'messageGeneration', name: 'Message Generation', type: 'agent_task', agentId: '2' },
        { id: 'scheduleDelivery', name: 'Schedule Delivery', type: 'delay' }
      ]
    }
  ]);

  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Map workflow state to UI format (placeholder)
  const mapWorkflowStateToExecution = useCallback((
    executionId: string, 
    workflowId: string, 
    state: any,
    startTime: string
  ): WorkflowExecution => {
    const template = templates.find(t => t.id === workflowId);
    const templateSteps = template?.steps || [];
    
    // Map LangGraph current step to UI steps
    const steps: WorkflowStep[] = templateSteps.map((templateStep, index) => {
      const stepId = templateStep.id;
      const isCurrentStep = state.currentStep === stepId;
      const isCompleted = state.stepResults?.[stepId] !== undefined;
      const hasError = state.error && isCurrentStep;
      
      let status: WorkflowStep['status'] = 'pending';
      if (hasError) status = 'failed';
      else if (isCurrentStep) status = 'running';
      else if (isCompleted) status = 'completed';
      else if (state.currentStep === 'waitingApproval' && templateStep.type === 'human_approval') status = 'waiting_approval';
      
      const stepResult = state.stepResults?.[stepId];
      const duration = stepResult?.duration || undefined;
      
      return {
        id: stepId,
        name: templateStep.name,
        type: templateStep.type,
        status,
        agentId: templateStep.agentId,
        duration,
        startTime: isCurrentStep || isCompleted ? new Date().toISOString() : undefined,
        endTime: isCompleted ? new Date().toISOString() : undefined,
        error: hasError ? state.error : undefined,
        metadata: {
          retryCount: state.retryCount || 0,
          maxRetries: 3,
          approvalRequired: templateStep.type === 'human_approval',
          approvedBy: state.approvalStatus === 'approved' ? 'user' : undefined,
          approvedAt: state.approvalStatus === 'approved' ? new Date().toISOString() : undefined,
        }
      };
    });

    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const failedSteps = steps.filter(s => s.status === 'failed').length;
    const progress = Math.round((completedSteps / steps.length) * 100);
    
    let executionStatus: WorkflowExecution['status'] = 'running';
    if (state.currentStep === 'completed') executionStatus = 'completed';
    else if (state.currentStep === 'error' || failedSteps > 0) executionStatus = 'failed';
    else if (state.currentStep === 'waitingApproval') executionStatus = 'paused';

    return {
      id: executionId,
      workflowId,
      workflowName: template?.name || 'Unknown Workflow',
      trigger: 'Manual execution',
      status: executionStatus,
      progress,
      startTime,
      endTime: executionStatus === 'completed' ? new Date().toISOString() : undefined,
      totalDuration: executionStatus === 'completed' ? Date.now() - new Date(startTime).getTime() : undefined,
      steps,
      context: {
        leadId: state.leadId,
        messageId: state.messageId,
        userId: state.userId,
        businessId: state.businessId,
        variables: state.context,
      },
      metrics: {
        totalSteps: steps.length,
        completedSteps,
        failedSteps,
        averageStepDuration: completedSteps > 0 ? 
          steps.filter(s => s.duration).reduce((sum, s) => sum + (s.duration || 0), 0) / completedSteps : 0
      }
    };
  }, [templates]);

  // Execute workflow (placeholder implementation)
  const executeWorkflow = useCallback(async (workflowId: string, context: any) => {
    const executionId = `exec_${Date.now()}`;
    const startTime = new Date().toISOString();
    
    try {
      // Simple placeholder workflow execution
      const initialState = {
        currentStep: 'starting',
        stepResults: {},
        leadId: context.leadId,
        messageId: context.messageId,
        userId: context.userId || 'user-1',
        businessId: context.businessId || 'business-1',
      };

      // Add initial execution to state
      const initialExecution = mapWorkflowStateToExecution(executionId, workflowId, initialState, startTime);
      setExecutions(prev => [initialExecution, ...prev]);
      
      console.log('Workflow execution completed:', executionId);
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      
      // Update execution with error state
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'failed', endTime: new Date().toISOString() }
          : exec
      ));
    }
  }, [mapWorkflowStateToExecution]);

  // Listen for real-time workflow updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('workflow:execution_started', (data: WorkflowExecution) => {
      setExecutions(prev => [data, ...prev]);
    });

    socket.on('workflow:step_started', (data: { executionId: string; step: WorkflowStep }) => {
      setExecutions(prev => prev.map(execution => 
        execution.id === data.executionId
          ? {
              ...execution,
              steps: execution.steps.map(step =>
                step.id === data.step.id ? { ...step, ...data.step } : step
              ),
              progress: calculateProgress(execution.steps)
            }
          : execution
      ));
    });

    socket.on('workflow:step_completed', (data: { executionId: string; step: WorkflowStep }) => {
      setExecutions(prev => prev.map(execution => 
        execution.id === data.executionId
          ? {
              ...execution,
              steps: execution.steps.map(step =>
                step.id === data.step.id ? { ...step, ...data.step } : step
              ),
              progress: calculateProgress(execution.steps),
              metrics: {
                ...execution.metrics,
                completedSteps: execution.metrics.completedSteps + (data.step.status === 'completed' ? 1 : 0)
              }
            }
          : execution
      ));
    });

    socket.on('workflow:execution_completed', (data: { executionId: string; status: WorkflowExecution['status']; endTime: string }) => {
      setExecutions(prev => prev.map(execution => 
        execution.id === data.executionId
          ? {
              ...execution,
              status: data.status,
              endTime: data.endTime,
              progress: 100
            }
          : execution
      ));
    });

    return () => {
      socket.off('workflow:execution_started');
      socket.off('workflow:step_started');
      socket.off('workflow:step_completed');
      socket.off('workflow:execution_completed');
    };
  }, [socket, isConnected]);

  const calculateProgress = (steps: WorkflowStep[]): number => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const startWorkflow = useCallback(async (templateId: string, context: any = {}) => {
    setIsLoading(true);
    
    try {
      // Execute LangGraph workflow directly
      await executeWorkflow(templateId, context);
    } catch (error) {
      console.error('Failed to start workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [executeWorkflow]);

  const pauseWorkflow = useCallback(async (executionId: string) => {
    // Update execution status to paused
    setExecutions(prev => prev.map(exec => 
      exec.id === executionId ? { ...exec, status: 'paused' } : exec
    ));
  }, []);

  const resumeWorkflow = useCallback(async (executionId: string) => {
    // Find the workflow and continue execution from where it left off
    const execution = executions.find(e => e.id === executionId);
    const workflow = activeWorkflows.get(executionId);
    
    if (execution && workflow) {
      // Resume execution - this would need more sophisticated state management
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId ? { ...exec, status: 'running' } : exec
      ));
    }
  }, [executions, activeWorkflows]);

  const cancelWorkflow = useCallback(async (executionId: string) => {
    // Remove from active workflows and mark as cancelled
    setActiveWorkflows(prev => {
      const newMap = new Map(prev);
      newMap.delete(executionId);
      return newMap;
    });
    
    setExecutions(prev => prev.map(exec => 
      exec.id === executionId 
        ? { ...exec, status: 'cancelled', endTime: new Date().toISOString() } 
        : exec
    ));
  }, []);

  const approveStep = useCallback(async (executionId: string, stepId: string, approval: boolean, comments?: string) => {
    const execution = executions.find(e => e.id === executionId);
    const workflow = activeWorkflows.get(executionId);
    
    if (execution && workflow) {
      // Update the execution with approval and continue workflow
      const updatedSteps = execution.steps.map(step =>
        step.id === stepId 
          ? {
              ...step,
              status: approval ? 'completed' as const : 'failed' as const,
              metadata: {
                ...step.metadata,
                approvedBy: approval ? 'user' : undefined,
                approvedAt: new Date().toISOString(),
              }
            }
          : step
      );

      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { 
              ...exec, 
              steps: updatedSteps,
              status: approval ? 'running' as const : 'failed' as const
            } 
          : exec
      ));

      if (approval) {
        // Continue workflow execution after approval
        // This would require implementing workflow resumption logic
        console.log('Continuing workflow after approval:', executionId);
      }
    }
  }, [executions, activeWorkflows]);

  const retryStep = useCallback(async (executionId: string, stepId: string) => {
    const execution = executions.find(e => e.id === executionId);
    
    if (execution) {
      // Mark step as running again and increment retry count
      const updatedSteps = execution.steps.map(step =>
        step.id === stepId 
          ? {
              ...step,
              status: 'running' as const,
              error: undefined,
              metadata: {
                ...step.metadata,
                retryCount: (step.metadata?.retryCount || 0) + 1,
              }
            }
          : step
      );

      setExecutions(prev => prev.map(exec => 
        exec.id === executionId ? { ...exec, steps: updatedSteps } : exec
      ));

      // In a real implementation, this would re-execute the specific step
      console.log('Retrying step:', stepId, 'for execution:', executionId);
    }
  }, [executions]);

  const getRunningExecutions = () => executions.filter(e => e.status === 'running');
  const getRecentExecutions = () => executions.slice(0, 10);
  
  const stats = {
    totalExecutions: executions.length,
    runningExecutions: executions.filter(e => e.status === 'running').length,
    completedExecutions: executions.filter(e => e.status === 'completed').length,
    failedExecutions: executions.filter(e => e.status === 'failed').length,
    avgSuccessRate: templates.reduce((sum, t) => sum + t.successRate, 0) / templates.length,
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.isActive).length
  };

  return {
    executions,
    templates,
    selectedExecution,
    stats,
    isLoading,
    isConnected,
    setSelectedExecution,
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    approveStep,
    retryStep,
    getRunningExecutions,
    getRecentExecutions
  };
}