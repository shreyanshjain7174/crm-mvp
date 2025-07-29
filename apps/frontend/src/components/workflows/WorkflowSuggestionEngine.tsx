'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  Target, 
  MessageSquare, 
  Clock, 
  Zap, 
  TrendingUp,
  Users,
  Bot,
  ArrowRight,
  Plus,
  CheckCircle2,
  X,
  Star,
  Filter,
  Search,
  Sparkles,
  Brain,
  GitBranch,
  Timer,
  Mail,
  Phone,
  Database,
  Webhook
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { WorkflowData } from './VisualWorkflowBuilder';
import { cn } from '@/lib/utils';

interface WorkflowSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'lead-nurturing' | 'follow-up' | 'automation' | 'analytics' | 'efficiency';
  complexity: 'simple' | 'moderate' | 'advanced';
  estimatedTimeSaved: number; // hours per month
  impactScore: number; // 1-10
  requirements: string[];
  triggers: string[];
  actions: string[];
  conditions?: string[];
  isRecommended?: boolean;
  isPopular?: boolean;
  tags: string[];
  previewWorkflow: {
    nodeCount: number;
    estimatedSetupTime: number; // minutes
    mainFlow: string[];
  };
  aiInsights?: {
    personalizedReason: string;
    dataPoints: string[];
    confidenceScore: number;
  };
}

interface WorkflowSuggestionEngineProps {
  userStats?: {
    contactsAdded: number;
    messagesSent: number;
    leadsConverted: number;
    averageResponseTime: number;
    mostActiveHours: number[];
    commonLeadSources: string[];
  };
  onCreateWorkflow?: (suggestion: WorkflowSuggestion) => void;
  onPreviewWorkflow?: (suggestion: WorkflowSuggestion) => void;
  className?: string;
}

