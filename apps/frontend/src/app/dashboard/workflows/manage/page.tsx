'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Search,
  Filter,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface ManagedWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  category: 'lead-management' | 'follow-up' | 'scoring' | 'notification';
  createdAt: string;
  updatedAt: string;
  lastExecuted: string;
  executionCount: number;
  successRate: number;
  createdBy: string;
  triggers: Array<{
    type: string;
    description: string;
  }>;
  actions: Array<{
    type: string;
    description: string;
  }>;
}

export default function WorkflowManagePage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<ManagedWorkflow[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<ManagedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getWorkflows();
        const workflowData = response.workflows || [];
        
        // Transform the data to match our interface
        const managedWorkflows: ManagedWorkflow[] = workflowData.map((workflow: any) => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status || 'draft',
          category: workflow.category || 'lead-management',
          createdAt: workflow.createdAt || '2024-01-01',
          updatedAt: workflow.updatedAt || '2024-01-01',
          lastExecuted: workflow.metadata?.lastExecuted || 'Never',
          executionCount: workflow.metadata?.executionCount || 0,
          successRate: workflow.metadata?.successRate || 0,
          createdBy: workflow.createdBy || 'System',
          triggers: workflow.triggers || [],
          actions: workflow.nodes?.filter((node: any) => node.type === 'action') || []
        }));

        setWorkflows(managedWorkflows);
        setFilteredWorkflows(managedWorkflows);
      } catch (error) {
        console.error('Error loading workflows:', error);
        // Mock data for demonstration
        const mockWorkflows: ManagedWorkflow[] = [
          {
            id: '1',
            name: 'Welcome New Contacts',
            description: 'Automatically send welcome messages to new contacts and add them to nurture sequences',
            status: 'active',
            category: 'lead-management',
            createdAt: '2024-01-15',
            updatedAt: '2024-01-20',
            lastExecuted: '2 minutes ago',
            executionCount: 1247,
            successRate: 95.0,
            createdBy: 'John Doe',
            triggers: [{ type: 'contact_added', description: 'When a new contact is added' }],
            actions: [
              { type: 'send_message', description: 'Send welcome email' },
              { type: 'add_to_sequence', description: 'Add to nurture sequence' }
            ]
          },
          {
            id: '2',
            name: 'Lead Scoring System',
            description: 'Score leads based on engagement, demographics, and behavior patterns',
            status: 'active',
            category: 'scoring',
            createdAt: '2024-01-10',
            updatedAt: '2024-01-18',
            lastExecuted: '5 minutes ago',
            executionCount: 890,
            successRate: 94.9,
            createdBy: 'Jane Smith',
            triggers: [
              { type: 'lead_score_change', description: 'When lead score changes' },
              { type: 'contact_updated', description: 'When contact is updated' }
            ],
            actions: [
              { type: 'update_lead_score', description: 'Update lead score' },
              { type: 'send_notification', description: 'Notify sales team' }
            ]
          },
          {
            id: '3',
            name: 'Follow-up Reminder System',
            description: 'Create automated follow-up reminders based on deal stage and last contact date',
            status: 'inactive',
            category: 'follow-up',
            createdAt: '2024-01-05',
            updatedAt: '2024-01-25',
            lastExecuted: '1 hour ago',
            executionCount: 670,
            successRate: 89.3,
            createdBy: 'Mike Johnson',
            triggers: [
              { type: 'time_based', description: 'Time-based trigger' },
              { type: 'pipeline_stage_change', description: 'When deal stage changes' }
            ],
            actions: [
              { type: 'create_task', description: 'Create follow-up task' },
              { type: 'send_notification', description: 'Send reminder' }
            ]
          },
          {
            id: '4',
            name: 'Hot Lead Notifications',
            description: 'Instantly notify sales team when a lead becomes hot based on scoring criteria',
            status: 'draft',
            category: 'notification',
            createdAt: '2024-01-28',
            updatedAt: '2024-01-28',
            lastExecuted: 'Never',
            executionCount: 0,
            successRate: 0,
            createdBy: 'Sarah Wilson',
            triggers: [{ type: 'lead_score_change', description: 'When lead becomes hot' }],
            actions: [{ type: 'send_notification', description: 'Notify sales team' }]
          }
        ];
        
        setWorkflows(mockWorkflows);
        setFilteredWorkflows(mockWorkflows);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  useEffect(() => {
    let filtered = workflows;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(workflow => workflow.status === selectedStatus);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(workflow => workflow.category === selectedCategory);
    }

    setFilteredWorkflows(filtered);
  }, [workflows, searchTerm, selectedStatus, selectedCategory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead-management': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'scoring': return 'bg-purple-100 text-purple-800';
      case 'notification': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'inactive': return <Pause className="h-3 w-3" />;
      case 'draft': return <Clock className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const handleToggleWorkflow = async (workflowId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await apiClient.updateWorkflowStatus(workflowId, newStatus);
      
      setWorkflows(prev =>
        prev.map(w => w.id === workflowId ? { ...w, status: newStatus as any } : w)
      );
    } catch (error) {
      console.error('Error toggling workflow:', error);
      alert('Failed to update workflow status. Please try again.');
    }
  };

  const handleEditWorkflow = (workflowId: string) => {
    router.push(`/dashboard/workflows/builder?edit=${workflowId}`);
  };

  const handleDuplicateWorkflow = async (workflowId: string) => {
    try {
      await apiClient.duplicateWorkflow(workflowId);
      // Reload workflows
      window.location.reload();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      alert('Failed to duplicate workflow. Please try again.');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      try {
        await apiClient.deleteWorkflow(workflowId);
        setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      } catch (error) {
        console.error('Error deleting workflow:', error);
        alert('Failed to delete workflow. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Workflows</h1>
            <p className="text-gray-600">
              View, edit, and manage all your automation workflows
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => router.push('/dashboard/workflows/builder')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
        >
          <option value="all">All Categories</option>
          <option value="lead-management">Lead Management</option>
          <option value="follow-up">Follow-up</option>
          <option value="scoring">Scoring</option>
          <option value="notification">Notification</option>
        </select>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading workflows...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedCategory('all');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{workflow.name}</h3>
                        <Badge className={cn('text-xs flex items-center gap-1', getStatusColor(workflow.status))}>
                          {getStatusIcon(workflow.status)}
                          {workflow.status}
                        </Badge>
                        <Badge className={cn('text-xs', getCategoryColor(workflow.category))}>
                          {workflow.category.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{workflow.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Created by:</span>
                          <p className="font-medium">{workflow.createdBy}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Executions:</span>
                          <p className="font-medium">{workflow.executionCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Success Rate:</span>
                          <p className="font-medium">{workflow.successRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Run:</span>
                          <p className="font-medium">{workflow.lastExecuted}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                        <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                        <span>{workflow.triggers.length} triggers</span>
                        <span>{workflow.actions.length} actions</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWorkflow(workflow.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={workflow.status === 'active' ? "destructive" : "default"}
                        onClick={() => handleToggleWorkflow(workflow.id, workflow.status)}
                        disabled={workflow.status === 'draft'}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow.id)}>
                            <Copy className="h-3 w-3 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}