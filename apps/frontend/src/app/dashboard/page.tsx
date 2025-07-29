'use client';

import { useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgressStore } from '@/stores/userProgress';

// Dynamic imports for better code splitting
const ProgressiveDashboard = lazy(() => import('@/components/dashboard/ProgressiveDashboard').then(module => ({ default: module.ProgressiveDashboard })));
const AchievementSystem = lazy(() => import('@/components/help/AchievementToast').then(module => ({ default: module.AchievementSystem })));
const ContextualGuide = lazy(() => import('@/components/help/ContextualGuide').then(module => ({ default: module.ContextualGuide })));
const DiscoveryPrompt = lazy(() => import('@/components/help/DiscoveryPrompt').then(module => ({ default: module.DiscoveryPrompt })));
const ConnectionStatus = lazy(() => import('@/components/ui/connection-status').then(module => ({ default: module.ConnectionStatus })));
const AddContactModal = lazy(() => import('@/components/contacts/AddContactModal').then(module => ({ default: module.AddContactModal })));

// Import hooks directly since they're lightweight
import { useContextualHints } from '@/components/help/ContextualGuide';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  
  const { hints } = useContextualHints();
  const stage = useUserProgressStore(state => state.stage);
  const stats = useUserProgressStore(state => state.stats);
  const unlockedFeatures = useUserProgressStore(state => state.unlockedFeatures);
  const unlockAllFeatures = useUserProgressStore(state => state.unlockAllFeatures);
  const setStage = useUserProgressStore(state => state.setStage);
  const addTestData = useUserProgressStore(state => state.addTestData);
  const resetProgress = useUserProgressStore(state => state.resetProgress);
  
  const handleAddContact = () => {
    // For new users, open the contact modal directly on the dashboard
    // This avoids navigation issues with progressive disclosure
    setIsAddContactModalOpen(true);
  };
  
  const handleDiscoveryAction = (actionType: string) => {
    switch (actionType) {
      case 'add_contact':
        handleAddContact();
        break;
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

  const handleContactSuccess = () => {
    // After successful contact creation, check if we should redirect to contacts page
    if (stage !== 'new') {
      router.push('/dashboard/leads');
    }
  };

  return (
    <>

      {/* Main progressive dashboard */}
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>}>
        <ProgressiveDashboard onAddContact={handleAddContact} />
      </Suspense>
      
      {/* Add Contact Modal for new users */}
      <Suspense fallback={null}>
        <AddContactModal 
          isOpen={isAddContactModalOpen}
          onClose={() => setIsAddContactModalOpen(false)}
          onSuccess={handleContactSuccess}
        />
      </Suspense>
      
      {/* Help and guidance systems */}
      <Suspense fallback={null}>
        <ContextualGuide hints={hints} />
        <DiscoveryPrompt onAction={handleDiscoveryAction} />
        <AchievementSystem />
      </Suspense>
      
      {/* Connection status for advanced users */}
      {(stage === 'advanced' || stage === 'expert') && (
        <div className="fixed bottom-4 right-24 space-y-2">
          <Suspense fallback={null}>
            <ConnectionStatus showDetails={false} />
          </Suspense>
        </div>
      )}
    </>
  );
}