const WORKFLOW_SUGGESTIONS: WorkflowSuggestion[] = [
  {
    id: 'smart-lead-nurturing',
    title: 'Smart Lead Nurturing Sequence',
    description: 'Automatically nurture new leads with personalized messages based on their source and behavior',
    category: 'lead-nurturing',
    complexity: 'moderate',
    estimatedTimeSaved: 8.5,
    impactScore: 9,
    requirements: ['Contact Management', 'Message Templates', 'Lead Scoring'],
    triggers: ['New Lead Added', 'Lead Source Detected'],
    actions: ['Send Welcome Message', 'Add to Nurture List', 'Schedule Follow-up'],
    conditions: ['Lead Source Type', 'Business Hours Check'],
    isRecommended: true,
    isPopular: true,
    tags: ['nurturing', 'automation', 'personalization'],
    previewWorkflow: {
      nodeCount: 7,
      estimatedSetupTime: 15,
      mainFlow: ['New Lead → Check Source → Send Welcome → Wait 2 Days → Follow-up → Score Update']
    },
    aiInsights: {
      personalizedReason: 'Based on your 45 new leads last month, this could save you 8+ hours of manual follow-up',
      dataPoints: ['67% of your leads come from WhatsApp', 'Average response time: 4.2 hours'],
      confidenceScore: 0.92
    }
  },
  {
    id: 'response-time-optimizer',
    title: 'Response Time Optimizer',
    description: 'Automatically prioritize and route urgent messages to ensure faster response times',
    category: 'efficiency',
    complexity: 'simple',
    estimatedTimeSaved: 4.2,
    impactScore: 8,
    requirements: ['Message Monitoring', 'Priority Tags'],
    triggers: ['Message Received', 'Keyword Detected'],
    actions: ['Set Priority', 'Send Alert', 'Auto-respond'],
    conditions: ['Business Hours', 'Keyword Urgency', 'Customer Type'],
    tags: ['response-time', 'prioritization', 'customer-service'],
    previewWorkflow: {
      nodeCount: 5,
      estimatedSetupTime: 10,
      mainFlow: ['New Message → Urgency Check → Set Priority → Notify Team → Auto-acknowledge']
    },
    aiInsights: {
      personalizedReason: 'Your current 4.2hr average response time could improve to under 1 hour',
      dataPoints: ['23% of messages contain urgent keywords', 'Peak hours: 10AM-2PM, 6PM-8PM'],
      confidenceScore: 0.88
    }
  },
  {
    id: 'conversion-tracker',
    title: 'Smart Conversion Tracking',
    description: 'Track lead behavior and automatically move them through pipeline stages based on engagement',
    category: 'analytics',
    complexity: 'advanced',
    estimatedTimeSaved: 6.3,
    impactScore: 9,
    requirements: ['Pipeline Management', 'Activity Tracking', 'Scoring System'],
    triggers: ['Activity Completed', 'Engagement Threshold'],
    actions: ['Update Pipeline Stage', 'Calculate Score', 'Send Notification'],
    conditions: ['Engagement Level', 'Time in Stage', 'Activity Type'],
    isPopular: true,
    tags: ['conversion', 'pipeline', 'analytics', 'scoring'],
    previewWorkflow: {
      nodeCount: 9,
      estimatedSetupTime: 25,
      mainFlow: ['Activity → Score Calculation → Stage Evaluation → Auto-advance → Notification']
    }
  },
  {
    id: 'follow-up-reminder-system',
    title: 'Intelligent Follow-up Reminders',
    description: 'Never miss a follow-up with smart reminders based on lead priority and last interaction',
    category: 'follow-up',
    complexity: 'simple',
    estimatedTimeSaved: 5.8,
    impactScore: 7,
    requirements: ['Task Management', 'Calendar Integration'],
    triggers: ['Time-based Schedule', 'No Response Timer'],
    actions: ['Create Task', 'Send Reminder', 'Schedule Call'],
    conditions: ['Days Since Contact', 'Lead Priority', 'Response Status'],
    tags: ['follow-up', 'reminders', 'task-management'],
    previewWorkflow: {
      nodeCount: 6,
      estimatedSetupTime: 12,
      mainFlow: ['Timer Start → Check Last Contact → Priority Assessment → Create Reminder → Escalate']
    },
    aiInsights: {
      personalizedReason: 'You have 12 leads that haven\'t been contacted in over a week',
      dataPoints: ['High-priority leads respond 3x better within 24 hours'],
      confidenceScore: 0.85
    }
  },
  {
    id: 'ai-message-assistant',
    title: 'AI Message Assistant',
    description: 'Generate contextual message suggestions and auto-responses based on conversation history',
    category: 'automation',
    complexity: 'advanced',
    estimatedTimeSaved: 12.4,
    impactScore: 10,
    requirements: ['AI Integration', 'Message History', 'Template Library'],
    triggers: ['Message Received', 'Context Analysis'],
    actions: ['Generate Response', 'Suggest Reply', 'Auto-send'],
    conditions: ['Conversation Context', 'Confidence Score', 'Business Hours'],
    isRecommended: true,
    tags: ['ai', 'messaging', 'automation', 'smart-replies'],
    previewWorkflow: {
      nodeCount: 8,
      estimatedSetupTime: 20,
      mainFlow: ['Message → AI Analysis → Context Check → Generate Reply → Confidence Filter → Send/Suggest']
    },
    aiInsights: {
      personalizedReason: 'Based on your message patterns, AI could handle 40% of routine responses',
      dataPoints: ['85% of your messages follow common patterns', 'Most common: pricing, availability, scheduling'],
      confidenceScore: 0.94
    }
  },
  {
    id: 'lead-scoring-automation',
    title: 'Dynamic Lead Scoring',
    description: 'Automatically score and rank leads based on behavior, engagement, and demographics',
    category: 'analytics',
    complexity: 'moderate',
    estimatedTimeSaved: 7.1,
    impactScore: 8,
    requirements: ['Contact Data', 'Activity Tracking', 'Scoring Rules'],
    triggers: ['Contact Update', 'Activity Logged', 'Time Interval'],
    actions: ['Calculate Score', 'Update Priority', 'Trigger Actions'],
    conditions: ['Activity Type', 'Contact Info Complete', 'Engagement Level'],
    tags: ['scoring', 'prioritization', 'data-driven'],
    previewWorkflow: {
      nodeCount: 7,
      estimatedSetupTime: 18,
      mainFlow: ['Trigger → Collect Data → Apply Rules → Calculate Score → Priority Update → Actions']
    }
  }
];

