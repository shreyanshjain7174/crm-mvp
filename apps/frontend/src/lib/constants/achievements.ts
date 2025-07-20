export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'feature' | 'usage' | 'social' | 'efficiency';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'stat' | 'action' | 'stage' | 'combo';
    condition: string;
    value?: number;
  }[];
  unlockedAt?: Date;
  hidden?: boolean; // Hidden until unlocked
}

export const ACHIEVEMENTS: Achievement[] = [
  // Milestone Achievements
  {
    id: 'first-contact',
    title: 'First Contact',
    description: 'Add your very first contact to the CRM',
    icon: '👋',
    category: 'milestone',
    points: 10,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'contactsAdded >= 1' }
    ]
  },
  {
    id: 'network-builder',
    title: 'Network Builder',
    description: 'Grow your network to 10 contacts',
    icon: '🌐',
    category: 'milestone',
    points: 25,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'contactsAdded >= 10' }
    ]
  },
  {
    id: 'contact-master',
    title: 'Contact Master',
    description: 'Manage 50+ contacts like a pro',
    icon: '📇',
    category: 'milestone',
    points: 50,
    rarity: 'rare',
    requirements: [
      { type: 'stat', condition: 'contactsAdded >= 50' }
    ]
  },
  {
    id: 'connection-expert',
    title: 'Connection Expert',
    description: 'Build a network of 100+ contacts',
    icon: '🔗',
    category: 'milestone',
    points: 100,
    rarity: 'epic',
    requirements: [
      { type: 'stat', condition: 'contactsAdded >= 100' }
    ]
  },

  // Communication Achievements
  {
    id: 'first-message',
    title: 'First Message',
    description: 'Send your first WhatsApp message',
    icon: '💬',
    category: 'milestone',
    points: 15,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'messagesSent >= 1' }
    ]
  },
  {
    id: 'chatterbox',
    title: 'Chatterbox',
    description: 'Send 25 messages to build relationships',
    icon: '💭',
    category: 'usage',
    points: 30,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'messagesSent >= 25' }
    ]
  },
  {
    id: 'communication-pro',
    title: 'Communication Pro',
    description: 'Send 100+ messages and master engagement',
    icon: '📞',
    category: 'usage',
    points: 75,
    rarity: 'rare',
    requirements: [
      { type: 'stat', condition: 'messagesSent >= 100' }
    ]
  },

  // Stage Progression Achievements
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Advance to Beginner stage',
    icon: '🌱',
    category: 'milestone',
    points: 20,
    rarity: 'common',
    requirements: [
      { type: 'stage', condition: 'beginner' }
    ]
  },
  {
    id: 'pipeline-unlocked',
    title: 'Pipeline Master',
    description: 'Unlock the sales pipeline view',
    icon: '📈',
    category: 'feature',
    points: 40,
    rarity: 'rare',
    requirements: [
      { type: 'stage', condition: 'intermediate' }
    ]
  },
  {
    id: 'ai-powered',
    title: 'AI Powered',
    description: 'Unlock AI assistant capabilities',
    icon: '🤖',
    category: 'feature',
    points: 60,
    rarity: 'epic',
    requirements: [
      { type: 'stage', condition: 'advanced' }
    ]
  },
  {
    id: 'crm-master',
    title: 'CRM Master',
    description: 'Reach the highest level of CRM mastery',
    icon: '🚀',
    category: 'milestone',
    points: 100,
    rarity: 'legendary',
    requirements: [
      { type: 'stage', condition: 'expert' }
    ]
  },

  // AI Achievements
  {
    id: 'ai-curious',
    title: 'AI Curious',
    description: 'Use AI assistance for the first time',
    icon: '🔬',
    category: 'feature',
    points: 25,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'aiInteractions >= 1' }
    ]
  },
  {
    id: 'ai-enthusiast',
    title: 'AI Enthusiast',
    description: 'Use AI assistance 10 times',
    icon: '⚡',
    category: 'usage',
    points: 40,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'aiInteractions >= 10' }
    ]
  },
  {
    id: 'ai-expert',
    title: 'AI Expert',
    description: 'Use AI assistance 50+ times',
    icon: '🧠',
    category: 'usage',
    points: 80,
    rarity: 'epic',
    requirements: [
      { type: 'stat', condition: 'aiInteractions >= 50' }
    ]
  },

  // Pipeline Achievements
  {
    id: 'pipeline-rookie',
    title: 'Pipeline Rookie',
    description: 'Perform your first pipeline action',
    icon: '🎯',
    category: 'feature',
    points: 20,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'pipelineActions >= 1' }
    ]
  },
  {
    id: 'lead-organizer',
    title: 'Lead Organizer',
    description: 'Perform 25 pipeline actions',
    icon: '📊',
    category: 'usage',
    points: 45,
    rarity: 'rare',
    requirements: [
      { type: 'stat', condition: 'pipelineActions >= 25' }
    ]
  },

  // Efficiency Achievements
  {
    id: 'template-user',
    title: 'Template User',
    description: 'Use message templates to save time',
    icon: '📝',
    category: 'efficiency',
    points: 30,
    rarity: 'common',
    requirements: [
      { type: 'stat', condition: 'templatesUsed >= 1' }
    ]
  },
  {
    id: 'efficiency-expert',
    title: 'Efficiency Expert',
    description: 'Use templates 25+ times',
    icon: '⚡',
    category: 'efficiency',
    points: 60,
    rarity: 'rare',
    requirements: [
      { type: 'stat', condition: 'templatesUsed >= 25' }
    ]
  },

  // Combo Achievements
  {
    id: 'multitasker',
    title: 'Multitasker',
    description: 'Use all core features in one day',
    icon: '🎪',
    category: 'usage',
    points: 75,
    rarity: 'epic',
    requirements: [
      { type: 'combo', condition: 'contacts+messages+pipeline+ai' }
    ],
    hidden: true
  },
  {
    id: 'power-user',
    title: 'Power User',
    description: 'Complete 100+ total actions',
    icon: '💪',
    category: 'usage',
    points: 90,
    rarity: 'epic',
    requirements: [
      { type: 'stat', condition: 'totalActions >= 100' }
    ],
    hidden: true
  },

  // Social Achievements
  {
    id: 'early-adopter',
    title: 'Early Adopter',
    description: 'Join the CRM revolution early',
    icon: '🏆',
    category: 'social',
    points: 50,
    rarity: 'rare',
    requirements: [
      { type: 'action', condition: 'earlySignup' }
    ]
  },

  // Special/Hidden Achievements
  {
    id: 'speed-runner',
    title: 'Speed Runner',
    description: 'Reach Intermediate stage in under 1 hour',
    icon: '🏃‍♂️',
    category: 'efficiency',
    points: 100,
    rarity: 'legendary',
    requirements: [
      { type: 'combo', condition: 'intermediate+timeLimit' }
    ],
    hidden: true
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Use CRM actively on weekends',
    icon: '🎮',
    category: 'usage',
    points: 40,
    rarity: 'rare',
    requirements: [
      { type: 'action', condition: 'weekendUsage' }
    ],
    hidden: true
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Active CRM user after midnight',
    icon: '🦉',
    category: 'usage',
    points: 35,
    rarity: 'rare',
    requirements: [
      { type: 'action', condition: 'lateNightUsage' }
    ],
    hidden: true
  }
];

