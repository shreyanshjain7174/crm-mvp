'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, TrendingUp, Target, Loader2 } from 'lucide-react';

interface DashboardData {
  totalLeads: number;
  activeConversations: number;
  conversionRate: number;
  hotLeads: number;
  growth: {
    leads: number;
    conversations: number;
    hotLeads: number;
    conversionRate: number;
  };
}

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/stats/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        
        const stats = await response.json();
        setData(stats);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to load dashboard statistics</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatChange = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const stats = [
    {
      title: 'Total Leads',
      value: data.totalLeads.toLocaleString(),
      change: formatChange(data.growth.leads),
      changeType: data.growth.leads >= 0 ? 'positive' as const : 'negative' as const,
      icon: Users,
    },
    {
      title: 'Active Conversations',
      value: data.activeConversations.toLocaleString(),
      change: formatChange(data.growth.conversations),
      changeType: data.growth.conversations >= 0 ? 'positive' as const : 'negative' as const,
      icon: MessageSquare,
    },
    {
      title: 'Conversion Rate',
      value: `${data.conversionRate.toFixed(1)}%`,
      change: formatChange(data.growth.conversionRate),
      changeType: data.growth.conversionRate >= 0 ? 'positive' as const : 'negative' as const,
      icon: TrendingUp,
    },
    {
      title: 'Hot Leads',
      value: data.hotLeads.toLocaleString(),
      change: formatChange(data.growth.hotLeads),
      changeType: data.growth.hotLeads >= 0 ? 'positive' as const : 'negative' as const,
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