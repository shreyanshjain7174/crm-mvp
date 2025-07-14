'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { MessageCircle, Phone, Mail, UserPlus, TrendingUp } from 'lucide-react';

export function RecentActivity() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use static timestamps to avoid hydration issues
  const baseTime = new Date('2025-07-12T18:20:00Z');
  const activities = [
    {
      id: 1,
      type: 'message',
      icon: MessageCircle,
      title: 'New WhatsApp message',
      description: 'Rajesh Kumar sent: "Hi, interested in your services"',
      time: new Date(baseTime.getTime() - 5 * 60 * 1000),
      status: 'unread',
    },
    {
      id: 2,
      type: 'lead',
      icon: UserPlus,
      title: 'New lead created',
      description: 'Priya Sharma from Mumbai added to pipeline',
      time: new Date(baseTime.getTime() - 15 * 60 * 1000),
      status: 'new',
    },
    {
      id: 3,
      type: 'status',
      icon: TrendingUp,
      title: 'Lead status updated',
      description: 'Amit Patel moved from WARM to HOT',
      time: new Date(baseTime.getTime() - 30 * 60 * 1000),
      status: 'updated',
    },
    {
      id: 4,
      type: 'call',
      icon: Phone,
      title: 'Call scheduled',
      description: 'Follow-up call with Neha Singh at 3:00 PM',
      time: new Date(baseTime.getTime() - 45 * 60 * 1000),
      status: 'scheduled',
    },
    {
      id: 5,
      type: 'message',
      icon: MessageCircle,
      title: 'AI suggestion approved',
      description: 'Response sent to Vikram about product demo',
      time: new Date(baseTime.getTime() - 60 * 60 * 1000),
      status: 'sent',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'message': return 'text-whatsapp';
      case 'lead': return 'text-green-600';
      case 'status': return 'text-blue-600';
      case 'call': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-full bg-gray-100 ${getIconColor(activity.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {mounted ? formatDate(activity.time) : '...'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 text-center">
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View all activity
          </button>
        </div>
      </CardContent>
    </Card>
  );
}