'use client';

import React, { useEffect } from 'react';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { NewUserStage } from './stages/NewUserStage';
import { ModernNewUserStage } from './stages/ModernNewUserStage';
import { BeginnerStage } from './stages/BeginnerStage';
import { IntermediateStage } from './stages/IntermediateStage';
import { AdvancedStage } from './stages/AdvancedStage';
import { ExpertStage } from './stages/ExpertStage';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { ModernDashboard } from '@/components/ui/modern-dashboard';

// Import existing dashboard components
import { DashboardStats } from './dashboard-stats';
import { LeadsPipeline } from './leads-pipeline';

interface ProgressiveDashboardProps {
  onAddContact?: () => void;
}

export function ProgressiveDashboard({ onAddContact }: ProgressiveDashboardProps) {
  const stage = useUserProgressStore(state => state.stage);
  const stats = useUserProgressStore(state => state.stats);
  const syncWithBackend = useUserProgressStore(state => state.syncWithBackend);
  const { canAccess: hasAnyContacts } = useFeatureGate('contacts:list');
  const { canAccess: hasPipeline } = useFeatureGate('pipeline:view');
  const { canAccess: hasAI } = useFeatureGate('ai:suggestions');
  const { canAccess: hasAdvancedFeatures } = useFeatureGate('monitoring:system');
  
  // Sync user progress with backend on component mount
  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);
  
  // Show stage-specific components based on user progression
  // Prioritize local stats over stage to ensure blank dashboard for truly new users
  // This ensures no populated data is shown until the user actually adds their first contact
  const isNewUser = stats.contactsAdded === 0 && stats.messagesSent === 0 && stats.aiInteractions === 0;
  
  if (isNewUser || stage === 'new') {
    console.log('Rendering ModernNewUserStage (Empty State) - Stage:', stage, 'Stats:', stats);
    return (
      <ModernNewUserStage 
        onAddContact={onAddContact || (() => {})} 
      />
    );
  }
  
  // Show beginner stage for users who just started
  if (stage === 'beginner' && stats.contactsAdded < 5) {
    return (
      <div className="space-y-6">
        <DashboardStats />
        <BeginnerStage 
          onSendMessage={() => {/* Navigate to messages */}}
          onViewContacts={() => {/* Navigate to contacts */}}
        />
      </div>
    );
  }
  
  // Show intermediate stage for users building their network
  if (stage === 'intermediate') {
    return (
      <div className="space-y-6">
        <DashboardStats />
        <IntermediateStage />
      </div>
    );
  }
  
  // Show advanced stage for AI-powered users with modern elements
  if (stage === 'advanced') {
    return (
      <div className="space-y-6">
        <DashboardStats />
        <div className="grid grid-cols-1 gap-6">
          <LeadsPipeline />
        </div>
      </div>
    );
  }
  
  // Show expert stage for CRM masters with modern dashboard
  if (stage === 'expert') {
    return (
      <div className="space-y-6">
        <DashboardStats />
        <div className="grid grid-cols-1 gap-6">
          <LeadsPipeline />
        </div>
        <ExpertStage />
      </div>
    );
  }
  
  // For users with some progress, show progressive dashboard with real stats
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Welcome back message for returning users */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg p-6 border border-border backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-muted-foreground">
            {getWelcomeMessage(stage, stats)}
          </p>
        </div>
      
      {/* Progressive feature sections */}
      
      {/* Stage 1-2: Basic Stats (unlocked after first contact) */}
      <FeatureGate feature="contacts:list">
        <DashboardStats />
      </FeatureGate>
      
      {/* Stage 3: Pipeline View (unlocked after 10 contacts) */}
      <FeatureGate 
        feature="pipeline:view"
        fallback={
          <PipelineTeaser 
            contactCount={stats.contactsAdded}
            requiredCount={10}
          />
        }
      >
        <LeadsPipeline />
      </FeatureGate>
      
      {/* Stage 4: AI Features (unlocked after 5 messages) */}
      <FeatureGate 
        feature="ai:suggestions"
        fallback={
          <AITeaser 
            messageCount={stats.messagesSent}
            requiredCount={5}
          />
        }
      >
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🤖 AI Assistant Active</h3>
          <p className="text-blue-700 dark:text-blue-300">Your AI assistant is ready to help with response suggestions and automation.</p>
        </div>
      </FeatureGate>
      
      {/* Stage 5: Advanced Features (unlocked after 25 AI interactions) */}
      <FeatureGate 
        feature="monitoring:system"
        fallback={
          <AdvancedTeaser 
            aiInteractions={stats.aiInteractions}
            requiredCount={25}
          />
        }
      >
        {/* Advanced monitoring features will be implemented here */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">🚀 Advanced Features Unlocked!</h3>
          <p className="text-purple-700">System monitoring and advanced analytics are now available.</p>
        </div>
      </FeatureGate>
      </div>
    </div>
  );
}

function getWelcomeMessage(stage: string, stats: any): string {
  switch (stage) {
    case 'beginner':
      return `You have ${stats.contactsAdded} contacts. Try sending them WhatsApp messages to unlock more features!`;
    case 'intermediate':
      return `Great progress! You've sent ${stats.messagesSent} messages. Use the pipeline below to organize your leads.`;
    case 'advanced':
      return `You're managing ${stats.contactsAdded} contacts efficiently. The AI assistant below can help you respond faster.`;
    case 'expert':
      return `Impressive! You've used AI ${stats.aiInteractions} times. You now have access to all advanced features.`;
    default:
      return 'Continue using your CRM to unlock more powerful features!';
  }
}

// Teaser components for locked features
function PipelineTeaser({ contactCount, requiredCount }: { contactCount: number; requiredCount: number }) {
  const remaining = requiredCount - contactCount;
  
  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-lg p-6 border-2 border-dashed border-purple-500/30 dark:border-purple-400/30 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-500/20 dark:bg-purple-400/30 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">📈</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Pipeline View Coming Soon!</h3>
          <p className="text-muted-foreground">
            Add {remaining} more contacts to unlock the pipeline view and organize your leads effectively.
          </p>
          <div className="mt-2 bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((contactCount / requiredCount) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AITeaser({ messageCount, requiredCount }: { messageCount: number; requiredCount: number }) {
  const remaining = requiredCount - messageCount;
  
  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-lg p-6 border-2 border-dashed border-orange-500/30 dark:border-orange-400/30 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-500/20 dark:bg-orange-400/30 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">🤖</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">AI Assistant Almost Ready!</h3>
          <p className="text-muted-foreground">
            Send {remaining} more messages to unlock AI-powered response suggestions and automation.
          </p>
          <div className="mt-2 bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((messageCount / requiredCount) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvancedTeaser({ aiInteractions, requiredCount }: { aiInteractions: number; requiredCount: number }) {
  const remaining = requiredCount - aiInteractions;
  
  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-lg p-6 border-2 border-dashed border-yellow-500/30 dark:border-yellow-400/30 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-500/20 dark:bg-yellow-400/30 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">🚀</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Advanced Features Loading...</h3>
          <p className="text-muted-foreground">
            Use AI assistance {remaining} more times to unlock advanced analytics, monitoring, and custom workflows.
          </p>
          <div className="mt-2 bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((aiInteractions / requiredCount) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressiveDashboard;