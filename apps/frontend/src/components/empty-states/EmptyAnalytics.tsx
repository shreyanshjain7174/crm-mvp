'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Lock, Target, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmptyAnalyticsProps {
  onStartAnalytics?: () => void;
  onUseAI?: () => void;
  aiInteractions?: number;
  requiredInteractions?: number;
  isLocked?: boolean;
}

export function EmptyAnalytics({ 
  onStartAnalytics,
  onUseAI,
  aiInteractions = 0,
  requiredInteractions = 25,
  isLocked = false
}: EmptyAnalyticsProps) {
  const progress = Math.min((aiInteractions / requiredInteractions) * 100, 100);
  const remaining = Math.max(requiredInteractions - aiInteractions, 0);

  if (isLocked) {
    return (
      <Card className="border-2 border-dashed border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-yellow-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Advanced Analytics Loading... 🚀
          </h3>
          
          <p className="text-gray-600 text-center max-w-md mb-6">
            Use AI assistance {remaining} more times to unlock advanced analytics, monitoring, and custom workflows.
          </p>
          
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">AI interactions</span>
              <span className="text-sm text-gray-500">{aiInteractions}/{requiredInteractions}</span>
            </div>
            <div className="w-full bg-white rounded-full h-3 border">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <Button 
            onClick={onUseAI}
            className="bg-yellow-600 hover:bg-yellow-700 mb-4"
          >
            <Brain className="h-4 w-4 mr-2" />
            Use AI Assistant
          </Button>
          
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            {remaining} AI interactions to unlock
          </Badge>
          
          <div className="mt-8 p-4 bg-white/50 rounded-lg max-w-md border border-yellow-100">
            <h4 className="font-semibold text-yellow-900 mb-2 text-sm">📊 Advanced Features:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Detailed conversion funnels</li>
              <li>• Customer behavior patterns</li>
              <li>• Performance forecasting</li>
              <li>• Custom dashboard widgets</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-100 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="h-10 w-10 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No analytics data yet
        </h3>
        
        <p className="text-gray-500 text-center max-w-md mb-8">
          Start using your CRM features to generate analytics data. Track performance, measure success, and optimize your customer relationships.
        </p>
        
        <div className="flex gap-3 mb-8">
          <Button 
            onClick={onStartAnalytics}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onUseAI}
          >
            <Brain className="h-4 w-4 mr-2" />
            Use AI Features
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 mb-1 text-sm">Contact Growth</h4>
            <p className="text-xs text-blue-700">
              Track new leads and contacts
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-green-900 mb-1 text-sm">Message Stats</h4>
            <p className="text-xs text-green-700">
              Response rates and engagement
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-purple-900 mb-1 text-sm">Conversions</h4>
            <p className="text-xs text-purple-700">
              Pipeline progression rates
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="font-semibold text-orange-900 mb-1 text-sm">AI Performance</h4>
            <p className="text-xs text-orange-700">
              Automation effectiveness
            </p>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg max-w-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-blue-900 text-sm">Getting Started</h4>
          </div>
          <p className="text-xs text-blue-700">
            Analytics become more powerful as you add contacts, send messages, and use AI features. The data will automatically populate as you use the system.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmptyAnalytics;