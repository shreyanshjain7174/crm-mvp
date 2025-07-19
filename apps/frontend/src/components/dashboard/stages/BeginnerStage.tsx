'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureTracker } from '@/hooks/useFeatureGate';

interface BeginnerStageProps {
  onSendMessage?: () => void;
  onViewContacts?: () => void;
}

export function BeginnerStage({ onSendMessage, onViewContacts }: BeginnerStageProps) {
  const stats = useUserProgressStore(state => state.stats);
  const { trackFeatureUsage } = useFeatureTracker();
  
  const handleSendMessage = () => {
    trackFeatureUsage('messages:send');
    onSendMessage?.();
  };
  
  const handleViewContacts = () => {
    trackFeatureUsage('contacts:list');
    onViewContacts?.();
  };
  
  const completedSteps = [
    {
      title: 'First Contact Added',
      description: 'You successfully added your first contact!',
      icon: CheckCircle,
      completed: true
    }
  ];
  
  const nextSteps = [
    {
      title: 'Send Your First Message',
      description: 'Start a conversation via WhatsApp',
      icon: MessageSquare,
      action: handleSendMessage,
      completed: stats.messagesSent > 0
    },
    {
      title: 'Add More Contacts',
      description: 'Build your network (target: 10 contacts)',
      icon: Users,
      action: handleViewContacts,
      progress: Math.min((stats.contactsAdded / 10) * 100, 100)
    }
  ];
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Congratulations Header */}
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Great Start! 🎉
        </h1>
        <p className="text-lg text-slate-600">
          You&apos;ve added your first contact. Now let&apos;s start engaging with them!
        </p>
      </div>
      
      {/* Progress Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.contactsAdded}
              </div>
              <div className="text-sm text-slate-600">Contacts Added</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {stats.messagesSent}
              </div>
              <div className="text-sm text-slate-600">Messages Sent</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {Math.round((stats.contactsAdded / 10) * 100)}%
              </div>
              <div className="text-sm text-slate-600">To Next Stage</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Completed Steps */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Completed Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900">{step.title}</h4>
                    <p className="text-sm text-green-700">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Next Steps */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-500" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step, index) => {
              const IconComponent = step.icon;
              const isCompleted = step.completed;
              const hasProgress = 'progress' in step;
              
              return (
                <div
                  key={index}
                  className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    isCompleted
                      ? 'border-green-200 bg-green-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
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
                        isCompleted ? 'text-green-900' : 'text-blue-900'
                      }`}>
                        {step.title}
                      </h3>
                      {isCompleted && (
                        <Badge className="bg-green-500 text-white text-xs">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isCompleted ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {step.description}
                    </p>
                    
                    {hasProgress && !isCompleted && (
                      <div className="mt-2">
                        <div className="w-full bg-white rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${step.progress || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          {Math.round(step.progress || 0)}% complete
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {!isCompleted && step.action && (
                    <Button 
                      onClick={step.action}
                      className="ml-4 bg-blue-500 hover:bg-blue-600"
                    >
                      {hasProgress ? 'Continue' : 'Start'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* What's Coming Next */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            What&apos;s Coming Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="font-semibold text-slate-900 mb-2">Pipeline View</h3>
            <p className="text-sm text-slate-600 mb-4">
              Once you have 10 contacts, you&apos;ll unlock the pipeline view to organize and track your leads through different stages.
            </p>
            <div className="bg-white rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.contactsAdded / 10) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {10 - stats.contactsAdded > 0 
                ? `${10 - stats.contactsAdded} more contacts to unlock`
                : 'Ready to unlock!'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BeginnerStage;