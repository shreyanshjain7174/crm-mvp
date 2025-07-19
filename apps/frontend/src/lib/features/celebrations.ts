import { Achievement } from '@/stores/userProgress';

export interface CelebrationEvent {
  type: 'achievement' | 'stage_unlock' | 'feature_unlock' | 'milestone';
  title: string;
  description: string;
  icon: string;
  animation: 'confetti' | 'sparkles' | 'popup' | 'slide';
  duration: number;
  sound?: string;
}

export class CelebrationEngine {
  private static readonly ACHIEVEMENT_TEMPLATES = {
    first_contact: {
      title: 'First Contact Added! 🎉',
      description: 'Great start! Your CRM journey begins with building connections.',
      icon: '👤',
      animation: 'popup' as const,
      duration: 3000
    },
    
    first_message: {
      title: 'First Message Sent! 💬',
      description: 'You\'re now actively engaging with your contacts. Keep the conversations flowing!',
      icon: '📱',
      animation: 'sparkles' as const,
      duration: 3000
    },
    
    ten_contacts: {
      title: 'Network Builder! 🌟',
      description: 'You\'ve added 10 contacts! Your network is growing strong.',
      icon: '👥',
      animation: 'confetti' as const,
      duration: 4000
    },
    
    pipeline_master: {
      title: 'Pipeline Master! 📈',
      description: 'You\'ve organized your leads like a pro. Your sales process is taking shape!',
      icon: '🎯',
      animation: 'slide' as const,
      duration: 3500
    },
    
    ai_assistant: {
      title: 'AI-Powered! 🤖',
      description: 'You\'ve embraced AI assistance! Your productivity is about to soar.',
      icon: '⚡',
      animation: 'sparkles' as const,
      duration: 4000
    },
    
    crm_master: {
      title: 'CRM Master! 🏆',
      description: 'You\'ve unlocked all features! You\'re now a true CRM expert.',
      icon: '👑',
      animation: 'confetti' as const,
      duration: 5000
    }
  };
  
  static createAchievement(
    templateKey: keyof typeof CelebrationEngine.ACHIEVEMENT_TEMPLATES,
    customData?: Partial<Achievement>
  ): Achievement {
    const template = this.ACHIEVEMENT_TEMPLATES[templateKey];
    
    return {
      id: templateKey,
      title: template.title,
      description: template.description,
      icon: template.icon,
      category: 'milestone',
      unlockedAt: new Date(),
      ...customData
    };
  }
  
  static getStageUnlockCelebration(stage: string): CelebrationEvent {
    const celebrations = {
      beginner: {
        type: 'stage_unlock' as const,
        title: 'Welcome to the Journey! 🚀',
        description: 'You\'ve taken your first step. Time to send some messages!',
        icon: '🌟',
        animation: 'popup' as const,
        duration: 3000
      },
      
      intermediate: {
        type: 'stage_unlock' as const,
        title: 'Building Momentum! 💪',
        description: 'Your network is growing. Let\'s organize with the pipeline!',
        icon: '📈',
        animation: 'sparkles' as const,
        duration: 3500
      },
      
      advanced: {
        type: 'stage_unlock' as const,
        title: 'Getting Serious! 🔥',
        description: 'You\'re managing multiple conversations. Time for AI assistance!',
        icon: '🤖',
        animation: 'confetti' as const,
        duration: 4000
      },
      
      expert: {
        type: 'stage_unlock' as const,
        title: 'Expert Level Achieved! 🏆',
        description: 'You\'ve mastered the basics. All advanced features are now yours!',
        icon: '👑',
        animation: 'confetti' as const,
        duration: 5000
      }
    };
    
    return celebrations[stage as keyof typeof celebrations] || celebrations.beginner;
  }
  
