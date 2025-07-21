import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserStage, USER_STAGES, FeatureKey, FEATURE_GATES } from '@/lib/constants/user-stages';
import { checkAchievements, Achievement } from '@/lib/constants/achievements';

// Re-export Achievement interface for other components
export type { Achievement };


export interface UserStats {
  contactsAdded: number;
  messagesSent: number;
  aiInteractions: number;
  templatesUsed: number;
  pipelineActions: number;
  loginStreak: number;
  totalSessions: number;
}

export interface UserProgress {
  // Core progression
  stage: UserStage;
  unlockedFeatures: FeatureKey[];
  achievements: Achievement[];
  stats: UserStats;
  
  // Onboarding
  onboardingCompleted: boolean;
  hasSeenWelcome: boolean;
  currentHint: string | null;
  
  // Tracking
  lastActiveDate: Date;
  accountCreatedAt: Date;
  
  // Feature discovery
  newFeaturesSeen: FeatureKey[];
  pendingCelebrations: string[];
}

interface UserProgressStore extends UserProgress {
  // Actions
  updateStats: (stats: Partial<UserStats>) => void;
  incrementStat: (statKey: keyof UserStats, amount?: number) => void;
  unlockFeature: (feature: FeatureKey) => void;
  addAchievement: (achievement: Omit<Achievement, 'unlockedAt'>) => void;
  checkStageProgression: () => void;
  checkAchievements: () => void;
  markFeatureAsSeen: (feature: FeatureKey) => void;
  dismissHint: () => void;
  setCurrentHint: (hint: string) => void;
  celebrateFeature: (feature: FeatureKey) => void;
  completePendingCelebration: (celebrationId: string) => void;
  resetProgress: () => void;
  syncWithBackend: () => Promise<void>;
  
  // Getters
  canAccessFeature: (feature: FeatureKey) => boolean;
  getProgressPercentage: () => number;
  getNextStageRequirements: () => string[];
  hasUnseenFeatures: () => boolean;
}

const initialStats: UserStats = {
  contactsAdded: 0,
  messagesSent: 0,
  aiInteractions: 0,
  templatesUsed: 0,
  pipelineActions: 0,
  loginStreak: 0,
  totalSessions: 0
};

const initialState: UserProgress = {
  stage: 'new',
  unlockedFeatures: ['contacts:create'],
  achievements: [],
  stats: initialStats,
  onboardingCompleted: false,
  hasSeenWelcome: false,
  currentHint: 'Add your first contact to get started',
  lastActiveDate: new Date(),
  accountCreatedAt: new Date(),
  newFeaturesSeen: [],
  pendingCelebrations: []
};

