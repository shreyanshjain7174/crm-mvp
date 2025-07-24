export type UserStage = 'new' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface UserStageConfig {
  id: UserStage;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirements: UnlockRequirement[];
  unlockedFeatures: string[];
  nextHint: string;
}

export interface UnlockRequirement {
  type: 'contact_count' | 'message_count' | 'ai_interactions' | 'time_based' | 'pipeline_actions' | 'templates_used';
  threshold: number;
  condition: 'gte' | 'lte' | 'equals';
  description: string;
}

export const USER_STAGES: Record<UserStage, UserStageConfig> = {
  new: {
    id: 'new',
    title: 'Welcome!',
    description: 'Start your CRM journey by adding your first contact',
    icon: '👋',
    color: 'blue',
    requirements: [],
    unlockedFeatures: ['contacts:create'],
    nextHint: 'Add your first contact to get started'
  },
  beginner: {
    id: 'beginner',
    title: 'First Contact',
    description: 'Great! Now let\'s send your first WhatsApp message',
    icon: '📱',
    color: 'green',
    requirements: [
      {
        type: 'contact_count',
        threshold: 1,
        condition: 'gte',
        description: 'Add your first contact'
      }
    ],
    unlockedFeatures: ['contacts:list', 'contacts:edit', 'messages:send'],
    nextHint: 'Send them a WhatsApp message'
  },
  intermediate: {
    id: 'intermediate',
    title: 'Growing Network',
    description: 'Time to organize your leads with the pipeline view',
    icon: '📈',
    color: 'purple',
    requirements: [
      {
        type: 'contact_count',
        threshold: 10,
        condition: 'gte',
        description: 'Add 10 or more contacts'
      },
      {
        type: 'message_count',
        threshold: 5,
        condition: 'gte',
        description: 'Send 5 or more messages'
      }
    ],
    unlockedFeatures: ['pipeline:view', 'contacts:tags', 'contacts:filters', 'templates:create', 'agents:marketplace'],
    nextHint: 'Organize your leads by dragging them into stages'
  },
  advanced: {
    id: 'advanced',
    title: 'Busy Professional',
    description: 'Let AI help you respond faster and more effectively',
    icon: '🤖',
    color: 'orange',
    requirements: [
      {
        type: 'message_count',
        threshold: 5,
        condition: 'gte',
        description: 'Send 5 or more messages'
      },
      {
        type: 'pipeline_actions',
        threshold: 10,
        condition: 'gte',
        description: 'Perform 10 pipeline actions'
      }
    ],
    unlockedFeatures: ['ai:suggestions', 'ai:responses', 'automation:basic'],
    nextHint: 'Try AI suggestions for faster responses'
  },
  expert: {
    id: 'expert',
    title: 'CRM Master',
    description: 'Unlock advanced automation and custom workflows',
    icon: '🚀',
    color: 'gold',
    requirements: [
      {
        type: 'ai_interactions',
        threshold: 25,
        condition: 'gte',
        description: 'Use AI assistance 25+ times'
      },
      {
        type: 'templates_used',
        threshold: 10,
        condition: 'gte',
        description: 'Use message templates 10+ times'
      }
    ],
    unlockedFeatures: ['automation:advanced', 'automation:rules', 'analytics:full', 'workflows:custom', 'monitoring:system', 'ai:employees'],
    nextHint: 'Create AI employees to automate your business'
  }
};

export const FEATURE_GATES = {
  // Contacts
  'contacts:create': 'new',
  'contacts:list': 'beginner',
  'contacts:edit': 'beginner',
  'contacts:tags': 'intermediate',
  'contacts:filters': 'intermediate',
  
  // Messages
  'messages:send': 'beginner',
  'messages:templates': 'intermediate',
  'templates:create': 'intermediate',
  'templates:used': 'expert',
  
  // Pipeline
  'pipeline:view': 'intermediate',
  'pipeline:actions': 'intermediate',
  
  // AI Features
  'ai:suggestions': 'advanced',
  'ai:responses': 'advanced',
  'ai:interactions': 'expert',
  'ai:employees': 'expert',
  
  // Agent Platform
  'agents:marketplace': 'intermediate',
  'agents:install': 'intermediate',
  'agents:manage': 'advanced',
  
  // Automation
  'automation:basic': 'advanced',
  'automation:advanced': 'expert',
  'automation:rules': 'expert',
  'workflows:custom': 'expert',
  
  // Analytics & Monitoring
  'analytics:basic': 'intermediate',
  'analytics:full': 'expert',
  'monitoring:system': 'expert',
  
  // Workflows
  'workflows:view': 'intermediate',
  'workflows:create': 'advanced',
  'workflows:manage': 'expert',
  
  // Integrations
  'integrations:view': 'intermediate',
  'integrations:connect': 'advanced',
  'integrations:manage': 'expert'
} as const;

export type FeatureKey = keyof typeof FEATURE_GATES;