'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { cn } from '@/lib/utils';

interface DiscoveryPromptProps {
  onAction?: (actionType: string) => void;
  className?: string;
}

interface PromptConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  actionType: string;
  urgency: 'low' | 'medium' | 'high';
  condition: (stats: any) => boolean;
  cooldown: number; // hours
}

const DISCOVERY_PROMPTS: PromptConfig[] = [
  {
    id: 'inactive-leads',
    title: 'Quiet leads need attention',
    description: 'You have contacts who haven\'t heard from you in a while. A quick message could re-engage them.',
    icon: <Clock className="w-5 h-5 text-orange-500" />,
    actionText: 'Message Inactive Leads',
    actionType: 'message_inactive',
    urgency: 'medium',
    condition: (stats) => stats.contactsAdded >= 5 && stats.messagesSent < stats.contactsAdded * 2,
    cooldown: 24
  },
  {
    id: 'template-suggestion',
    title: 'Speed up with templates',
    description: 'You\'re sending similar messages. Create templates to respond faster.',
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    actionText: 'Create Template',
    actionType: 'create_template',
    urgency: 'low',
    condition: (stats) => stats.messagesSent >= 10 && stats.templatesUsed === 0,
    cooldown: 48
  },
  {
    id: 'pipeline-organization',
    title: 'Organize your growing network',
    description: 'With multiple contacts, the pipeline view will help you track everyone\'s progress.',
    icon: <TrendingUp className="w-5 h-5 text-green-500" />,
    actionText: 'View Pipeline',
    actionType: 'view_pipeline',
    urgency: 'high',
    condition: (stats) => stats.contactsAdded >= 8 && stats.pipelineActions === 0,
    cooldown: 12
  },
  {
    id: 'ai-efficiency',
    title: 'Let AI help you respond',
    description: 'You\'re managing many conversations. AI can suggest responses and save you time.',
    icon: <span className="text-purple-500">🤖</span>,
    actionText: 'Try AI Assistant',
    actionType: 'try_ai',
    urgency: 'high',
    condition: (stats) => stats.messagesSent >= 30 && stats.aiInteractions === 0,
    cooldown: 8
  }
];

export function DiscoveryPrompt({ onAction, className }: DiscoveryPromptProps) {
  const [activePrompt, setActivePrompt] = useState<PromptConfig | null>(null);
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());
  const [lastShown, setLastShown] = useState<Record<string, number>>({});
  
  const stats = useUserProgressStore(state => state.stats);
  const stage = useUserProgressStore(state => state.stage);
  
  useEffect(() => {
    // Find the most relevant prompt
    const now = Date.now();
    const eligiblePrompts = DISCOVERY_PROMPTS.filter(prompt => {
      // Check if dismissed
      if (dismissedPrompts.has(prompt.id)) return false;
      
      // Check cooldown
      const lastShownTime = lastShown[prompt.id] || 0;
      const cooldownMs = prompt.cooldown * 60 * 60 * 1000; // convert hours to ms
      if (now - lastShownTime < cooldownMs) return false;
      
      // Check condition
      return prompt.condition(stats);
    });
    
    if (eligiblePrompts.length === 0) {
      setActivePrompt(null);
      return;
    }
    
    // Sort by urgency and select the highest priority
    const sortedPrompts = eligiblePrompts.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
    
    const selectedPrompt = sortedPrompts[0];
    setActivePrompt(selectedPrompt);
    setLastShown(prev => ({ ...prev, [selectedPrompt.id]: now }));
  }, [stats, dismissedPrompts, lastShown]);
  
  const handleAction = () => {
    if (activePrompt) {
      onAction?.(activePrompt.actionType);
      handleDismiss();
    }
  };
  
  const handleDismiss = () => {
    if (activePrompt) {
      setDismissedPrompts(prev => new Set(prev).add(activePrompt.id));
      setActivePrompt(null);
    }
  };
  
  if (!activePrompt || stage === 'new') return null;
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  return (
    <Card className={cn(
      'border-2 shadow-md animate-in slide-in-from-right duration-500',
      getUrgencyColor(activePrompt.urgency),
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {activePrompt.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 text-sm">
                {activePrompt.title}
              </h3>
              <Badge 
                variant={activePrompt.urgency === 'high' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {activePrompt.urgency}
              </Badge>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              {activePrompt.description}
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAction}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
              >
                {activePrompt.actionText}
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-700"
              >
                Maybe later
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing discovery prompts
export function useDiscoveryPrompts() {
  const stats = useUserProgressStore(state => state.stats);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  
  const trackPromptAction = (promptId: string, actionType: string) => {
    setPromptHistory(prev => [...prev, `${promptId}:${actionType}`]);
  };
  
  const getPromptAnalytics = () => {
    return {
      totalPrompts: promptHistory.length,
      actionTypes: promptHistory.reduce((acc, entry) => {
        const [, action] = entry.split(':');
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  };
  
  return {
    trackPromptAction,
    getPromptAnalytics
  };
}

export default DiscoveryPrompt;