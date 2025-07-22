'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  Settings,
  Zap,
  Clock,
  Target,
  MessageSquare,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useUserProgressStore, useCanAccessFeature } from '@/stores/userProgress';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { NodePalette } from '@/components/workflow/NodePalette';
import { useWorkflowStore } from '@/stores/workflowBuilder';
import { WorkflowNodeType } from '@/types/workflow-types';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead-management' | 'follow-up' | 'automation' | 'analytics';
  triggers: string[];
  actions: string[];
  estimatedTimeSaved: number;
  complexity: 'simple' | 'medium' | 'advanced';
  isActive: boolean;
  usageCount: number;
}

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  title: string;
  description: string;
  config: Record<string, any>;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const canAccessWorkflows = useCanAccessFeature()('workflows:custom');
  const { stats } = useUserProgressStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Show feature locked if not expert
  if (!canAccessWorkflows) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <Workflow className="h-10 w-10 text-purple-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Workflow Builder Loading... ⚡
            </h3>
            
            <p className="text-gray-600 text-center max-w-md mb-6">
              Workflow builder is available for Expert users. Continue using your CRM to unlock this powerful automation tool.
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

  // Mock workflow templates
  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 'lead-nurture',
      name: 'Lead Nurturing Sequence',
      description: 'Automatically follow up with new leads over 7 days',
      category: 'lead-management',
      triggers: ['New Lead Created', 'Lead Status Changed'],
      actions: ['Send WhatsApp Message', 'Update Lead Score', 'Schedule Follow-up'],
      estimatedTimeSaved: 5.2,
      complexity: 'simple',
      isActive: true,
      usageCount: 45
    },
    {
      id: 'response-automation',
      name: 'Smart Response Automation',
      description: 'AI-powered auto-responses based on message content',
      category: 'automation',
      triggers: ['Message Received', 'Keyword Detected'],
      actions: ['Generate AI Response', 'Tag Conversation', 'Notify Team'],
      estimatedTimeSaved: 8.7,
      complexity: 'medium',
      isActive: true,
      usageCount: 23
    },
    {
      id: 'pipeline-management',
      name: 'Pipeline Stage Automation',
      description: 'Automatically move leads through pipeline stages',
      category: 'lead-management',
      triggers: ['Lead Score Updated', 'Activity Completed'],
      actions: ['Change Pipeline Stage', 'Send Notification', 'Update Priority'],
      estimatedTimeSaved: 3.5,
      complexity: 'medium',
      isActive: false,
      usageCount: 12
    },
    {
      id: 'follow-up-reminders',
      name: 'Smart Follow-up Reminders',
      description: 'Intelligent reminders based on lead engagement',
      category: 'follow-up',
      triggers: ['No Response for X Days', 'Lead Engagement Drop'],
      actions: ['Create Task', 'Send Reminder', 'Escalate to Manager'],
      estimatedTimeSaved: 4.3,
      complexity: 'simple',
      isActive: true,
      usageCount: 67
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead-management': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'automation': return 'bg-purple-100 text-purple-800';
      case 'analytics': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalTimeSaved = workflowTemplates
    .filter(w => w.isActive)
    .reduce((sum, w) => sum + (w.estimatedTimeSaved * w.usageCount), 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflow Builder</h1>
          <p className="text-gray-600">
            Create powerful automation workflows with our no-code visual builder
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
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Workflow className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{workflowTemplates.filter(w => w.isActive).length}</p>
            <p className="text-sm text-gray-600">Active Workflows</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{totalTimeSaved.toFixed(1)}h</p>
            <p className="text-sm text-gray-600">Time Saved This Month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">
              {workflowTemplates.reduce((sum, w) => sum + w.usageCount, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Executions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">94%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Management */}
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="builder">Visual Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflowTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge className={cn('text-xs', getCategoryColor(template.category))}>
                          {template.category.replace('-', ' ')}
                        </Badge>
                        <Badge className={cn('text-xs', getComplexityColor(template.complexity))}>
                          {template.complexity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium">Triggers:</span> {template.triggers.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Actions:</span> {template.actions.slice(0, 2).join(', ')}
                          {template.actions.length > 2 && ` +${template.actions.length - 2} more`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {template.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{template.usageCount}</span> executions • 
                      <span className="font-medium"> {template.estimatedTimeSaved}h</span> saved per month
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={template.isActive ? "destructive" : "default"}
                      >
                        {template.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Active Workflows Tab */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currently Running Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowTemplates.filter(w => w.isActive).map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{workflow.name}</h4>
                        <p className="text-sm text-gray-600">Last run: 2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-medium">{workflow.usageCount} executions</div>
                        <div className="text-gray-500">94% success rate</div>
                      </div>
                      
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <WorkflowBuilderInterface />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Execution Time</span>
                    <span className="font-medium">1.2s</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-medium">6%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '6%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Time Savings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { category: 'Lead Management', hours: 15.2, color: 'bg-blue-500' },
                    { category: 'Follow-up Automation', hours: 12.8, color: 'bg-green-500' },
                    { category: 'Message Responses', hours: 8.3, color: 'bg-purple-500' },
                    { category: 'Pipeline Updates', hours: 5.1, color: 'bg-orange-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <span className="font-medium">{item.hours}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowBuilderInterface() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const { clearWorkflow, validateWorkflow, addNode } = useWorkflowStore();

  const handleSaveWorkflow = () => {
    console.log('Saving workflow...');
    // Implementation for saving workflow
  };

  const handleTestWorkflow = () => {
    const validation = validateWorkflow();
    if (!validation.isValid) {
      alert(`Workflow validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    console.log('Testing workflow...');
    // Implementation for testing workflow
  };

  const createNewWorkflow = () => {
    const workflowId = `workflow-${Date.now()}`;
    setSelectedWorkflow(workflowId);
    clearWorkflow();
    setShowBuilder(true);
  };

  const handleNodeDrop = (type: WorkflowNodeType, position: { x: number; y: number }) => {
    if (selectedWorkflow) {
      addNode(type, position, selectedWorkflow);
    }
  };

  if (showBuilder && selectedWorkflow) {
    return (
      <div className="h-[800px] border rounded-lg overflow-hidden bg-white">
        {/* Builder Header */}
        <div className="border-b bg-gray-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowBuilder(false)}
            >
              ← Back to Templates
            </Button>
            <div>
              <h3 className="font-semibold">Workflow Builder</h3>
              <p className="text-sm text-gray-600">Drag nodes from the palette to create your workflow</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveWorkflow}>
              <Settings className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={handleTestWorkflow}>
              <Play className="w-4 h-4 mr-2" />
              Test
            </Button>
          </div>
        </div>

        {/* Builder Interface */}
        <div className="flex h-full">
          {/* Node Palette */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <NodePalette onNodeDrop={handleNodeDrop} />
          </div>

          {/* Workflow Canvas */}
          <div className="flex-1">
            <WorkflowCanvas
              workflowId={selectedWorkflow}
              onSave={handleSaveWorkflow}
              onTest={handleTestWorkflow}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Workflow Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Workflow className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Drag & Drop Workflow Builder</h3>
          <p className="text-gray-600 mb-6">
            Create complex automation workflows with our intuitive visual interface
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <div className="p-4 border border-dashed border-blue-200 rounded-lg">
              <Target className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h4 className="font-medium mb-1">Triggers</h4>
              <p className="text-sm text-gray-600">New lead, message received, time-based</p>
            </div>
            
            <div className="p-4 border border-dashed border-purple-200 rounded-lg">
              <Zap className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <h4 className="font-medium mb-1">Actions</h4>
              <p className="text-sm text-gray-600">Send message, update status, create task</p>
            </div>
            
            <div className="p-4 border border-dashed border-green-200 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <h4 className="font-medium mb-1">Conditions</h4>
              <p className="text-sm text-gray-600">If/then logic, filters, smart routing</p>
            </div>
          </div>
          
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={createNewWorkflow}
          >
            <Plus className="h-4 w-4 mr-2" />
            Start Building Workflow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}