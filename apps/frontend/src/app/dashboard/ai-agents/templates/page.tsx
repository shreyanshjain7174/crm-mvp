'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Star, Play, Copy, Eye, MoreHorizontal, FileText, MessageSquare, Zap, Bot, Workflow, Settings, Plus, Upload, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProgressStore } from '@/stores/userProgress';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'support' | 'marketing' | 'automation' | 'analytics';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  rating: number;
  downloads: number;
  tags: string[];
  author: string;
  preview: string;
  actions: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
}

const mockTemplates: AgentTemplate[] = [
  {
    id: '1',
    name: 'Lead Qualification Bot',
    description: 'Automatically qualify incoming leads by asking relevant questions and scoring their potential.',
    category: 'sales',
    difficulty: 'beginner',
    estimatedTime: '5 min setup',
    rating: 4.8,
    downloads: 1250,
    tags: ['lead-gen', 'qualification', 'whatsapp'],
    author: 'CRM Team',
    preview: 'Hi! I\'m here to help you find the perfect solution. Could you tell me about your business size?',
    actions: ['Qualify leads', 'Score prospects', 'Route to sales'],
    isPopular: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Follow-up Reminder Assistant',
    description: 'Never miss a follow-up again. Automatically reminds you and your team about pending follow-ups.',
    category: 'automation',
    difficulty: 'beginner',
    estimatedTime: '3 min setup',
    rating: 4.6,
    downloads: 980,
    tags: ['reminders', 'follow-up', 'productivity'],
    author: 'Productivity Suite',
    preview: 'Reminder: Follow up with John Doe about the proposal sent 3 days ago.',
    actions: ['Set reminders', 'Track follow-ups', 'Send notifications'],
    isPopular: true,
  },
  {
    id: '3',
    name: 'Customer Support Chatbot',
    description: 'Handle common customer queries instantly with intelligent responses and escalation to humans when needed.',
    category: 'support',
    difficulty: 'intermediate',
    estimatedTime: '10 min setup',
    rating: 4.7,
    downloads: 2100,
    tags: ['support', 'chatbot', 'automation'],
    author: 'Support Solutions',
    preview: 'Hello! I\'m here to help. What can I assist you with today?',
    actions: ['Answer queries', 'Escalate issues', 'Collect feedback'],
  },
  {
    id: '4',
    name: 'Sales Pipeline Analyzer',
    description: 'Advanced analytics agent that provides insights into your sales pipeline and conversion rates.',
    category: 'analytics',
    difficulty: 'advanced',
    estimatedTime: '15 min setup',
    rating: 4.9,
    downloads: 750,
    tags: ['analytics', 'pipeline', 'insights'],
    author: 'Data Insights',
    preview: 'Your conversion rate has increased by 12% this month. Here are the key factors...',
    actions: ['Analyze pipeline', 'Generate reports', 'Provide insights'],
  },
  {
    id: '5',
    name: 'Product Demo Scheduler',
    description: 'Intelligently schedules product demos based on lead quality and availability.',
    category: 'sales',
    difficulty: 'intermediate',
    estimatedTime: '8 min setup',
    rating: 4.5,
    downloads: 650,
    tags: ['scheduling', 'demo', 'sales'],
    author: 'Sales Automation',
    preview: 'I\'d love to show you how our platform works. When would be a good time for a 30-minute demo?',
    actions: ['Schedule demos', 'Check availability', 'Send confirmations'],
  },
  {
    id: '6',
    name: 'Email Campaign Assistant',
    description: 'Creates and manages personalized email campaigns based on customer segments and behavior.',
    category: 'marketing',
    difficulty: 'advanced',
    estimatedTime: '20 min setup',
    rating: 4.4,
    downloads: 890,
    tags: ['email', 'marketing', 'personalization'],
    author: 'Marketing Pro',
    preview: 'Creating personalized email for John based on his recent website activity...',
    actions: ['Create campaigns', 'Segment audiences', 'Track performance'],
  },
];

const categoryIcons = {
  sales: Zap,
  support: MessageSquare,
  marketing: Bot,
  automation: Workflow,
  analytics: FileText,
};

const categoryColors = {
  sales: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  support: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  marketing: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
  automation: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20',
  analytics: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20',
};

const difficultyColors = {
  beginner: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  intermediate: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
  advanced: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
};

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showBuilder, setShowBuilder] = useState(false);

  const canAccessFeature = useUserProgressStore(state => state.canAccessFeature);
  const hasAIAccess = canAccessFeature('ai_features');

  if (!hasAIAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Agent Templates</h1>
          <p className="text-muted-foreground">Pre-built AI agent templates to accelerate your automation</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              AI Templates Feature Locked
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Access pre-built AI agent templates to quickly automate your workflow. Unlock this feature by exploring AI capabilities first.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/ai-assistant'}>
              Explore AI Features
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const featuredTemplates = mockTemplates.filter(t => t.isFeatured);
  const popularTemplates = mockTemplates.filter(t => t.isPopular).slice(0, 3);

  const handleUseTemplate = (template: AgentTemplate) => {
    // In a real app, this would navigate to the agent builder with the template loaded
    alert(`Using template: ${template.name}\n\nThis would open the agent builder with the template pre-loaded.`);
  };

  const handlePreviewTemplate = (template: AgentTemplate) => {
    alert(`Preview: ${template.name}\n\n${template.preview}\n\nActions:\n${template.actions.map(action => `• ${action}`).join('\n')}`);
  };

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowBuilder(false)}>
            ← Back to Templates
          </Button>
        </div>
        <TemplateBuilder />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Agent Templates</h1>
          <p className="text-muted-foreground">Ready-to-use templates to jumpstart your AI automation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Template
          </Button>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Featured Templates */}
      {featuredTemplates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            Featured Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <TemplateCard template={template} onUse={handleUseTemplate} onPreview={handlePreviewTemplate} featured />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Categories</option>
                <option value="sales">Sales</option>
                <option value="support">Support</option>
                <option value="marketing">Marketing</option>
                <option value="automation">Automation</option>
                <option value="analytics">Analytics</option>
              </select>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {sortedTemplates.length} of {mockTemplates.length} templates
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sortedTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <TemplateCard template={template} onUse={handleUseTemplate} onPreview={handlePreviewTemplate} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {sortedTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Template Card Component
function TemplateCard({ 
  template, 
  onUse, 
  onPreview, 
  featured = false 
}: { 
  template: AgentTemplate; 
  onUse: (template: AgentTemplate) => void;
  onPreview: (template: AgentTemplate) => void;
  featured?: boolean;
}) {
  const CategoryIcon = categoryIcons[template.category];
  
  return (
    <Card className={`group relative transition-all duration-300 hover:shadow-lg ${featured ? 'ring-2 ring-yellow-400/30' : ''}`}>
      {featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[template.category]}`}>
            <CategoryIcon className="w-5 h-5" />
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {template.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {template.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span>{template.rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Download className="w-3 h-3" />
            <span>{template.downloads.toLocaleString()}</span>
          </div>
          <span>{template.estimatedTime}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={difficultyColors[template.difficulty]}>
            {template.difficulty}
          </Badge>
          <Badge variant="outline">{template.category}</Badge>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex space-x-2 pt-2">
          <Button onClick={() => onPreview(template)} variant="outline" size="sm" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button onClick={() => onUse(template)} size="sm" className="flex-1">
            <Play className="w-3 h-3 mr-1" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}