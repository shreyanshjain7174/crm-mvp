'use client';

import React from 'react';
import { Bot, Sparkles, MessageSquare, Lock, Zap, Brain, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmptyAIProps {
  onStartAI?: () => void;
  onSendMessages?: () => void;
  onViewPipeline?: () => void;
  messageCount?: number;
  requiredMessages?: number;
  isLocked?: boolean;
}

export function EmptyAI({ 
  onStartAI,
  onSendMessages,
  onViewPipeline,
  messageCount = 0,
  requiredMessages = 50,
  isLocked = false
}: EmptyAIProps) {
  const progress = Math.min((messageCount / requiredMessages) * 100, 100);
  const remaining = Math.max(requiredMessages - messageCount, 0);

  if (isLocked) {
    return (
      <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-orange-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            AI Assistant Almost Ready! 🤖
          </h3>
          
          <p className="text-gray-600 text-center max-w-md mb-6">
            Send {remaining} more messages to unlock AI-powered response suggestions and automation.
          </p>
          
          <div className="w-full max-w-md mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Messages sent</span>
              <span className="text-sm text-gray-500">{messageCount}/{requiredMessages}</span>
            </div>
            <div className="w-full bg-white rounded-full h-3 border">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <Button 
            onClick={onSendMessages}
            className="bg-orange-600 hover:bg-orange-700 mb-4"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send More Messages
          </Button>
          
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            {remaining} messages to unlock
          </Badge>
          
          <div className="mt-8 p-4 bg-white/50 rounded-lg max-w-md border border-orange-100">
            <h4 className="font-semibold text-orange-900 mb-2 text-sm">🚀 AI Features Coming:</h4>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• Smart response suggestions</li>
              <li>• Automated follow-up scheduling</li>
              <li>• Lead scoring and insights</li>
              <li>• Conversation sentiment analysis</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-blue-100 rounded-full flex items-center justify-center mb-6">
          <Bot className="h-10 w-10 text-purple-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          AI Assistant Ready
        </h3>
        
        <p className="text-gray-500 text-center max-w-md mb-8">
          Your AI assistant is ready to help! Get smart suggestions for responses, automate follow-ups, and gain insights from your conversations.
        </p>
        
        <div className="flex gap-3 mb-8">
          <Button 
            onClick={onStartAI}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start AI Assistant
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onSendMessages}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-purple-900 mb-1 text-sm">Smart Responses</h4>
            <p className="text-xs text-purple-700">
              AI-generated contextual replies
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 mb-1 text-sm">Auto Follow-ups</h4>
            <p className="text-xs text-blue-700">
              Scheduled messages and reminders
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-green-900 mb-1 text-sm">Lead Insights</h4>
            <p className="text-xs text-green-700">
              Sentiment and engagement analysis
            </p>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg max-w-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h4 className="font-semibold text-purple-900 text-sm">Pro Tip</h4>
          </div>
          <p className="text-xs text-purple-700">
            The more you use the AI assistant, the better it gets at understanding your communication style and customer preferences.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmptyAI;