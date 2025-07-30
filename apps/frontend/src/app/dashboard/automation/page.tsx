'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  Settings,
  Target,
  Clock,
  MessageSquare,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Activity,
  ArrowRight,
  Workflow,
  Brain,
  Lock,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { useUserProgressStore, useCanAccessFeature } from '@/stores/userProgress';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'contact_added' | 'message_received' | 'lead_score_change' | 'time_based' | 'pipeline_stage_change';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'send_message' | 'update_lead_score' | 'change_pipeline_stage' | 'create_task' | 'send_notification';
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  executionCount: number;
  successRate: number;
  lastExecuted: string;
  category: 'lead-management' | 'follow-up' | 'scoring' | 'notification';
}

export default function AutomationPage() {
  const router = useRouter();
  const canAccessAutomation = useCanAccessFeature()('automation:rules');
  const { stats } = useUserProgressStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowStats, setWorkflowStats] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workflow data
  useEffect(() => {
    const loadWorkflowData = async () => {
      if (!canAccessAutomation) return;
      
      try {
        setLoading(true);
        const [workflowsData, statsData, templatesData] = await Promise.all([
          apiClient.getWorkflows(),
          apiClient.getWorkflowStats(),
          apiClient.getWorkflowTemplates()
        ]);
        
        setWorkflows(workflowsData.workflows || []);
        setWorkflowStats(statsData.stats || null);
        setTemplates(templatesData.templates || []);
      } catch (error) {
        console.error('Error loading workflow data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflowData();
  }, [canAccessAutomation]);

  // Handle workflow status toggle
  const handleToggleWorkflow = async (workflowId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await apiClient.updateWorkflowStatus(workflowId, newStatus);
      
      // Update local state
      setWorkflows(prev => 
        prev.map(w => w.id === workflowId ? { ...w, status: newStatus } : w)
      );
    } catch (error) {
      console.error('Error toggling workflow:', error);
      alert('Failed to update workflow status. Please try again.');
    }
  };

  // Show feature locked if not expert
  if (!canAccessAutomation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <Zap className="h-10 w-10 text-purple-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Automation Rules Loading... ⚡
            </h3>
            
            <p className="text-gray-600 text-center max-w-md mb-6">
              Custom automation rules are available for Expert users. Continue using your CRM to unlock this powerful automation engine.
            </p>
            
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Activity className="h-4 w-4 mr-2" />
              Continue CRM Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert workflow data to automation rule format for compatibility
  const automationRules: AutomationRule[] = workflows.map(workflow => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    trigger: workflow.triggers?.[0] || { type: 'contact_added', conditions: {} },
    actions: workflow.nodes?.filter((node: any) => node.type === 'action') || [],
    isActive: workflow.status === 'active',
    executionCount: workflow.metadata?.executionCount || 0,
    successRate: workflow.metadata?.successRate || 0,
    lastExecuted: workflow.metadata?.lastExecuted || 'Never',
    category: (workflow.category || 'lead-management') as 'lead-management' | 'follow-up' | 'scoring' | 'notification'
  }));

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead-management': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'scoring': return 'bg-purple-100 text-purple-800';
      case 'notification': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'contact_added': return <Users className="h-4 w-4" />;
      case 'message_received': return <MessageSquare className="h-4 w-4" />;
      case 'lead_score_change': return <BarChart3 className="h-4 w-4" />;
      case 'time_based': return <Clock className="h-4 w-4" />;
      case 'pipeline_stage_change': return <Target className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_message': return <MessageSquare className="h-4 w-4" />;
      case 'update_lead_score': return <BarChart3 className="h-4 w-4" />;
      case 'change_pipeline_stage': return <Target className="h-4 w-4" />;
      case 'create_task': return <CheckCircle className="h-4 w-4" />;
      case 'send_notification': return <AlertCircle className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const totalRules = workflowStats?.totalWorkflows || workflows.length;
  const activeRules = workflowStats?.activeWorkflows || workflows.filter(w => w.status === 'active').length;
  const totalExecutions = workflowStats?.totalExecutions || 0;
  const avgSuccessRate = workflowStats?.successRate || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Automation Rules</h1>
          <p className="text-gray-600">
            Create powerful if-then automation rules to streamline your CRM workflow
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Automation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Workflow className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{activeRules}</p>
            <p className="text-sm text-gray-600">Active Rules</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{totalExecutions}</p>
            <p className="text-sm text-gray-600">Total Executions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{avgSuccessRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{totalRules}</p>
            <p className="text-sm text-gray-600">Total Rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Management */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="builder">Rule Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading automation rules...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {automationRules.length === 0 ? (
                <div className="text-center py-12">
                  <Workflow className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules yet</h3>
                  <p className="text-gray-600 mb-6">Create your first automation rule to streamline your workflow</p>
                  <Button onClick={() => setIsCreating(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Rule
                  </Button>
                </div>
              ) : (
                automationRules.map((rule) => (
                  <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{rule.name}</h3>
                        <Badge className={cn('text-xs', getCategoryColor(rule.category))}>
                          {rule.category.replace('-', ' ')}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {rule.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{rule.description}</p>
                      
                      {/* Rule Logic Display */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
                            {getTriggerIcon(rule.trigger.type)}
                            <span className="text-sm font-medium">
                              {rule.trigger.type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          
                          <div className="flex gap-2">
                            {rule.actions.map((action, index) => (
                              <div key={index} className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                                {getActionIcon(action.type)}
                                <span className="text-sm font-medium">
                                  {action.type.replace('_', ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>{rule.executionCount} executions</span>
                        <span>{rule.successRate}% success rate</span>
                        <span>Last run: {rule.lastExecuted}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={rule.isActive ? "destructive" : "default"}
                        onClick={() => handleToggleWorkflow(rule.id, rule.isActive ? 'active' : 'inactive')}
                      >
                        {rule.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Rule Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Rule Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Drag & Drop Rule Builder</h3>
                <p className="text-gray-600 mb-6">
                  Create complex automation rules with our intuitive visual interface
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
                  <div className="p-4 border border-dashed border-blue-200 rounded-lg">
                    <Target className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <h4 className="font-medium mb-1">Triggers</h4>
                    <p className="text-sm text-gray-600">Contact added, message received, time-based</p>
                  </div>
                  
                  <div className="p-4 border border-dashed border-purple-200 rounded-lg">
                    <Zap className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <h4 className="font-medium mb-1">Conditions</h4>
                    <p className="text-sm text-gray-600">If/then logic, filters, smart routing</p>
                  </div>
                  
                  <div className="p-4 border border-dashed border-green-200 rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <h4 className="font-medium mb-1">Actions</h4>
                    <p className="text-sm text-gray-600">Send message, update status, create task</p>
                  </div>
                </div>
                
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Building Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading templates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold">{template.name}</h4>
                    <Badge className={cn('text-xs', getCategoryColor(template.category))}>
                      {template.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Type:</span> {template.type}
                    </div>
                    <div>
                      <span className="font-medium">Difficulty:</span> {template.difficulty}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {template.estimatedTime}
                    </div>
                  </div>
                  
                  <Button size="sm" variant="outline" className="w-full mt-4">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading analytics...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rule Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {automationRules.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No automation rules to analyze yet
                      </div>
                    ) : (
                      automationRules.map((rule) => (
                        <div key={rule.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{rule.name}</p>
                            <p className="text-xs text-gray-600">{rule.executionCount} executions</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{rule.successRate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-600">success</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Execution by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workflowStats?.categoryCounts ? (
                      Object.entries(workflowStats.categoryCounts).map(([category, count], index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-blue-500' : 
                              index === 1 ? 'bg-green-500' : 
                              index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                            }`}></div>
                            <span className="text-sm capitalize">{category.replace('-', ' ')}</span>
                          </div>
                          <span className="font-medium">{typeof count === 'number' ? count : 0}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No category data available yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}