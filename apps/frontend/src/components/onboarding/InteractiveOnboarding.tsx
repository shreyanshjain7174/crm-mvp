'use client';

import React, { useState, useEffect } from 'react';
import { useUserProgressStore } from '@/stores/userProgress';
import { ProgressionEngine } from '@/lib/features/progression';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Target, 
  Trophy, 
  Lightbulb,
  Clock,
  TrendingUp
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  optional?: boolean;
  estimatedTime: string;
}

export function InteractiveOnboarding() {
  const { stage, stats, currentHint, dismissHint } = useUserProgressStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  // Get progression analysis
  const analysis = ProgressionEngine.analyzeUserProgress(stage, stats);
  const smartHints = ProgressionEngine.getSmartHints(stage, stats);
  const contextualOnboarding = ProgressionEngine.getContextualOnboarding(stage, stats);

  // Define onboarding steps based on current stage
  const getOnboardingSteps = (): OnboardingStep[] => {
    switch (stage) {
      case 'new':
        return [
          {
            id: 'add-first-contact',
            title: 'Add Your First Contact',
            description: 'Start building your CRM by adding your most important business contact',
            action: 'Add Contact',
            completed: stats.contactsAdded > 0,
            estimatedTime: '2 minutes'
          },
          {
            id: 'explore-dashboard',
            title: 'Explore Your Dashboard',
            description: 'Get familiar with the dashboard layout and navigation',
            action: 'Take Tour',
            completed: false,
            optional: true,
            estimatedTime: '3 minutes'
          }
        ];

      case 'beginner':
        return [
          {
            id: 'send-first-message',
            title: 'Send Your First Message',
            description: 'Try WhatsApp messaging to engage with your contacts',
            action: 'Send Message',
            completed: stats.messagesSent > 0,
            estimatedTime: '5 minutes'
          },
          {
            id: 'add-more-contacts',
            title: 'Build Your Network',
            description: `Add ${Math.max(0, 5 - stats.contactsAdded)} more contacts to unlock the pipeline view`,
            action: 'Add Contacts',
            completed: stats.contactsAdded >= 5,
            estimatedTime: '10 minutes'
          }
        ];

      case 'intermediate':
        return [
          {
            id: 'use-pipeline',
            title: 'Organize with Pipeline',
            description: 'Use the pipeline view to track your leads and opportunities',
            action: 'View Pipeline',
            completed: stats.pipelineActions > 0,
            estimatedTime: '5 minutes'
          },
          {
            id: 'send-more-messages',
            title: 'Engage Your Leads',
            description: `Send ${Math.max(0, 10 - stats.messagesSent)} more messages to unlock AI features`,
            action: 'Send Messages',
            completed: stats.messagesSent >= 10,
            estimatedTime: '15 minutes'
          }
        ];

      case 'advanced':
        return [
          {
            id: 'try-ai-assistant',
            title: 'Use AI Assistant',
            description: 'Let AI help you respond faster and more effectively',
            action: 'Try AI',
            completed: stats.aiInteractions > 0,
            estimatedTime: '5 minutes'
          },
          {
            id: 'use-templates',
            title: 'Create Message Templates',
            description: 'Save time with reusable message templates',
            action: 'Create Template',
            completed: stats.templatesUsed > 0,
            estimatedTime: '8 minutes'
          }
        ];

      default:
        return [
          {
            id: 'master-features',
            title: 'Master Advanced Features',
            description: 'Explore automation, analytics, and custom workflows',
            action: 'Explore',
            completed: false,
            estimatedTime: '20 minutes'
          }
        ];
    }
  };

  const steps = getOnboardingSteps();
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  // Auto-expand for new users or when there are uncompleted steps
  useEffect(() => {
    if (stage === 'new' || completedSteps < steps.length) {
      setIsExpanded(true);
    }
  }, [stage, completedSteps, steps.length]);

  const handleStepAction = (stepId: string) => {
    setActiveStep(stepId);
    
    // Route to appropriate page based on step
    switch (stepId) {
      case 'add-first-contact':
      case 'add-more-contacts':
        window.location.href = '/contacts';
        break;
      case 'send-first-message':
      case 'send-more-messages':
        window.location.href = '/messages';
        break;
      case 'use-pipeline':
        window.location.href = '/leads';
        break;
      case 'try-ai-assistant':
        window.location.href = '/ai';
        break;
      case 'use-templates':
        window.location.href = '/messages?tab=templates';
        break;
      case 'explore-dashboard':
        // Start dashboard tour
        setIsExpanded(false);
        break;
    }
  };

  if (stage === 'expert' && completedSteps === steps.length) {
    return null; // Hide for expert users who've completed everything
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-500/10 dark:to-purple-500/10" data-tour="progress">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              {analysis.progressPercentage === 100 ? (
                <Trophy className="w-5 h-5 text-yellow-500" />
              ) : (
                <Target className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {contextualOnboarding.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {contextualOnboarding.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              {Math.round(analysis.progressPercentage)}% Complete
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{completedSteps} of {steps.length} steps completed</span>
            <span>{analysis.estimatedTimeToNext}</span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Current Hint */}
          {currentHint && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {currentHint}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissHint}
                  className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Smart Hints */}
          {smartHints.length > 0 && (
            <div className="mb-4 space-y-2">
              {smartHints.map((hint, index) => (
                <div
                  key={index}
                  className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 p-2 rounded border border-blue-200 dark:border-blue-500/30"
                >
                  {hint}
                </div>
              ))}
            </div>
          )}

          {/* Onboarding Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  step.completed
                    ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'
                    : activeStep === step.id
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                    : 'bg-background border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">
                      {step.title}
                    </h4>
                    {step.optional && (
                      <Badge variant="outline" className="text-xs">
                        Optional
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {step.estimatedTime}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
                
                {!step.completed && (
                  <Button
                    size="sm"
                    variant={index === 0 ? "default" : "outline"}
                    onClick={() => handleStepAction(step.id)}
                    className="flex-shrink-0"
                  >
                    {step.action}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Next Stage Preview */}
          {analysis.nextStage && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Coming Next: {analysis.nextStage.charAt(0).toUpperCase() + analysis.nextStage.slice(1)} Stage
                </h4>
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                {analysis.missingRequirements.map((req, index) => (
                  <div key={index}>• {req}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}