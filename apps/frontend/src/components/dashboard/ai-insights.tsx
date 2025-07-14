'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, TrendingUp, MessageSquare, Target } from 'lucide-react';

export function AIInsights() {
  const insights = [
    {
      icon: MessageSquare,
      title: 'Response Suggestions',
      value: '147 pending',
      description: 'AI generated 89% approval rate',
      status: 'active',
    },
    {
      icon: TrendingUp,
      title: 'Lead Scoring',
      value: '23 high-priority',
      description: 'Updated based on recent activity',
      status: 'success',
    },
    {
      icon: Target,
      title: 'Follow-up Reminders',
      value: '12 overdue',
      description: 'Automated scheduling recommended',
      status: 'warning',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'active': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full bg-white ${getStatusColor(insight.status)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {insight.value}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">AI Performance</p>
              <p className="text-xs text-gray-600">85% accuracy this month</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">+12%</p>
              <p className="text-xs text-gray-600">vs last month</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}