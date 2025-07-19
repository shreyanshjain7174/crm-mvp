import { UserStage, USER_STAGES, FeatureKey } from '@/lib/constants/user-stages';
import { UserStats } from '@/stores/userProgress';

export interface ProgressionAnalysis {
  currentStage: UserStage;
  nextStage: UserStage | null;
  progressPercentage: number;
  completedRequirements: number;
  totalRequirements: number;
  missingRequirements: string[];
  suggestedActions: string[];
  estimatedTimeToNext: string;
}

export interface FeatureUnlockEvent {
  feature: FeatureKey;
  stage: UserStage;
  triggerType: 'automatic' | 'manual';
  context?: Record<string, any>;
}

export class ProgressionEngine {
  static analyzeUserProgress(stage: UserStage, stats: UserStats): ProgressionAnalysis {
    const stages: UserStage[] = ['new', 'beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = stages.indexOf(stage);
    const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
    
    if (!nextStage) {
      return {
        currentStage: stage,
        nextStage: null,
        progressPercentage: 100,
        completedRequirements: 0,
        totalRequirements: 0,
        missingRequirements: [],
        suggestedActions: ['You\'ve mastered the CRM! Keep optimizing your workflow.'],
        estimatedTimeToNext: 'Completed'
      };
    }
    
    const nextStageConfig = USER_STAGES[nextStage];
    const requirements = nextStageConfig.requirements;
    
    let completedRequirements = 0;
    const missingRequirements: string[] = [];
    const suggestedActions: string[] = [];
    
    requirements.forEach(req => {
      const currentValue = stats[req.type as keyof UserStats] || 0;
      const meetsRequirement = this.checkRequirement(currentValue, req.threshold, req.condition);
      
      if (meetsRequirement) {
        completedRequirements++;
      } else {
        const remaining = req.threshold - currentValue;
        missingRequirements.push(`${req.description} (${remaining} more needed)`);
        suggestedActions.push(this.getActionSuggestion(req.type, remaining));
      }
    });
    
    const progressPercentage = requirements.length > 0 
      ? (completedRequirements / requirements.length) * 100 
      : 100;
    
    const estimatedTimeToNext = this.estimateTimeToNextStage(missingRequirements.length, stage);
    
    return {
      currentStage: stage,
      nextStage,
      progressPercentage,
      completedRequirements,
      totalRequirements: requirements.length,
      missingRequirements,
      suggestedActions,
      estimatedTimeToNext
    };
  }
  
  private static checkRequirement(
    currentValue: number,
    threshold: number,
    condition: 'gte' | 'lte' | 'equals'
  ): boolean {
    switch (condition) {
      case 'gte':
        return currentValue >= threshold;
      case 'lte':
        return currentValue <= threshold;
      case 'equals':
        return currentValue === threshold;
      default:
        return false;
    }
  }
  
  private static getActionSuggestion(requirementType: string, remaining: number): string {
    const suggestions = {
      contact_count: `Add ${remaining} more contacts to your CRM`,
      message_count: `Send ${remaining} more WhatsApp messages`,
      ai_interactions: `Use AI assistance ${remaining} more times`,
      pipeline_actions: `Perform ${remaining} more pipeline actions (move leads, update stages)`,
      templates_used: `Use message templates ${remaining} more times`
    };
    
    return suggestions[requirementType as keyof typeof suggestions] || 
           `Complete ${remaining} more ${requirementType.replace('_', ' ')} actions`;
  }
  
  private static estimateTimeToNextStage(missingCount: number, currentStage: UserStage): string {
    const estimations = {
      new: missingCount === 0 ? 'Ready now!' : '5 minutes',
      beginner: missingCount <= 1 ? '30 minutes' : '1-2 hours',
      intermediate: missingCount <= 2 ? '1-2 days' : '3-5 days',
      advanced: missingCount <= 2 ? '1 week' : '2-3 weeks',
      expert: 'Completed'
    };
    
    return estimations[currentStage] || 'Unknown';
  }
  
  static getSmartHints(stage: UserStage, stats: UserStats): string[] {
    const hints: string[] = [];
    
    switch (stage) {
      case 'new':
        hints.push('💡 Start by adding your most important contacts');
        break;
        
      case 'beginner':
        if (stats.contactsAdded >= 1 && stats.messagesSent === 0) {
          hints.push('📱 Try sending a WhatsApp message to your contact');
        }
        if (stats.messagesSent >= 1 && stats.contactsAdded < 5) {
          hints.push('👥 Add a few more contacts to build your network');
        }
        break;
        
      case 'intermediate':
        if (stats.contactsAdded >= 10 && stats.pipelineActions === 0) {
          hints.push('📈 Use the pipeline view to organize your leads');
        }
        if (stats.messagesSent >= 10 && stats.templatesUsed === 0) {
          hints.push('📝 Create message templates to save time');
        }
        break;
        
      case 'advanced':
        if (stats.messagesSent >= 30 && stats.aiInteractions === 0) {
          hints.push('🤖 Try AI suggestions for faster responses');
        }
        if (stats.aiInteractions >= 5 && stats.templatesUsed < 5) {
          hints.push('⚡ Combine AI with templates for maximum efficiency');
        }
        break;
        
      case 'expert':
        hints.push('🚀 You\'ve mastered the basics! Explore advanced automation');
        break;
    }
    
    return hints;
  }
  
  static calculateEngagementScore(stats: UserStats): number {
    const weights = {
      contactsAdded: 2,
      messagesSent: 3,
      aiInteractions: 4,
      templatesUsed: 3,
      pipelineActions: 2
    };
    
    let score = 0;
    let maxScore = 0;
    
    Object.entries(weights).forEach(([key, weight]) => {
      const value = stats[key as keyof UserStats] || 0;
      score += Math.min(value * weight, weight * 10); // Cap at 10 uses per metric
      maxScore += weight * 10;
    });
    
    return Math.round((score / maxScore) * 100);
  }
  
  static getContextualOnboarding(stage: UserStage, stats: UserStats): {
    title: string;
    message: string;
    actionText: string;
    actionType: 'primary' | 'secondary';
  } {
    const contextualMessages = {
      new: {
        title: 'Welcome to your CRM!',
        message: 'Let\'s start by adding your first contact. This will unlock your contact list and messaging features.',
        actionText: 'Add First Contact',
        actionType: 'primary' as const
      },
      beginner: {
        title: 'Great start!',
        message: 'Now that you have contacts, try sending them a WhatsApp message to begin engaging with your leads.',
        actionText: 'Send Message',
        actionType: 'primary' as const
      },
      intermediate: {
        title: 'Building momentum!',
        message: 'With more contacts, it\'s time to organize them. Use the pipeline view to track your leads\' progress.',
        actionText: 'View Pipeline',
        actionType: 'secondary' as const
      },
      advanced: {
        title: 'You\'re getting busy!',
        message: 'Managing many conversations can be time-consuming. Let our AI assistant help you respond faster.',
        actionText: 'Try AI Assistant',
        actionType: 'primary' as const
      },
      expert: {
        title: 'CRM Master!',
        message: 'You\'ve unlocked all features! Create custom workflows and automations to optimize your process.',
        actionText: 'Create Workflow',
        actionType: 'secondary' as const
      }
    };
    
    return contextualMessages[stage];
  }
}

export default ProgressionEngine;