export function WorkflowSuggestionEngine({ 
  userStats, 
  onCreateWorkflow, 
  onPreviewWorkflow,
  className 
}: WorkflowSuggestionEngineProps) {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>(WORKFLOW_SUGGESTIONS);
  const [filteredSuggestions, setFilteredSuggestions] = useState<WorkflowSuggestion[]>(WORKFLOW_SUGGESTIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'impact' | 'time-saved' | 'complexity'>('impact');

  // Filter and sort suggestions
  useEffect(() => {
    let filtered = [...suggestions];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Apply complexity filter
    if (selectedComplexity !== 'all') {
      filtered = filtered.filter(s => s.complexity === selectedComplexity);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return b.impactScore - a.impactScore;
        case 'time-saved':
          return b.estimatedTimeSaved - a.estimatedTimeSaved;
        case 'complexity':
          const complexityOrder = { simple: 1, moderate: 2, advanced: 3 };
          return complexityOrder[a.complexity] - complexityOrder[b.complexity];
        default:
          return 0;
      }
    });

    setFilteredSuggestions(filtered);
  }, [suggestions, selectedCategory, selectedComplexity, searchQuery, sortBy]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lead-nurturing': return <Users className="w-4 h-4" />;
      case 'follow-up': return <Clock className="w-4 h-4" />;
      case 'automation': return <Bot className="w-4 h-4" />;
      case 'analytics': return <TrendingUp className="w-4 h-4" />;
      case 'efficiency': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead-nurturing': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'automation': return 'bg-purple-100 text-purple-800';
      case 'analytics': return 'bg-orange-100 text-orange-800';
      case 'efficiency': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderSuggestionCard = (suggestion: WorkflowSuggestion) => (
    <motion.div
      key={suggestion.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {getCategoryIcon(suggestion.category)}
                  <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                </div>
                {suggestion.isRecommended && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                )}
                {suggestion.isPopular && (
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(suggestion.category)}>
                  {suggestion.category.replace('-', ' ')}
                </Badge>
                <Badge className={getComplexityColor(suggestion.complexity)}>
                  {suggestion.complexity}
                </Badge>
              </div>
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              <div className="font-medium text-green-600">
                +{suggestion.estimatedTimeSaved}h/mo
              </div>
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                {suggestion.impactScore}/10
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {suggestion.description}
          </p>

          {/* AI Insights */}
          {suggestion.aiInsights && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Brain className="w-4 h-4 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900">AI Insight</p>
                  <p className="text-xs text-purple-700 mt-1">
                    {suggestion.aiInsights.personalizedReason}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex-1 bg-purple-200 rounded-full h-1">
                      <div 
                        className="bg-purple-600 h-1 rounded-full transition-all"
                        style={{ width: `${suggestion.aiInsights.confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-purple-600">
                      {Math.round(suggestion.aiInsights.confidenceScore * 100)}% confident
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workflow Preview:</span>
              <span className="text-muted-foreground">
                {suggestion.previewWorkflow.nodeCount} nodes • {suggestion.previewWorkflow.estimatedSetupTime}min setup
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {suggestion.previewWorkflow.mainFlow.map((step, index) => (
                <React.Fragment key={index}>
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                    {step}
                  </span>
                  {index < suggestion.previewWorkflow.mainFlow.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Requirements & Actions */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium mb-1">Triggers:</p>
              <div className="flex flex-wrap gap-1">
                {suggestion.triggers.slice(0, 2).map(trigger => (
                  <Badge key={trigger} variant="outline" className="text-xs">
                    {trigger}
                  </Badge>
                ))}
                {suggestion.triggers.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{suggestion.triggers.length - 2} more
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Actions:</p>
              <div className="flex flex-wrap gap-1">
                {suggestion.actions.slice(0, 2).map(action => (
                  <Badge key={action} variant="outline" className="text-xs">
                    {action}
                  </Badge>
                ))}
                {suggestion.actions.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{suggestion.actions.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreviewWorkflow?.(suggestion)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Target className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button
              size="sm"
              onClick={() => onCreateWorkflow?.(suggestion)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderFilterBar = () => (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="lead-nurturing">Lead Nurturing</SelectItem>
            <SelectItem value="follow-up">Follow-up</SelectItem>
            <SelectItem value="automation">Automation</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="efficiency">Efficiency</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="simple">Simple</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="impact">Impact</SelectItem>
            <SelectItem value="time-saved">Time Saved</SelectItem>
            <SelectItem value="complexity">Complexity</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Workflow Suggestions</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover AI-powered workflow suggestions tailored to your CRM usage patterns and business needs
        </p>
        
        {/* Quick Stats */}
        <div className="flex items-center justify-center space-x-6 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {suggestions.reduce((sum, s) => sum + s.estimatedTimeSaved, 0).toFixed(1)}h
            </div>
            <div className="text-sm text-muted-foreground">Total Time Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {suggestions.filter(s => s.isRecommended).length}
            </div>
            <div className="text-sm text-muted-foreground">AI Recommended</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {suggestions.length}
            </div>
            <div className="text-sm text-muted-foreground">Available Workflows</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      {renderFilterBar()}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSelectedCategory('all');
            setSearchQuery('recommended');
          }}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Show Recommended
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSelectedComplexity('simple');
            setSelectedCategory('all');
          }}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Quick Wins
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setSortBy('time-saved');
            setSelectedCategory('all');
          }}
        >
          <Clock className="w-4 h-4 mr-2" />
          Biggest Impact
        </Button>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredSuggestions.map(suggestion => renderSuggestionCard(suggestion))}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredSuggestions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedComplexity('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}