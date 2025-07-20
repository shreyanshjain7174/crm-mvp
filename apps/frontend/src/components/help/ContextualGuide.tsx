'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronRight, Lightbulb, Target, Zap } from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { cn } from '@/lib/utils';

export interface ContextualHint {
  id: string;
  trigger: 'idle' | 'action_completed' | 'feature_unlocked' | 'error_state' | 'milestone_reached';
  stage: string;
  title: string;
  message: string;
  actionText?: string;
  actionCallback?: () => void;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
  autoHide?: number; // milliseconds
  icon?: React.ReactNode;
}

interface ContextualGuideProps {
  hints: ContextualHint[];
  onDismiss?: (hintId: string) => void;
  className?: string;
}

export function ContextualGuide({ hints, onDismiss, className }: ContextualGuideProps) {
  const [activeHint, setActiveHint] = useState<ContextualHint | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const stage = useUserProgressStore(state => state.stage);
  
  // Filter hints based on current stage and dismissal state
  const relevantHints = hints.filter(hint => 
    hint.stage === stage && !dismissed.has(hint.id)
  );
  
  // Sort by priority and select the highest priority hint
  useEffect(() => {
    if (relevantHints.length === 0) {
      setActiveHint(null);
      return;
    }
    
    const sortedHints = [...relevantHints].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    setActiveHint(sortedHints[0]);
  }, [relevantHints]);
  
  // Auto-hide functionality
  const handleDismiss = useCallback((hintId: string) => {
    setDismissed(prev => new Set(prev).add(hintId));
    setActiveHint(null);
    onDismiss?.(hintId);
  }, [onDismiss]);
  
  useEffect(() => {
    if (activeHint?.autoHide) {
      const timer = setTimeout(() => {
        handleDismiss(activeHint.id);
      }, activeHint.autoHide);
      
      return () => clearTimeout(timer);
    }
  }, [activeHint, handleDismiss]);
  
  const handleAction = () => {
    if (activeHint?.actionCallback) {
      activeHint.actionCallback();
    }
    if (activeHint) {
      handleDismiss(activeHint.id);
    }
  };
  
  if (!activeHint) return null;
  
  const getIcon = () => {
    if (activeHint.icon) return activeHint.icon;
    
    switch (activeHint.priority) {
      case 'high':
        return <Zap className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'low':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getPlacementStyles = () => {
    switch (activeHint.placement) {
      case 'top':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'bottom':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'left':
        return 'fixed left-4 top-1/2 transform -translate-y-1/2 z-50';
      case 'right':
        return 'fixed right-4 top-1/2 transform -translate-y-1/2 z-50';
      case 'center':
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
      default:
        return 'fixed top-4 right-4 z-50';
    }
  };
  
  return (
    <div className={cn(getPlacementStyles(), className)}>
      <Card className="w-80 shadow-xl border-2 border-blue-200 bg-white/95 backdrop-blur-sm animate-in slide-in-from-right duration-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm mb-1">
                {activeHint.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {activeHint.message}
              </p>
            </div>
            
            {activeHint.dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(activeHint.id)}
                className="flex-shrink-0 h-6 w-6 p-0 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {activeHint.actionText && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleAction}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {activeHint.actionText}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              
              {activeHint.dismissible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDismiss(activeHint.id)}
                  className="px-3"
                >
                  Later
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing contextual hints
export function useContextualHints() {
  const stage = useUserProgressStore(state => state.stage);
  const stats = useUserProgressStore(state => state.stats);
  const setCurrentHint = useUserProgressStore(state => state.setCurrentHint);
  
  const generateSmartHints = (): ContextualHint[] => {
    const hints: ContextualHint[] = [];
    
    // Stage-specific hints
    switch (stage) {
      case 'new':
        hints.push({
          id: 'welcome-first-contact',
          trigger: 'idle',
          stage: 'new',
          title: 'Welcome to your CRM!',
          message: 'Start by adding your first contact to unlock messaging features.',
          actionText: 'Add Contact',
          placement: 'center',
          priority: 'high',
          dismissible: true,
          icon: <Zap className="w-5 h-5 text-blue-500" />
        });
        break;
        
      case 'beginner':
        if (stats.contactsAdded >= 1 && stats.messagesSent === 0) {
          hints.push({
            id: 'first-message',
            trigger: 'action_completed',
            stage: 'beginner',
            title: 'Great! Now send a message',
            message: 'You have contacts! Try sending them a WhatsApp message to start engaging.',
            actionText: 'Send Message',
            placement: 'top',
            priority: 'high',
            dismissible: true,
            autoHide: 10000
          });
        }
        break;
        
      case 'intermediate':
        if (stats.contactsAdded >= 10 && stats.pipelineActions === 0) {
          hints.push({
            id: 'use-pipeline',
            trigger: 'milestone_reached',
            stage: 'intermediate',
            title: 'Try the Pipeline View',
            message: 'With 10+ contacts, organize them into a sales pipeline for better tracking.',
            actionText: 'View Pipeline',
            placement: 'bottom',
            priority: 'high',
            dismissible: true
          });
        }
        
        if (stats.messagesSent >= 10 && stats.templatesUsed === 0) {
          hints.push({
            id: 'create-templates',
            trigger: 'action_completed',
            stage: 'intermediate',
            title: 'Save Time with Templates',
            message: 'Create message templates for common responses to work faster.',
            actionText: 'Create Template',
            placement: 'right',
            priority: 'medium',
            dismissible: true
          });
        }
        break;
        
      case 'advanced':
        if (stats.messagesSent >= 5 && stats.aiInteractions === 0) {
          hints.push({
            id: 'try-ai-assistant',
            trigger: 'idle',
            stage: 'advanced',
            title: 'AI Assistant Available!',
            message: 'Managing many conversations? Let AI help you respond faster and more effectively.',
            actionText: 'Try AI Assistant',
            placement: 'center',
            priority: 'high',
            dismissible: true,
            icon: <Zap className="w-5 h-5 text-orange-500" />
          });
        }
        break;
        
      case 'expert':
        hints.push({
          id: 'advanced-features',
          trigger: 'feature_unlocked',
          stage: 'expert',
          title: 'All Features Unlocked!',
          message: 'You\'re now a CRM master! Explore advanced workflows and automation.',
          actionText: 'Explore Features',
          placement: 'top',
          priority: 'medium',
          dismissible: true,
          autoHide: 8000
        });
        break;
    }
    
    return hints;
  };
  
  const [hints] = useState<ContextualHint[]>(generateSmartHints);
  
  const updateHint = (message: string) => {
    setCurrentHint(message);
  };
  
  return {
    hints,
    updateHint
  };
}

export default ContextualGuide;