'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, TrendingUp, Target } from 'lucide-react';

export function DashboardStats() {
  const stats = [
    {
      title: 'Total Leads',
      value: '2,847',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Active Conversations',
      value: '156',
      change: '+8%',
      changeType: 'positive' as const,
      icon: MessageSquare,
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Hot Leads',
      value: '89',
      change: '+15%',
      changeType: 'positive' as const,
      icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">
                <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                {' '}from last month
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}