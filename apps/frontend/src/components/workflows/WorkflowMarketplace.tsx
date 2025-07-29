'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  Download,
  Clock,
  Users,
  Zap,
  Bot,
  GitBranch,
  TrendingUp,
  Shield,
  MessageSquare,
  Mail,
  Database,
  Code,
  Brain,
  Workflow,
  Plus,
  Eye,
  Play,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'support' | 'marketing' | 'automation' | 'ai' | 'integration';
  type: 'n8n' | 'langgraph' | 'hybrid';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  downloads: number;
  estimatedTime: string;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  tags: string[];
  preview: {
    nodes: number;
    connections: number;
    triggers: string[];
    actions: string[];
  };
  benefits: string[];
  requirements: string[];
  screenshots?: string[];
  createdAt: string;
  updatedAt: string;
}

const SAMPLE_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'lead-nurturing-ai',
    name: 'AI-Powered Lead Nurturing',
    description: 'Intelligent lead nurturing sequence that personalizes messages based on prospect behavior and profile data using advanced AI.',
    category: 'sales',
    type: 'hybrid',
    difficulty: 'intermediate',
    rating: 4.8,
    downloads: 1247,
    estimatedTime: '30 minutes',
    author: {
      name: 'CRM Expert',
      verified: true
    },
    tags: ['lead generation', 'ai personalization', 'email automation', 'scoring'],
    preview: {
      nodes: 8,
      connections: 12,
      triggers: ['New Lead', 'Email Open', 'Link Click'],
      actions: ['AI Personalize', 'Send Email', 'Update CRM', 'Schedule Follow-up']
    },
    benefits: [
      'Increase conversion rates by 35%',
      'Reduce manual work by 80%',
      'Personalized at scale',
      'Real-time behavioral triggers'
    ],
    requirements: [
      'Email service integration',
      'CRM system access',
      'AI model access (GPT-4)'
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: 'customer-support-bot',
    name: 'Intelligent Support Bot',
    description: 'Multi-channel customer support bot with intent recognition, knowledge base integration, and human handoff capabilities.',
    category: 'support',
    type: 'langgraph',
    difficulty: 'advanced',
    rating: 4.9,
    downloads: 892,
    estimatedTime: '45 minutes',
    author: {
      name: 'AI Solutions',
      verified: true
    },
    tags: ['customer support', 'chatbot', 'intent recognition', 'knowledge base'],
    preview: {
      nodes: 12,
      connections: 18,
      triggers: ['Message Received', 'Escalation Request'],
      actions: ['Intent Analysis', 'Knowledge Search', 'Response Generation', 'Human Handoff']
    },
    benefits: [
      '24/7 customer support',
      '90% query resolution',
      'Instant response time',
      'Seamless escalation'
    ],
    requirements: [
      'Chat platform integration',
      'Knowledge base access',
      'LLM API access'
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18'
  },
  {
    id: 'sales-pipeline-automation',
    name: 'Complete Sales Pipeline',
    description: 'End-to-end sales automation with lead scoring, opportunity tracking, and automated follow-ups.',
    category: 'sales',
    type: 'n8n',
    difficulty: 'beginner',
    rating: 4.6,
    downloads: 2156,
    estimatedTime: '20 minutes',
    author: {
      name: 'Sales Pro',
      verified: false
    },
    tags: ['sales pipeline', 'lead scoring', 'automation', 'crm integration'],
    preview: {
      nodes: 6,
      connections: 8,
      triggers: ['New Opportunity', 'Stage Change'],
      actions: ['Score Lead', 'Assign Rep', 'Send Notification', 'Update Pipeline']
    },
    benefits: [
      'Automated lead routing',
      'Consistent follow-up',
      'Better conversion tracking',
      'Sales team efficiency'
    ],
    requirements: [
      'CRM system',
      'Email service',
      'Calendar integration'
    ],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12'
  },
  {
    id: 'content-generation',
    name: 'AI Content Generator',
    description: 'Automated content creation workflow for social media, blogs, and marketing materials using advanced AI models.',
    category: 'marketing',
    type: 'langgraph',
    difficulty: 'intermediate',
    rating: 4.7,
    downloads: 743,
    estimatedTime: '35 minutes',
    author: {
      name: 'Content AI',
      verified: true
    },
    tags: ['content creation', 'ai writing', 'social media', 'marketing'],
    preview: {
      nodes: 10,
      connections: 14,
      triggers: ['Content Request', 'Schedule Trigger'],
      actions: ['Topic Research', 'Content Generation', 'Review Process', 'Publish Content']
    },
    benefits: [
      'Consistent content output',
      'Brand voice maintained',
      'Multi-platform publishing',
      'Performance optimization'
    ],
    requirements: [
      'AI writing model',
      'Social media APIs',
      'Content management system'
    ],
    createdAt: '2024-01-08',
    updatedAt: '2024-01-16'
  },
  {
    id: 'data-sync-automation',
    name: 'Multi-System Data Sync',
    description: 'Keep your CRM, marketing tools, and databases in perfect sync with bi-directional data flow and conflict resolution.',
    category: 'integration',
    type: 'n8n',
    difficulty: 'advanced',
    rating: 4.5,
    downloads: 567,
    estimatedTime: '60 minutes',
    author: {
      name: 'Integration Expert',
      verified: true
    },
    tags: ['data sync', 'integration', 'automation', 'database'],
    preview: {
      nodes: 15,
      connections: 22,
      triggers: ['Data Change', 'Sync Schedule'],
      actions: ['Data Transform', 'Conflict Resolution', 'Sync Records', 'Error Handling']
    },
    benefits: [
      'Real-time data sync',
      'Conflict resolution',
      'Error recovery',
      'Audit trail'
    ],
    requirements: [
      'Multiple system APIs',
      'Database access',
      'Webhook support'
    ],
    createdAt: '2024-01-03',
    updatedAt: '2024-01-14'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layers },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'support', label: 'Support', icon: Shield },
  { id: 'marketing', label: 'Marketing', icon: MessageSquare },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'ai', label: 'AI', icon: Brain },
  { id: 'integration', label: 'Integration', icon: Database }
];

