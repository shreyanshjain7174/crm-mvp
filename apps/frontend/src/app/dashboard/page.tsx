'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressiveDashboard } from '@/components/dashboard/ProgressiveDashboard';
import { AchievementSystem } from '@/components/help/AchievementToast';
import { ContextualGuide, useContextualHints } from '@/components/help/ContextualGuide';
import { DiscoveryPrompt } from '@/components/help/DiscoveryPrompt';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureTracker } from '@/hooks/useFeatureGate';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const { hints } = useContextualHints();
  const { trackFeatureUsage } = useFeatureTracker();
  const incrementStat = useUserProgressStore(state => state.incrementStat);
  const stage = useUserProgressStore(state => state.stage);
  
  const handleAddContact = () => {
    // Track the feature usage
    trackFeatureUsage('contacts:create');
    
    // Navigate to leads page with modal trigger
    router.push('/dashboard/leads?add=true');
  };
  
  const handleDiscoveryAction = (actionType: string) => {
    switch (actionType) {
      case 'message_inactive':
        router.push('/dashboard/messages');
        break;
      case 'create_template':
        router.push('/dashboard/messages?tab=templates');
        break;
      case 'view_pipeline':
        router.push('/dashboard/leads');
        break;
      case 'try_ai':
        router.push('/dashboard/ai');
        break;
      default:
        console.log('Unknown action:', actionType);
    }
  };

  return (
    <>
      {/* Main progressive dashboard */}
      <ProgressiveDashboard onAddContact={handleAddContact} />
      
      {/* Help and guidance systems */}
      <ContextualGuide hints={hints} />
      <DiscoveryPrompt onAction={handleDiscoveryAction} />
      
      {/* Achievement celebrations */}
      <AchievementSystem />
      
      {/* Connection status for advanced users */}
      {(stage === 'advanced' || stage === 'expert') && (
        <div className="fixed bottom-4 right-4">
          <ConnectionStatus showDetails={false} />
        </div>
      )}
    </>
  );
}