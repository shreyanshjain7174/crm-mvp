'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, TrendingUp, Target, Loader2 } from 'lucide-react';
import { themeText, statusColors, cn } from '@/utils/theme-colors';

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
          // If API is not available, show empty/zero stats for new users
          console.warn('Dashboard stats API not available, showing empty stats');
          setData({
            totalLeads: 0,
            activeConversations: 0,
            conversionRate: 0,
            hotLeads: 0,
            growth: {
              leads: 0,
              conversations: 0,
              hotLeads: 0,
              conversionRate: 0
            }
          });
          return;
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
              <CardTitle className={cn("text-sm font-medium", themeText.secondary)}>
                <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-24"></div>
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
              <p className={cn("mb-2", statusColors.error.text)}>Failed to load dashboard statistics</p>
              <p className={cn("text-sm", themeText.muted)}>{error}</p>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="dashboard-stats">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("text-sm font-medium", themeText.secondary)}>
                {stat.title}
              </CardTitle>
              <Icon className={cn("h-4 w-4", themeText.muted)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", themeText.primary)}>{stat.value}</div>
              <p className={cn("text-xs mt-1", themeText.secondary)}>
                <span className={stat.changeType === 'positive' ? statusColors.success.text : statusColors.error.text}>
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