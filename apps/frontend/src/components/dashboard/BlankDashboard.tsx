'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureTracker } from '@/hooks/useFeatureGate';
import { UserPlus, MessageCircle, TrendingUp, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlankDashboardProps {
  onAddContact: () => void;
}

const stageConfig = {
  new: {
    title: 'Welcome to your CRM!',
    subtitle: 'Let\'s start by adding your first contact',
    description: 'Your journey to better customer relationships begins with a single contact. Add someone important to get started.',
    icon: UserPlus,
    primaryAction: 'Add Your First Contact',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-purple-600'
  },
  beginner: {
    title: 'Great start!',
    subtitle: 'Now let\'s send your first message',
    description: 'You have contacts! Time to engage with them through WhatsApp messaging.',
    icon: MessageCircle,
    primaryAction: 'Send WhatsApp Message',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600'
  },
  intermediate: {
    title: 'Building momentum!',
    subtitle: 'Organize your leads with the pipeline',
    description: 'With multiple contacts, it\'s time to organize them into a sales pipeline.',
    icon: TrendingUp,
    primaryAction: 'View Pipeline',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-600'
  },
  advanced: {
    title: 'You\'re getting busy!',
    subtitle: 'Let AI help you respond faster',
    description: 'Managing many conversations? Our AI assistant can help you respond more efficiently.',
    icon: Bot,
    primaryAction: 'Try AI Assistant',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-600'
  },
  expert: {
    title: 'CRM Master!',
    subtitle: 'Create custom workflows',
    description: 'You\'ve unlocked everything! Time to create custom automations and workflows.',
    icon: Sparkles,
    primaryAction: 'Create Workflow',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-orange-600'
  }
};

export function BlankDashboard({ onAddContact }: BlankDashboardProps) {
  const stage = useUserProgressStore(state => state.stage);
  const stats = useUserProgressStore(state => state.stats);
  const currentHint = useUserProgressStore(state => state.currentHint);
  const progressPercentage = useUserProgressStore(state => state.getProgressPercentage);
  const { trackFeatureUsage } = useFeatureTracker();
  
  const config = stageConfig[stage];
  const IconComponent = config.icon;
  
  const handlePrimaryAction = () => {
    switch (stage) {
      case 'new':
        trackFeatureUsage('contacts:create');
        onAddContact();
        break;
      case 'beginner':
        trackFeatureUsage('messages:send');
        // Navigate to messages
        break;
      case 'intermediate':
        trackFeatureUsage('pipeline:view');
        // Navigate to pipeline
        break;
      case 'advanced':
        trackFeatureUsage('ai:suggestions');
        // Navigate to AI assistant
        break;
      case 'expert':
        trackFeatureUsage('workflows:custom');
        // Navigate to workflow builder
        break;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="px-3 py-1">
              {stage.charAt(0).toUpperCase() + stage.slice(1)} User
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              {Math.round(progressPercentage())}% Complete
            </Badge>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-1000 ease-out',
                'bg-gradient-to-r',
                config.gradientFrom,
                config.gradientTo
              )}
              style={{ width: `${progressPercentage()}%` }}
            />
          </div>
          
          <p className="text-sm text-slate-600">
            Your CRM journey progress
          </p>
        </div>
        
        {/* Main welcome card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            {/* Icon */}
            <div className={cn(
              'mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center',
              'bg-gradient-to-br',
              config.gradientFrom,
              config.gradientTo
            )}>
              <IconComponent className="w-10 h-10 text-white" />
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {config.title}
            </h1>
            
            {/* Subtitle */}
            <h2 className="text-xl text-slate-600 mb-6">
              {config.subtitle}
            </h2>
            
            {/* Description */}
            <p className="text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
              {config.description}
            </p>
            
            {/* Primary action button */}
            <Button 
              onClick={handlePrimaryAction}
              size="lg"
              className={cn(
                'px-8 py-6 text-lg font-semibold rounded-xl shadow-lg',
                'bg-gradient-to-r hover:shadow-xl transition-all duration-200',
                'transform hover:scale-105 active:scale-95',
                config.gradientFrom,
                config.gradientTo
              )}
            >
              {config.primaryAction}
            </Button>
            
            {/* Current hint */}
            {currentHint && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <span className="text-blue-500">💡</span>
                  {currentHint}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Stats summary for non-new users */}
        {stage !== 'new' && (
          <Card className="mt-6 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-center text-slate-700">
                Your Progress So Far
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.contactsAdded}
                  </div>
                  <div className="text-sm text-slate-600">Contacts</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.messagesSent}
                  </div>
                  <div className="text-sm text-slate-600">Messages</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.aiInteractions}
                  </div>
                  <div className="text-sm text-slate-600">AI Helps</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.pipelineActions}
                  </div>
                  <div className="text-sm text-slate-600">Pipeline Actions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          Your CRM grows with you. Each action unlocks new features.
        </div>
      </div>
    </div>
  );
}

export default BlankDashboard;