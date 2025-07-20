import { UserStage } from '@/lib/constants/user-stages';

export const createMockUserProgressStore = (initialState = {}) => {
  const defaultState = {
    stage: 'new' as UserStage,
    stats: {
      contactsAdded: 0,
      messagesSent: 0,
      aiInteractions: 0,
      templatesUsed: 0,
      pipelineActions: 0,
    },
    achievements: [],
    unlockedFeatures: [],
    currentHint: null,
    pendingCelebrations: [],
    ...initialState,
  };

  let state = { ...defaultState };

  const store = {
    getState: () => state,
    setState: (newState: any) => {
      state = { ...state, ...newState };
    },
    reset: () => {
      state = { ...defaultState };
    },
    incrementStat: (stat: string) => {
      state.stats[stat] = (state.stats[stat] || 0) + 1;
      // Simulate stage progression
      if (stat === 'contactsAdded' && state.stats.contactsAdded === 1) {
        state.stage = 'beginner';
      }
    },
    updateStageIfNeeded: (stats: any) => {
      state.stats = stats;
      // Simulate stage updates based on stats
      if (stats.contactsAdded >= 10) state.stage = 'intermediate';
      if (stats.messagesSent >= 50) state.stage = 'advanced';
      if (stats.aiInteractions >= 25) state.stage = 'expert';
    },
    setCurrentHint: (hint: string | null) => {
      state.currentHint = hint;
    },
    addAchievement: (achievement: any) => {
      state.achievements.push(achievement);
    },
    completePendingCelebration: (id: string) => {
      state.pendingCelebrations = state.pendingCelebrations.filter(c => c !== id);
    },
  };

  return store;
};