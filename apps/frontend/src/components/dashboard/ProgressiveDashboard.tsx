'use client';

import React, { useEffect } from 'react';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { NewUserStage } from './stages/NewUserStage';
import { BeginnerStage } from './stages/BeginnerStage';
import { IntermediateStage } from './stages/IntermediateStage';
import { AdvancedStage } from './stages/AdvancedStage';
import { ExpertStage } from './stages/ExpertStage';
import { FeatureGate } from '@/components/ui/FeatureGate';

// Import existing dashboard components
import { DashboardStats } from './dashboard-stats';
import { LeadsPipeline } from './leads-pipeline';
import { AIAgentStatus } from './ai-agent-status';
import { SystemMonitoring } from './system-monitoring';

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
  if (stage === 'new' || stats.contactsAdded === 0) {
    return (
      <NewUserStage 
        onAddContact={onAddContact || (() => {})} 
      />
    );
  }
  
  // Show beginner stage for users who just started
  if (stage === 'beginner' && stats.contactsAdded < 5) {
    return (
      <BeginnerStage 
        onSendMessage={() => {/* Navigate to messages */}}
        onViewContacts={() => {/* Navigate to contacts */}}
      />
    );
  }
  
  // Show intermediate stage for users building their network
  if (stage === 'intermediate') {
    return (
      <IntermediateStage />
    );
  }
  
  // Show advanced stage for AI-powered users
  if (stage === 'advanced') {
    return (
      <AdvancedStage />
    );
  }
  
  // Show expert stage for CRM masters
  if (stage === 'expert') {
    return (
      <ExpertStage />
    );
  }
  
  // For users with some progress, show progressive dashboard
  return (
    <div className="space-y-6">
      {/* Welcome back message for returning users */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Welcome back! 👋
        </h2>
        <p className="text-slate-600">
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
        <AIAgentStatus />
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
        <SystemMonitoring />
      </FeatureGate>
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
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-dashed border-purple-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">📈</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Pipeline View Coming Soon!</h3>
          <p className="text-slate-600">
            Add {remaining} more contacts to unlock the pipeline view and organize your leads effectively.
          </p>
          <div className="mt-2 bg-white rounded-full h-2">
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
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border-2 border-dashed border-orange-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">AI Assistant Almost Ready!</h3>
          <p className="text-slate-600">
            Send {remaining} more messages to unlock AI-powered response suggestions and automation.
          </p>
          <div className="mt-2 bg-white rounded-full h-2">
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
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border-2 border-dashed border-yellow-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">🚀</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Advanced Features Loading...</h3>
          <p className="text-slate-600">
            Use AI assistance {remaining} more times to unlock advanced analytics, monitoring, and custom workflows.
          </p>
          <div className="mt-2 bg-white rounded-full h-2">
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