export const useUserProgressStore = create<UserProgressStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      updateStats: (newStats) => {
        set((state) => ({
          stats: { ...state.stats, ...newStats },
          lastActiveDate: new Date()
        }));
        // Check for stage progression after stats update
        setTimeout(() => get().checkStageProgression(), 0);
      },
      
      incrementStat: (statKey, amount = 1) => {
        set((state) => ({
          stats: {
            ...state.stats,
            [statKey]: state.stats[statKey] + amount
          },
          lastActiveDate: new Date()
        }));
        // Check for stage progression after increment
        setTimeout(() => get().checkStageProgression(), 0);
      },
      
      unlockFeature: (feature) => {
        set((state) => {
          if (state.unlockedFeatures.includes(feature)) {
            return state;
          }
          
          return {
            unlockedFeatures: [...state.unlockedFeatures, feature],
            newFeaturesSeen: state.newFeaturesSeen.includes(feature) 
              ? state.newFeaturesSeen 
              : [...state.newFeaturesSeen, feature],
            pendingCelebrations: [...state.pendingCelebrations, `feature-${feature}`]
          };
        });
      },
      
      addAchievement: (achievement) => {
        set((state) => ({
          achievements: [
            ...state.achievements,
            { ...achievement, unlockedAt: new Date() }
          ],
          pendingCelebrations: [...state.pendingCelebrations, `achievement-${achievement.id}`]
        }));
      },
      
      checkStageProgression: () => {
        const state = get();
        const currentStage = state.stage;
        const stages: UserStage[] = ['new', 'beginner', 'intermediate', 'advanced', 'expert'];
        const currentIndex = stages.indexOf(currentStage);
        
        // Check if we can advance to the next stage
        if (currentIndex < stages.length - 1) {
          const nextStage = stages[currentIndex + 1];
          const nextStageConfig = USER_STAGES[nextStage];
          
          const meetsRequirements = nextStageConfig.requirements.every(req => {
            const statValue = state.stats[req.type as keyof UserStats] || 0;
            
            switch (req.condition) {
              case 'gte':
                return statValue >= req.threshold;
              case 'lte':
                return statValue <= req.threshold;
              case 'equals':
                return statValue === req.threshold;
              default:
                return false;
            }
          });
          
          if (meetsRequirements) {
            set((prevState) => ({
              stage: nextStage,
              currentHint: nextStageConfig.nextHint,
              unlockedFeatures: [
                ...prevState.unlockedFeatures,
                ...nextStageConfig.unlockedFeatures.filter(f => !prevState.unlockedFeatures.includes(f as FeatureKey))
              ] as FeatureKey[],
              pendingCelebrations: [...prevState.pendingCelebrations, `stage-${nextStage}`]
            }));
            
            // Add stage achievement
            get().addAchievement({
              id: `stage-${nextStage}`,
              title: `${nextStageConfig.title} Unlocked!`,
              description: nextStageConfig.description,
              icon: nextStageConfig.icon,
              category: 'milestone',
              points: 50,
              rarity: 'rare',
              requirements: [
                { type: 'stage', condition: `stage === '${nextStage}'` }
              ]
            });
          }
        }
        
        // Check for new achievements
        get().checkAchievements();
      },
      
      checkAchievements: () => {
        const state = get();
        const newAchievements = checkAchievements(state.stats, state.stage, state);
        
        newAchievements.forEach(achievement => {
          get().addAchievement(achievement);
        });
      },
      
      markFeatureAsSeen: (feature) => {
        set((state) => ({
          newFeaturesSeen: state.newFeaturesSeen.includes(feature)
            ? state.newFeaturesSeen
            : [...state.newFeaturesSeen, feature]
        }));
      },
      
      dismissHint: () => {
        set({ currentHint: null });
      },
      
      setCurrentHint: (hint) => {
        set({ currentHint: hint });
      },
      
      celebrateFeature: (feature) => {
        set((state) => ({
          pendingCelebrations: [...state.pendingCelebrations, `feature-${feature}`]
        }));
      },
      
      completePendingCelebration: (celebrationId) => {
        set((state) => ({
          pendingCelebrations: state.pendingCelebrations.filter(id => id !== celebrationId)
        }));
      },
      
      resetProgress: () => {
        set(initialState);
      },
      
      syncWithBackend: async () => {
        try {
          // Import apiClient dynamically to avoid circular dependencies
          const { apiClient } = await import('@/lib/api');
          const backendData = await apiClient.getUserProgress();
          
          // If backend shows this is truly a new user (all stats are 0), ensure clean state
          const isNewUser = backendData.stats.contactsAdded === 0 && 
                           backendData.stats.messagesSent === 0 && 
                           backendData.stats.aiInteractions === 0;
          
          if (isNewUser) {
            // Ensure clean initial state for new users
            set({
              ...initialState,
              stage: 'new',
              stats: {
                contactsAdded: 0,
                messagesSent: 0,
                aiInteractions: 0,
                templatesUsed: 0,
                pipelineActions: 0,
                loginStreak: 0,
                totalSessions: 0
              },
              lastActiveDate: new Date()
            });
          } else {
            // Update stats from backend for existing users with actual data
            set((state) => ({
              stats: {
                ...state.stats,
                contactsAdded: backendData.stats.contactsAdded || 0,
                messagesSent: backendData.stats.messagesSent || 0,
                aiInteractions: backendData.stats.aiInteractions || 0,
                templatesUsed: backendData.stats.templatesUsed || 0,
                pipelineActions: backendData.stats.pipelineActions || 0
              },
              stage: backendData.stage as UserStage || 'new',
              lastActiveDate: new Date()
            }));
          }
          
          // Check for stage progression after sync
          setTimeout(() => get().checkStageProgression(), 0);
        } catch (error) {
          console.warn('Error syncing with backend, maintaining local state:', error);
          // On authentication error, reset to initial state for clean login
          if (error instanceof Error && error.message.includes('No token provided')) {
            set({
              ...initialState,
              stage: 'new',
              stats: {
                contactsAdded: 0,
                messagesSent: 0,
                aiInteractions: 0,
                templatesUsed: 0,
                pipelineActions: 0,
                loginStreak: 0,
                totalSessions: 0
              }
            });
          }
          // On other errors, maintain current state - don't override with potentially incorrect data
          // New users will maintain their initial empty state
        }
      },
      
      // Getters
      canAccessFeature: (feature) => {
        const state = get();
        return state.unlockedFeatures.includes(feature);
      },
      
      getProgressPercentage: () => {
        const state = get();
        const stages: UserStage[] = ['new', 'beginner', 'intermediate', 'advanced', 'expert'];
        const currentIndex = stages.indexOf(state.stage);
        return ((currentIndex + 1) / stages.length) * 100;
      },
      
      getNextStageRequirements: () => {
        const state = get();
        const stages: UserStage[] = ['new', 'beginner', 'intermediate', 'advanced', 'expert'];
        const currentIndex = stages.indexOf(state.stage);
        
        if (currentIndex >= stages.length - 1) {
          return ['You\'ve reached the highest level!'];
        }
        
        const nextStage = stages[currentIndex + 1];
        const nextStageConfig = USER_STAGES[nextStage];
        
        return nextStageConfig.requirements.map(req => {
          const currentValue = state.stats[req.type as keyof UserStats] || 0;
          const remaining = Math.max(0, req.threshold - currentValue);
          
          if (remaining === 0) {
            return `✅ ${req.description}`;
          }
          
          return `${req.description} (${remaining} more needed)`;
        });
      },
      
      hasUnseenFeatures: () => {
        const state = get();
        return state.unlockedFeatures.some(feature => !state.newFeaturesSeen.includes(feature));
      }
    }),
    {
      name: 'user-progress',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic for future versions
          return {
            ...persistedState,
            // Add any new fields or transformations
          };
        }
        return persistedState;
      }
    }
  )
);

// Convenience hooks for common operations
export const useUserStage = () => useUserProgressStore((state) => state.stage);
export const useUserStats = () => useUserProgressStore((state) => state.stats);
export const useCanAccessFeature = () => useUserProgressStore((state) => state.canAccessFeature);
export const useCurrentHint = () => useUserProgressStore((state) => state.currentHint);
export const useProgressPercentage = () => useUserProgressStore((state) => state.getProgressPercentage);
export const useAchievements = () => useUserProgressStore((state) => state.achievements);
export const usePendingCelebrations = () => useUserProgressStore((state) => state.pendingCelebrations);

// Developer utilities (exposed globally for debugging)
if (typeof window !== 'undefined') {
  (window as any).resetUserProgress = () => {
    useUserProgressStore.getState().resetProgress();
    console.log('User progress has been reset to initial state');
  };
  
  (window as any).debugUserProgress = () => {
    const state = useUserProgressStore.getState();
    console.log('Current user progress:', {
      stage: state.stage,
      stats: state.stats,
      unlockedFeatures: state.unlockedFeatures,
      onboardingCompleted: state.onboardingCompleted
    });
  };
}