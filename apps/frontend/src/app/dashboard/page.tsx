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
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  
  const { hints } = useContextualHints();
  const { trackFeatureUsage } = useFeatureTracker();
  const incrementStat = useUserProgressStore(state => state.incrementStat);
  const stage = useUserProgressStore(state => state.stage);
  
  const handleAddContact = () => {
    // Track the feature usage
    trackFeatureUsage('contacts:create');
    incrementStat('contactsAdded');
    
    // Show add contact modal or navigate to contacts page
    setShowAddContactModal(true);
    // For now, we'll simulate adding a contact
    setTimeout(() => {
      setShowAddContactModal(false);
      // Could navigate to contacts page or refresh data
    }, 2000);
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
      
      {/* Add Contact Modal (simple placeholder) */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Adding Your First Contact...</h3>
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-slate-600">This will unlock your contact list and messaging features!</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}