export function WorkflowMarketplace() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(SAMPLE_TEMPLATES);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>(SAMPLE_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(t => t.difficulty === selectedDifficulty);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort templates
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, selectedType, selectedDifficulty, searchQuery, sortBy]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'n8n': return Workflow;
      case 'langgraph': return Brain;
      case 'hybrid': return GitBranch;
      default: return Code;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'n8n': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'langgraph': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hybrid': return 'bg-gradient-to-r from-blue-100 to-purple-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const installTemplate = async (template: WorkflowTemplate) => {
    try {
      // TODO: Implement actual template installation
      console.log('Installing template:', template.id);
      alert(`Installing "${template.name}" workflow template...`);
    } catch (error) {
      alert('Failed to install template: ' + error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Workflow Marketplace</h2>
          <p className="text-muted-foreground">
            Discover and install pre-built workflows for n8n and LangGraph
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Submit Template
          </Button>
          <Button>
            <BookOpen className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="n8n">n8n</SelectItem>
                <SelectItem value="langgraph">LangGraph</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {CATEGORIES.map(category => {
                  const Icon = category.icon;
                  const count = category.id === 'all' 
                    ? templates.length 
                    : templates.filter(t => t.category === category.id).length;
                    
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 text-left hover:bg-muted transition-colors",
                        selectedCategory === category.id && "bg-muted border-r-2 border-primary"
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTemplates.map(template => {
              const TypeIcon = getTypeIcon(template.type);
              
              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <TypeIcon className="w-5 h-5" />
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {template.name}
                            </h3>
                            {template.author.verified && (
                              <Award className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={cn("border", getTypeColor(template.type))}>
                          {template.type}
                        </Badge>
                        <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{template.rating}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Download className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{template.downloads}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{template.estimatedTime}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={template.author.avatar} />
                              <AvatarFallback className="text-xs">
                                {template.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {template.author.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                installTemplate(template);
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Install
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <span>{selectedTemplate.name}</span>
                  <Badge className={cn("border", getTypeColor(selectedTemplate.type))}>
                    {selectedTemplate.type}
                  </Badge>
                  {selectedTemplate.author.verified && (
                    <Award className="w-4 h-4 text-blue-500" />
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <p className="text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedTemplate.rating}</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedTemplate.downloads}</div>
                    <div className="text-sm text-muted-foreground">Downloads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedTemplate.preview.nodes}</div>
                    <div className="text-sm text-muted-foreground">Nodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedTemplate.estimatedTime}</div>
                    <div className="text-sm text-muted-foreground">Setup Time</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Benefits</h4>
                    <ul className="space-y-2">
                      {selectedTemplate.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {selectedTemplate.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-3">Workflow Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Triggers</h5>
                      <div className="space-y-1">
                        {selectedTemplate.preview.triggers.map((trigger, index) => (
                          <Badge key={index} variant="outline" className="mr-1">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Actions</h5>
                      <div className="space-y-1">
                        {selectedTemplate.preview.actions.map((action, index) => (
                          <Badge key={index} variant="outline" className="mr-1">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedTemplate.author.avatar} />
                      <AvatarFallback>
                        {selectedTemplate.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{selectedTemplate.author.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Updated {new Date(selectedTemplate.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Try Demo
                    </Button>
                    <Button onClick={() => installTemplate(selectedTemplate)}>
                      <Download className="w-4 h-4 mr-2" />
                      Install Template
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}