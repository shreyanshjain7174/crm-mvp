import { useUserProgressStore, type UserStats } from '@/stores/userProgress';
import { FeatureKey, FEATURE_GATES } from '@/lib/constants/user-stages';

export interface FeatureGateResult {
  canAccess: boolean;
  isNew: boolean;
  requiredStage: string;
  currentStage: string;
}

export function useFeatureGate(feature: FeatureKey): FeatureGateResult {
  const stage = useUserProgressStore((state) => state.stage);
  const canAccessFeature = useUserProgressStore((state) => state.canAccessFeature);
  const newFeaturesSeen = useUserProgressStore((state) => state.newFeaturesSeen);
  
  const requiredStage = FEATURE_GATES[feature];
  
  // In development mode, allow bypassing feature gates with a global flag
  let canAccess = canAccessFeature(feature);
  if (typeof window !== 'undefined' && (window as any).__BYPASS_FEATURE_GATES) {
    canAccess = true;
  }
  
  const isNew = canAccess && !newFeaturesSeen.includes(feature);
  
  return {
    canAccess,
    isNew,
    requiredStage,
    currentStage: stage
  };
}

export function useFeatureGates(features: FeatureKey[]): Record<FeatureKey, FeatureGateResult> {
  const results: Record<string, FeatureGateResult> = {};
  
  features.forEach(feature => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[feature] = useFeatureGate(feature);
  });
  
  return results as Record<FeatureKey, FeatureGateResult>;
}

// Helper hook for conditional rendering
export function useFeatureGuard(feature: FeatureKey) {
  const { canAccess, isNew } = useFeatureGate(feature);
  const markFeatureAsSeen = useUserProgressStore((state) => state.markFeatureAsSeen);
  
  const markAsSeen = () => {
    if (isNew) {
      markFeatureAsSeen(feature);
    }
  };
  
  return {
    canAccess,
    isNew,
    markAsSeen
  };
}

// Hook for tracking feature usage
export function useFeatureTracker() {
  const incrementStat = useUserProgressStore((state) => state.incrementStat);
  const unlockFeature = useUserProgressStore((state) => state.unlockFeature);
  const addAchievement = useUserProgressStore((state) => state.addAchievement);
  
  const trackFeatureUsage = (feature: FeatureKey, statKey?: keyof UserStats) => {
    if (statKey) {
      incrementStat(statKey);
    }
    
    // Track specific feature usage achievements
    switch (feature) {
      case 'contacts:create':
        incrementStat('contactsAdded');
        break;
      case 'messages:send':
        incrementStat('messagesSent');
        break;
      case 'ai:suggestions':
      case 'ai:responses':
        incrementStat('aiInteractions');
        break;
      case 'templates:used':
        incrementStat('templatesUsed');
        break;
      case 'pipeline:actions':
        incrementStat('pipelineActions');
        break;
    }
  };
  
  const trackMilestone = (milestoneId: string, title: string, description: string, icon: string) => {
    addAchievement({
      id: milestoneId,
      title,
      description,
      icon,
      category: 'milestone',
      points: 25,
      rarity: 'common',
      requirements: [
        { type: 'action', condition: 'milestone_triggered' }
      ]
    });
  };
  
  return {
    trackFeatureUsage,
    trackMilestone
  };
}