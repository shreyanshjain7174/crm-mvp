'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, MessageSquare, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { aiService, type TaskResult } from '@/lib/ai-service';
import { toast } from 'sonner';

interface TaskExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  onTaskCompleted?: () => void;
}

const quickTasks = [
  {
    id: 'qualify_lead',
    title: 'Qualify Lead',
    description: 'Analyze lead information and provide qualification score',
    template: 'Analyze this lead and provide a qualification score (1-10) with detailed reasoning and next steps.'
  },
  {
    id: 'generate_message',
    title: 'Generate Message',
    description: 'Create a personalized WhatsApp message for a lead',
    template: 'Generate a professional but friendly WhatsApp message for this lead. Keep it under 160 characters and include a clear call-to-action.'
  },
  {
    id: 'follow_up',
    title: 'Plan Follow-up',
    description: 'Create a follow-up strategy for a lead',
    template: 'Create a follow-up plan for this lead including timing, method, and key talking points.'
  },
  {
    id: 'custom',
    title: 'Custom Task',
    description: 'Define your own task',
    template: ''
  }
];

export function TaskExecutionDialog({ open, onOpenChange, employeeName, onTaskCompleted }: TaskExecutionDialogProps) {
  const [selectedTask, setSelectedTask] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<TaskResult | null>(null);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTask(taskId);
    const task = quickTasks.find(t => t.id === taskId);
    if (task) {
      setTaskDescription(task.template);
    }
    setResult(null);
  };

  const handleExecute = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please provide a task description');
      return;
    }

    try {
      setIsExecuting(true);
      const taskResult = await aiService.executeTask({
        employee_name: employeeName,
        task_description: taskDescription.trim(),
        context: {}
      });

      setResult(taskResult);
      toast.success('Task completed successfully!');
      onTaskCompleted?.();
    } catch (error) {
      console.error('Failed to execute task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute task');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setSelectedTask('');
    setTaskDescription('');
    setResult(null);
    onOpenChange(false);
  };

  const handleNewTask = () => {
    setSelectedTask('');
    setTaskDescription('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Assign Task to {employeeName}
          </DialogTitle>
          <DialogDescription>
            Give your AI employee a task to complete. They'll work on it autonomously and provide results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!result ? (
            <>
              {/* Quick Task Selection */}
              <div className="space-y-3">
                <Label>Choose a Task Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTask === task.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{task.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {task.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <Label htmlFor="task-description">Task Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Describe what you want the AI employee to do..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={4}
                  disabled={isExecuting}
                />
                <div className="text-xs text-gray-500">
                  Be specific about what you want the AI employee to accomplish.
                </div>
              </div>
            </>
          ) : (
            /* Task Result */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {result.success ? 'Task Completed Successfully' : 'Task Failed'}
                </span>
                <Badge variant="outline" className="text-green-600">
                  ${result.cost} cost
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {result.employee} ({result.role})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Task: {result.task}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium mb-1">Result:</div>
                      <div className="text-sm whitespace-pre-wrap">{result.result}</div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Completed: {new Date(result.completed_at).toLocaleString()}</span>
                      <span>Total tasks by {result.employee}: {result.total_tasks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <>
              <Button variant="outline" onClick={handleNewTask}>
                Assign New Task
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isExecuting}>
                Cancel
              </Button>
              <Button 
                onClick={handleExecute} 
                disabled={isExecuting || !taskDescription.trim()}
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Execute Task
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}