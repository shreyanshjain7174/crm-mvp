'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, Plus, Activity, Clock, DollarSign, Users, MessageSquare, BarChart3, Sparkles, Settings } from 'lucide-react';
import { CreateEmployeeDialog } from './create-employee-dialog';
import { TaskExecutionDialog } from './task-execution-dialog';
import { aiService, type AIEmployee, type AIServiceHealth } from '@/lib/ai-service';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const roleIcons = {
  'Sales Development Agent': Users,
  'Customer Success Agent': MessageSquare,
  'Marketing Agent': Sparkles,
  'Data Analyst Agent': BarChart3,
};

export function AIEmployeesDashboard() {
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [health, setHealth] = useState<AIServiceHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [employeeList, healthData] = await Promise.all([
        aiService.listEmployees(),
        aiService.healthCheck()
      ]);
      
      setEmployees(employeeList);
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load AI employees dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeCreated = (newEmployee: AIEmployee) => {
    setEmployees(prev => [...prev, newEmployee]);
    // Refresh health data to get updated counts
    loadDashboardData();
  };

  const handleCreateStarterTeam = async () => {
    try {
      await aiService.createStarterTeam();
      toast.success('Starter AI team created successfully!');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to create starter team:', error);
      toast.error('Failed to create starter team');
    }
  };

  const handleAssignTask = (employeeName: string) => {
    setSelectedEmployee(employeeName);
    setShowTaskDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  const isAIHealthy = health?.ai_system?.status === 'healthy';
  const totalTasks = employees.reduce((sum, emp) => sum + emp.tasks_completed, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Employees</h1>
          <p className="text-gray-600">Manage your autonomous AI workforce</p>
        </div>
        <div className="flex gap-2">
          {employees.length === 0 && (
            <Button variant="outline" onClick={handleCreateStarterTeam}>
              <Users className="w-4 h-4 mr-2" />
              Create Starter Team
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create AI Employee
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isAIHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <div className="text-sm font-medium">AI System</div>
                <div className="text-xs text-gray-500">
                  {health?.ai_system?.status || 'Unknown'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium">{employees.length} Employees</div>
                <div className="text-xs text-gray-500">Active AI workforce</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-medium">{totalTasks} Tasks</div>
                <div className="text-xs text-gray-500">Completed total</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium">$0 Cost</div>
                <div className="text-xs text-gray-500">Local AI savings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Models Info */}
      {health?.ai_system?.available_models && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              Available AI Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {health.ai_system.available_models.map((model, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {model}
                  {model === health.ai_system.default_model && (
                    <span className="ml-1 text-green-600">(default)</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees Grid */}
      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Employees Yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Create your first AI employee to start automating tasks in your CRM. Each employee works independently with zero ongoing costs.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleCreateStarterTeam} variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Create Starter Team
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Employee
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => {
            const Icon = roleIcons[employee.role as keyof typeof roleIcons] || Bot;
            const createdAt = new Date(employee.created_at);
            
            return (
              <Card key={employee.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                    {employee.name}
                  </CardTitle>
                  <CardDescription>{employee.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tasks Completed:</span>
                    <span className="font-medium">{employee.tasks_completed}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {formatDistanceToNow(createdAt, { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </div>

                  <Separator />

                  <Button 
                    onClick={() => handleAssignTask(employee.name)}
                    className="w-full"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Assign Task
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreateEmployeeDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEmployeeCreated={handleEmployeeCreated}
      />

      <TaskExecutionDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        employeeName={selectedEmployee}
        onTaskCompleted={() => loadDashboardData()}
      />
    </div>
  );
}