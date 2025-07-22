'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressiveDashboard } from '@/components/dashboard/ProgressiveDashboard';
import { AchievementSystem } from '@/components/help/AchievementToast';
import { ContextualGuide, useContextualHints } from '@/components/help/ContextualGuide';
import { DiscoveryPrompt } from '@/components/help/DiscoveryPrompt';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { AddContactModal } from '@/components/contacts/AddContactModal';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgressStore } from '@/stores/userProgress';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
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
      {/* Debug info toggle (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="bg-gray-800 text-white px-2 py-1 rounded text-xs"
          >
            Debug
          </button>
          {showDebug && (
            <div className="mt-2 bg-black text-white p-4 rounded text-xs max-w-sm">
              {/* Current State */}
              <div className="mb-3">
                <div className="text-yellow-300 font-bold mb-1">Current State:</div>
                <div><strong>Stage:</strong> {stage}</div>
                <div><strong>Contacts:</strong> {stats.contactsAdded}</div>
                <div><strong>Messages:</strong> {stats.messagesSent}</div>
                <div><strong>AI:</strong> {stats.aiInteractions}</div>
                <div><strong>Features:</strong> {unlockedFeatures.length}</div>
                <div className="mt-1 text-yellow-300">
                  NewUserStage: {stats.contactsAdded === 0 || stage === 'new' ? 'YES' : 'NO'}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-600 pt-3">
                <div className="text-yellow-300 font-bold mb-2">Quick Actions:</div>
                <div className="space-y-1">
                  <button 
                    onClick={unlockAllFeatures}
                    className="block w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white text-xs"
                  >
                    🚀 Unlock All Features
                  </button>
                  <button 
                    onClick={addTestData}
                    className="block w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white text-xs"
                  >
                    📊 Add Test Data
                  </button>
                  <button 
                    onClick={resetProgress}
                    className="block w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white text-xs"
                  >
                    🔄 Reset Progress
                  </button>
                  <button 
                    onClick={() => {
                      (window as any).__BYPASS_FEATURE_GATES = true;
                      window.location.reload();
                    }}
                    className="block w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-white text-xs"
                  >
                    🔓 Bypass All Gates
                  </button>
                </div>
              </div>

              {/* Stage Selector */}
              <div className="border-t border-gray-600 pt-3 mt-3">
                <div className="text-yellow-300 font-bold mb-2">Jump to Stage:</div>
                <div className="grid grid-cols-2 gap-1">
                  {(['new', 'beginner', 'intermediate', 'advanced', 'expert'] as const).map(stageOption => (
                    <button
                      key={stageOption}
                      onClick={() => setStage(stageOption)}
                      className={`px-2 py-1 rounded text-xs ${
                        stage === stageOption 
                          ? 'bg-yellow-600 text-black' 
                          : 'bg-gray-600 hover:bg-gray-500 text-white'
                      }`}
                    >
                      {stageOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main progressive dashboard */}
      <ProgressiveDashboard onAddContact={handleAddContact} />
      
      {/* Add Contact Modal for new users */}
      <AddContactModal 
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onSuccess={handleContactSuccess}
      />
      
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