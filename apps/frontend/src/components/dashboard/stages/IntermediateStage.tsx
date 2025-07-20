'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Target, 
  TrendingUp,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { useRouter } from 'next/navigation';

interface IntermediateStageProps {
  onViewPipeline?: () => void;
  onManageContacts?: () => void;
}

export function IntermediateStage({ onViewPipeline, onManageContacts }: IntermediateStageProps) {
  const { stats, stage } = useUserProgressStore();
  const router = useRouter();
  
  const handleViewPipeline = () => {
    router.push('/dashboard/pipeline');
  };
  
  const handleManageContacts = () => {
    router.push('/dashboard/leads');
  };
  
  const handleSendMessages = () => {
    router.push('/dashboard/messages');
  };
  
  // Calculate progress towards next stage (Advanced - 5 messages + 10 pipeline actions)
  const messageProgress = Math.min((stats.messagesSent / 5) * 100, 100);
  const pipelineProgress = Math.min((stats.pipelineActions / 10) * 100, 100);
  const overallProgress = (messageProgress + pipelineProgress) / 2;
  
  const nextStageRequirements = [
    {
      title: 'Send Messages',
      current: stats.messagesSent,
      target: 50,
      progress: messageProgress,
      icon: MessageSquare,
      action: handleSendMessages,
      description: 'Send messages to build engagement'
    },
    {
      title: 'Pipeline Actions',
      current: stats.pipelineActions,
      target: 10,
      progress: pipelineProgress,
      icon: BarChart3,
      action: handleViewPipeline,
      description: 'Organize leads in your pipeline'
    }
  ];
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Building Your Network! 📈
              </h2>
              <Badge className="bg-purple-500 text-white">
                Intermediate
              </Badge>
            </div>
            <p className="text-slate-700">
              Great job! You have {stats.contactsAdded} contacts and the pipeline is now unlocked. 
              Keep engaging with your leads to unlock AI assistance.
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.contactsAdded}</p>
            <p className="text-sm text-gray-600">Total Contacts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.messagesSent}</p>
            <p className="text-sm text-gray-600">Messages Sent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.pipelineActions}</p>
            <p className="text-sm text-gray-600">Pipeline Actions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-600">{Math.round(overallProgress)}%</p>
            <p className="text-sm text-gray-600">Next Stage Progress</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleViewPipeline}
              className="flex items-center justify-between p-6 h-auto bg-purple-500 hover:bg-purple-600"
            >
              <div className="text-left">
                <div className="font-semibold">Manage Pipeline</div>
                <div className="text-sm opacity-90">Organize your {stats.contactsAdded} contacts</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleSendMessages}
              className="flex items-center justify-between p-6 h-auto bg-green-500 hover:bg-green-600"
            >
              <div className="text-left">
                <div className="font-semibold">Send Messages</div>
                <div className="text-sm opacity-90">WhatsApp integration ready</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleManageContacts}
              className="flex items-center justify-between p-6 h-auto bg-blue-500 hover:bg-blue-600"
            >
              <div className="text-left">
                <div className="font-semibold">View Contacts</div>
                <div className="text-sm opacity-90">Manage your leads</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Progress Towards AI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Unlock AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Assistant Coming Soon!</h3>
              <p className="text-gray-600">
                Complete the requirements below to unlock intelligent response suggestions and automation.
              </p>
            </div>
            
            <div className="space-y-4">
              {nextStageRequirements.map((req, index) => {
                const IconComponent = req.icon;
                const isCompleted = req.current >= req.target;
                
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{req.title}</h4>
                          <p className="text-sm text-gray-600">{req.description}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {req.current}/{req.target}
                        </div>
                        {isCompleted ? (
                          <Badge className="bg-green-100 text-green-800">Complete!</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={req.action}
                          >
                            {req.current === 0 ? 'Start' : 'Continue'}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Progress value={req.progress} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Feature Preview */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 What&apos;s Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Smart Response Suggestions</h4>
                <p className="text-sm text-gray-600">
                  Get AI-powered message suggestions based on context and conversation history.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Automated Lead Scoring</h4>
                <p className="text-sm text-gray-600">
                  Automatically prioritize leads based on engagement patterns and behaviors.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IntermediateStage;