  static getFeatureUnlockCelebration(feature: string): CelebrationEvent {
    const featureCelebrations = {
      'contacts:list': {
        type: 'feature_unlock' as const,
        title: 'Contact List Unlocked! 📋',
        description: 'View and manage all your contacts in one place.',
        icon: '👥',
        animation: 'slide' as const,
        duration: 2500
      },
      
      'messages:send': {
        type: 'feature_unlock' as const,
        title: 'WhatsApp Messaging Ready! 📱',
        description: 'Start conversations directly from your CRM.',
        icon: '💬',
        animation: 'popup' as const,
        duration: 3000
      },
      
      'pipeline:view': {
        type: 'feature_unlock' as const,
        title: 'Sales Pipeline Active! 🎯',
        description: 'Track your leads through every stage of your process.',
        icon: '📊',
        animation: 'sparkles' as const,
        duration: 3500
      },
      
      'ai:suggestions': {
        type: 'feature_unlock' as const,
        title: 'AI Assistant Ready! 🤖',
        description: 'Get intelligent suggestions for faster responses.',
        icon: '⚡',
        animation: 'confetti' as const,
        duration: 4000
      },
      
      'automation:advanced': {
        type: 'feature_unlock' as const,
        title: 'Advanced Automation! 🚀',
        description: 'Create custom workflows and automate repetitive tasks.',
        icon: '🔄',
        animation: 'confetti' as const,
        duration: 4500
      }
    };
    
    return featureCelebrations[feature as keyof typeof featureCelebrations] || {
      type: 'feature_unlock' as const,
      title: 'New Feature Unlocked! ✨',
      description: 'You\'ve gained access to a new capability.',
      icon: '🌟',
      animation: 'popup' as const,
      duration: 2500
    };
  }
  
  static getMilestoneCelebration(milestone: string, value: number): CelebrationEvent {
    const milestones = {
      contacts_milestone: {
        5: { title: 'Network Growing! 🌱', icon: '👥' },
        25: { title: 'Contact Champion! 🏅', icon: '🎖️' },
        50: { title: 'Network Master! 🌟', icon: '👑' },
        100: { title: 'Connection Expert! 🚀', icon: '🌐' }
      },
      
      messages_milestone: {
        10: { title: 'Conversation Starter! 💬', icon: '🗣️' },
        50: { title: 'Message Master! 📱', icon: '⚡' },
        100: { title: 'Communication Pro! 🎯', icon: '📢' },
        500: { title: 'Chat Champion! 🏆', icon: '💫' }
      },
      
      ai_milestone: {
        5: { title: 'AI Curious! 🤔', icon: '🤖' },
        25: { title: 'AI Enthusiast! 🌟', icon: '⚡' },
        50: { title: 'AI Power User! 🚀', icon: '🔥' },
        100: { title: 'AI Expert! 🎓', icon: '👨‍🏫' }
      }
    };
    
    const milestoneGroup = milestones[milestone as keyof typeof milestones];
    const milestoneData = milestoneGroup?.[value as keyof typeof milestoneGroup];
    
    if (!milestoneData) {
      return {
        type: 'milestone',
        title: 'Milestone Reached! 🎯',
        description: `You've achieved ${value} ${milestone.replace('_milestone', 's')}!`,
        icon: '🏅',
        animation: 'popup' as const,
        duration: 2500
      };
    }
    
    return {
      type: 'milestone',
      title: milestoneData.title,
      description: `You've reached ${value} ${milestone.replace('_milestone', 's')}! Keep up the great work!`,
      icon: milestoneData.icon,
      animation: 'sparkles' as const,
      duration: 3000
    };
  }
  
  static shouldCelebrate(
    previousStats: any,
    currentStats: any
  ): CelebrationEvent[] {
    const celebrations: CelebrationEvent[] = [];
    
    // Check contact milestones
    const contactMilestones = [5, 10, 25, 50, 100];
    contactMilestones.forEach(milestone => {
      if (previousStats.contactsAdded < milestone && currentStats.contactsAdded >= milestone) {
        celebrations.push(this.getMilestoneCelebration('contacts_milestone', milestone));
      }
    });
    
    // Check message milestones
    const messageMilestones = [10, 25, 50, 100, 500];
    messageMilestones.forEach(milestone => {
      if (previousStats.messagesSent < milestone && currentStats.messagesSent >= milestone) {
        celebrations.push(this.getMilestoneCelebration('messages_milestone', milestone));
      }
    });
    
    // Check AI interaction milestones
    const aiMilestones = [5, 25, 50, 100];
    aiMilestones.forEach(milestone => {
      if (previousStats.aiInteractions < milestone && currentStats.aiInteractions >= milestone) {
        celebrations.push(this.getMilestoneCelebration('ai_milestone', milestone));
      }
    });
    
    return celebrations;
  }
}

export default CelebrationEngine;