export function checkAchievements(stats: any, stage: string, userProgress: any): Achievement[] {
  const unlockedAchievements: Achievement[] = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    // Skip if already unlocked
    if (userProgress.achievements.some((a: any) => a.id === achievement.id)) {
      return;
    }
    
    let meetsRequirements = true;
    
    achievement.requirements.forEach(req => {
      switch (req.type) {
        case 'stat':
          const [statName, operator, value] = req.condition.split(/\s*(>=|<=|>|<|==)\s*/);
          const statValue = stats[statName] || 0;
          const targetValue = parseInt(value);
          
          switch (operator) {
            case '>=': 
              if (!(statValue >= targetValue)) meetsRequirements = false;
              break;
            case '<=': 
              if (!(statValue <= targetValue)) meetsRequirements = false;
              break;
            case '>': 
              if (!(statValue > targetValue)) meetsRequirements = false;
              break;
            case '<': 
              if (!(statValue < targetValue)) meetsRequirements = false;
              break;
            case '==': 
              if (!(statValue === targetValue)) meetsRequirements = false;
              break;
          }
          break;
          
        case 'stage':
          if (stage !== req.condition) meetsRequirements = false;
          break;
          
        case 'action':
          // Custom action-based achievements
          // These would be triggered by specific user actions
          meetsRequirements = false; // Default to false for now
          break;
          
        case 'combo':
          // Complex combinations - implement specific logic
          meetsRequirements = false; // Default to false for now
          break;
      }
    });
    
    if (meetsRequirements) {
      unlockedAchievements.push({
        ...achievement,
        unlockedAt: new Date()
      });
    }
  });
  
  return unlockedAchievements;
}

export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category);
}

export function getAchievementsByRarity(rarity: Achievement['rarity']): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
}

export function calculateTotalPoints(achievements: Achievement[]): number {
  return achievements.reduce((total, achievement) => total + achievement.points, 0);
}

export function getNextMilestoneAchievements(stats: any, stage: string): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => {
    // Return achievements that are close to being unlocked
    if (achievement.requirements.length === 1 && achievement.requirements[0].type === 'stat') {
      const req = achievement.requirements[0];
      const [statName, , value] = req.condition.split(/\s*(>=|<=|>|<|==)\s*/);
      const statValue = stats[statName] || 0;
      const targetValue = parseInt(value);
      
      // Show achievements that are within 80% completion
      return statValue >= targetValue * 0.5 && statValue < targetValue;
    }
    return false;
  }).slice(0, 3); // Show top 3 next achievements
}