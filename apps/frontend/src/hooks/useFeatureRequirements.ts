import { useUserProgressStore } from '@/stores/userProgress';

export function useFeatureRequirements() {
  const { stage, stats } = useUserProgressStore();

  const getRequirementText = (featureKey: string): string => {
    const requirements: Record<string, string> = {
      'contacts:list': stats.contactsAdded === 0 ? 'Add your first contact to unlock' : 'Available',
      'messaging:whatsapp': stats.contactsAdded < 5 ? 'Add 5 contacts to unlock messaging' : 'Available',
      'pipeline:view': stats.contactsAdded < 10 ? 'Add 10 contacts to unlock pipeline' : 'Available',
      'workflow_builder': stage === 'new' || stage === 'beginner' ? 'Reach Intermediate stage to unlock workflows' : 'Available',
      'ai_features': stage === 'new' || stage === 'beginner' ? 'Reach Intermediate stage to unlock AI features' : 'Available',
      'analytics:view': stage === 'new' ? 'Reach Beginner stage to unlock analytics' : 'Available',
      'calendar:view': stage === 'new' || stage === 'beginner' ? 'Reach Intermediate stage to unlock calendar' : 'Available',
      'integrations:view': stage === 'new' || stage === 'beginner' || stage === 'intermediate' ? 'Reach Advanced stage to unlock integrations' : 'Available',
    };

    return requirements[featureKey] || 'Feature locked';
  };

  const getStageRequirements = () => {
    return {
      beginner: `Add ${Math.max(0, 5 - stats.contactsAdded)} more contacts`,
      intermediate: `Send ${Math.max(0, 20 - stats.messagesSent)} more messages`,
      advanced: `Complete ${Math.max(0, 50 - stats.aiInteractions)} more AI interactions`,
      expert: 'Complete all advanced features'
    };
  };

  return {
    getRequirementText,
    getStageRequirements
  };
}