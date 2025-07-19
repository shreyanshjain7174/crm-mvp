'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureTracker } from '@/hooks/useFeatureGate';

interface NewUserStageProps {
  onAddContact: () => void;
}

export function NewUserStage({ onAddContact }: NewUserStageProps) {
  const { trackFeatureUsage } = useFeatureTracker();
  const currentHint = useUserProgressStore(state => state.currentHint);
  
  const handleGetStarted = () => {
    trackFeatureUsage('contacts:create');
    onAddContact();
  };
  
  const steps = [
    {
      id: 1,
      title: 'Add Your First Contact',
      description: 'Start by adding someone important to your business',
      icon: UserPlus,
      status: 'current' as const,
      action: handleGetStarted
    },
    {
      id: 2,
      title: 'Send a WhatsApp Message',
      description: 'Engage with your contact directly from the CRM',
      icon: ArrowRight,
      status: 'upcoming' as const
    },
    {
      id: 3,
      title: 'Organize with Pipeline',
      description: 'Track your leads through different stages',
      icon: CheckCircle,
      status: 'upcoming' as const
    }
  ];
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Hero Section */}
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to Your CRM Journey! 🚀
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Your customer relationship management platform that grows with you. 
            Let&apos;s start with a single contact and unlock features as you go.
          </p>
        </div>
        
        <Button 
          onClick={handleGetStarted}
          size="lg"
          className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Your First Contact
        </Button>
        
        {currentHint && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
            <p className="text-sm text-blue-700">💡 {currentHint}</p>
          </div>
        )}
      </div>
      
      {/* Progress Steps */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            Your Journey Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isCompleted = false; // For now, steps are never completed in NewUserStage
              const isCurrent = step.status === 'current';
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    isCurrent 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${
                        isCurrent ? 'text-blue-900' : 'text-slate-700'
                      }`}>
                        {step.title}
                      </h3>
                      {isCurrent && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          Current Step
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isCurrent ? 'text-blue-700' : 'text-slate-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {isCurrent && step.action && (
                    <Button 
                      onClick={step.action}
                      className="ml-4 bg-blue-500 hover:bg-blue-600"
                    >
                      Start
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Feature Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            What You&apos;ll Unlock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-slate-200 rounded-lg">
              <div className="text-3xl mb-2">📱</div>
              <h4 className="font-semibold mb-2">WhatsApp Integration</h4>
              <p className="text-sm text-slate-600">
                Send messages directly from your CRM
              </p>
            </div>
            
            <div className="text-center p-4 border border-slate-200 rounded-lg">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold mb-2">Sales Pipeline</h4>
              <p className="text-sm text-slate-600">
                Track leads through your sales process
              </p>
            </div>
            
            <div className="text-center p-4 border border-slate-200 rounded-lg">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="font-semibold mb-2">AI Assistant</h4>
              <p className="text-sm text-slate-600">
                Get smart suggestions and automation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewUserStage;