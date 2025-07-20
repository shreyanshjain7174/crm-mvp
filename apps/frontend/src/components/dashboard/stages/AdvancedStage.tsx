'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  Target, 
  TrendingUp,
  ChevronRight,
  Star,
  Zap,
  Clock,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { useRouter } from 'next/navigation';

interface AdvancedStageProps {
  onConfigureAI?: () => void;
  onViewAnalytics?: () => void;
}

export function AdvancedStage({ onConfigureAI, onViewAnalytics }: AdvancedStageProps) {
  const { stats, stage } = useUserProgressStore();
  const router = useRouter();
  
  const handleViewAI = () => {
    router.push('/dashboard/ai-assistant');
  };
  
  const handleViewPipeline = () => {
    router.push('/dashboard/pipeline');
  };
  
  const handleSendMessages = () => {
    router.push('/dashboard/messages');
  };
  
  // Calculate progress towards Expert stage (25 AI interactions + 10 templates used)
  const aiProgress = Math.min((stats.aiInteractions / 25) * 100, 100);
  const templatesProgress = Math.min((stats.templatesUsed / 10) * 100, 100);
  const overallProgress = (aiProgress + templatesProgress) / 2;
  
  const nextStageRequirements = [
    {
      title: 'AI Interactions',
      current: stats.aiInteractions,
      target: 25,
      progress: aiProgress,
      icon: Bot,
      action: handleViewAI,
      description: 'Use AI suggestions and automation'
    },
    {
      title: 'Template Usage',
      current: stats.templatesUsed,
      target: 10,
      progress: templatesProgress,
      icon: MessageSquare,
      action: handleSendMessages,
      description: 'Use message templates for efficiency'
    }
  ];
  
  // Mock AI performance data
  const aiStats = {
    accuracy: 89.5,
    responseTime: 1.2,
    suggestionsSaved: 24,
    automationHours: 8.5
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">
                AI-Powered Professional! 🤖
              </h2>
              <Badge className="bg-orange-500 text-white">
                Advanced
              </Badge>
            </div>
            <p className="text-slate-700">
              Excellent! You&apos;re now using AI assistance to manage {stats.contactsAdded} contacts. 
              Continue using AI features to unlock the complete automation platform.
            </p>
          </div>
        </div>
      </div>
      
      {/* AI Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bot className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{aiStats.accuracy}%</p>
            <p className="text-sm text-gray-600">AI Accuracy</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{aiStats.responseTime}s</p>
            <p className="text-sm text-gray-600">Avg Response Time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.aiInteractions}</p>
            <p className="text-sm text-gray-600">AI Interactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-600">{aiStats.automationHours}h</p>
            <p className="text-sm text-gray-600">Time Saved</p>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Assistant Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI Assistant Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleViewAI}
              className="flex items-center justify-between p-6 h-auto bg-blue-500 hover:bg-blue-600"
            >
              <div className="text-left">
                <div className="font-semibold">View AI Suggestions</div>
                <div className="text-sm opacity-90">3 pending actions</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleViewPipeline}
              className="flex items-center justify-between p-6 h-auto bg-purple-500 hover:bg-purple-600"
            >
              <div className="text-left">
                <div className="font-semibold">Smart Pipeline</div>
                <div className="text-sm opacity-90">AI-optimized views</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleSendMessages}
              className="flex items-center justify-between p-6 h-auto bg-green-500 hover:bg-green-600"
            >
              <div className="text-left">
                <div className="font-semibold">AI Templates</div>
                <div className="text-sm opacity-90">Smart message suggestions</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* AI Learning Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Message Pattern Recognition</span>
                <span className="font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Lead Scoring Accuracy</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Response Quality</span>
                <span className="font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Progress Towards Expert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Unlock Expert Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🚀</div>
              <h3 className="text-xl font-semibold mb-2">CRM Master Status Loading...</h3>
              <p className="text-gray-600">
                Complete the requirements below to unlock advanced analytics, monitoring, and custom workflows.
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
      
      {/* Expert Features Preview */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Expert Features Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Advanced Analytics</h4>
                <p className="text-sm text-gray-600">
                  Deep insights into your sales performance, conversion rates, and customer behavior patterns.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Custom Workflows</h4>
                <p className="text-sm text-gray-600">
                  Create automated workflows and custom business rules tailored to your specific needs.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">System Monitoring</h4>
                <p className="text-sm text-gray-600">
                  Real-time monitoring of your CRM performance, AI accuracy, and system health metrics.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Advanced Automation</h4>
                <p className="text-sm text-gray-600">
                  Complex multi-step automations, conditional logic, and integration with external tools.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedStage;