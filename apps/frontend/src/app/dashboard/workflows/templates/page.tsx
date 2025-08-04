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
  Star,
  Clock,
  Users,
  MessageSquare,
  Target,
  Zap,
  Copy,
  Eye,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead-management' | 'follow-up' | 'scoring' | 'notification';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  type: string;
  rating: number;
  usageCount: number;
  tags: string[];
  preview: {
    triggers: number;
    actions: number;
    conditions: number;
  };
}

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getWorkflowTemplates();
        // Transform API response to match our interface
        const transformedTemplates: WorkflowTemplate[] = (response.templates || []).map((template: any) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category || 'lead-management',
          difficulty: template.difficulty || 'beginner',
          estimatedTime: template.estimatedTime || '5 min',
          type: template.type || 'Automation',
          rating: template.rating || 4.5,
          usageCount: template.usageCount || 0,
          tags: template.tags || [],
          preview: template.preview || { triggers: 1, actions: 1, conditions: 0 }
        }));
        setTemplates(transformedTemplates);
        setFilteredTemplates(transformedTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
        // Mock data for demonstration
        const mockTemplates: WorkflowTemplate[] = [
          {
            id: '1',
            name: 'Welcome New Contacts',
            description: 'Automatically send a welcome message to new contacts and add them to a nurture sequence',
            category: 'lead-management' as const,
            difficulty: 'beginner' as const,
            estimatedTime: '5 min',
            type: 'Communication',
            rating: 4.8,
            usageCount: 1250,
            tags: ['welcome', 'onboarding', 'automation'],
            preview: { triggers: 1, actions: 3, conditions: 1 }
          },
          {
            id: '2',
            name: 'Lead Scoring System',
            description: 'Score leads based on engagement, demographics, and behavior patterns',
            category: 'scoring' as const,
            difficulty: 'intermediate' as const,
            estimatedTime: '15 min',
            type: 'Scoring',
            rating: 4.6,
            usageCount: 890,
            tags: ['scoring', 'qualification', 'analytics'],
            preview: { triggers: 2, actions: 4, conditions: 5 }
          },
          {
            id: '3',
            name: 'Follow-up Reminder System',
            description: 'Create automated follow-up reminders based on deal stage and last contact date',
            category: 'follow-up' as const,
            difficulty: 'intermediate' as const,
            estimatedTime: '10 min',
            type: 'Task Management',
            rating: 4.7,
            usageCount: 670,
            tags: ['follow-up', 'reminders', 'tasks'],
            preview: { triggers: 3, actions: 2, conditions: 3 }
          },
          {
            id: '4',
            name: 'Hot Lead Notifications',
            description: 'Instantly notify sales team when a lead becomes hot based on scoring criteria',
            category: 'notification' as const,
            difficulty: 'beginner' as const,
            estimatedTime: '3 min',
            type: 'Notification',
            rating: 4.9,
            usageCount: 1540,
            tags: ['notifications', 'alerts', 'hot-leads'],
            preview: { triggers: 1, actions: 2, conditions: 2 }
          },
          {
            id: '5',
            name: 'Abandoned Cart Recovery',
            description: 'Re-engage prospects who showed interest but didn\'t complete the desired action',
            category: 'follow-up' as const,
            difficulty: 'advanced' as const,
            estimatedTime: '20 min',
            type: 'Re-engagement',
            rating: 4.5,
            usageCount: 420,
            tags: ['recovery', 'engagement', 'conversion'],
            preview: { triggers: 2, actions: 5, conditions: 4 }
          },
          {
            id: '6',
            name: 'Meeting Scheduler',
            description: 'Automatically schedule meetings based on lead qualification and availability',
            category: 'lead-management' as const,
            difficulty: 'advanced' as const,
            estimatedTime: '25 min',
            type: 'Scheduling',
            rating: 4.4,
            usageCount: 310,
            tags: ['scheduling', 'meetings', 'qualification'],
            preview: { triggers: 1, actions: 6, conditions: 3 }
          }
        ];
        setTemplates(mockTemplates);
        setFilteredTemplates(mockTemplates);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  useEffect(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, selectedDifficulty]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead-management': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'scoring': return 'bg-purple-100 text-purple-800';
      case 'notification': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUseTemplate = (templateId: string) => {
    router.push(`/dashboard/workflows/builder?template=${templateId}`);
  };

  const handlePreviewTemplate = (templateId: string) => {
    // TODO: Implement template preview
    console.log('Preview template:', templateId);
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
            <h1 className="text-3xl font-bold mb-2">Workflow Templates</h1>
            <p className="text-gray-600">
              Choose from our library of pre-built workflow templates
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
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

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-xs', getCategoryColor(template.category))}>
                      {template.category.replace('-', ' ')}
                    </Badge>
                    <Badge className={cn('text-xs', getDifficultyColor(template.difficulty))}>
                      {template.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs text-gray-600">{template.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{template.description}</p>
                
                {/* Template Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.estimatedTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {template.usageCount} uses
                  </div>
                </div>

                {/* Preview Components */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-blue-500" />
                    <span>{template.preview.triggers} triggers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-green-500" />
                    <span>{template.preview.actions} actions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Filter className="h-3 w-3 text-purple-500" />
                    <span>{template.preview.conditions} conditions</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{template.tags.length - 3} more
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewTemplate(template.id)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setSelectedDifficulty('all');
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}