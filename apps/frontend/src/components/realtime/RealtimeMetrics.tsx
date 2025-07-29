'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Users, MessageSquare, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtimeMetrics } from '@/hooks/useWebSocket';

interface RealtimeMetricsProps {
  className?: string;
  layout?: 'grid' | 'horizontal';
  showLastUpdated?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  color?: string;
  isLive?: boolean;
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = 'text-blue-600',
  isLive = false
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {isLive && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <motion.p
                key={value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-foreground"
              >
                {value}
              </motion.p>
            </div>
          </div>
          
          {change !== undefined && (
            <div className="text-right">
              <div className={`flex items-center gap-1 text-sm ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(change)}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RealtimeMetrics({ 
  className = '', 
  layout = 'grid',
  showLastUpdated = true
}: RealtimeMetricsProps) {
  const { metrics, lastUpdated, isConnected } = useRealtimeMetrics();

  const defaultMetrics = {
    activeUsers: 0,
    totalMessages: 0,
    agentsRunning: 0,
    successRate: 0,
    responseTime: 0,
    conversions: 0,
  };

  const currentMetrics = metrics || defaultMetrics;

  const metricCards = [
    {
      title: 'Active Users',
      value: currentMetrics.activeUsers?.toLocaleString() || '0',
      change: currentMetrics.activeUsersChange,
      changeType: (currentMetrics.activeUsersChange > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Messages Today',
      value: currentMetrics.totalMessages?.toLocaleString() || '0',
      change: currentMetrics.messagesChange,
      changeType: (currentMetrics.messagesChange > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: MessageSquare,
      color: 'text-green-600',
    },
    {
      title: 'Agents Running',
      value: currentMetrics.agentsRunning || '0',
      change: currentMetrics.agentsChange,
      changeType: (currentMetrics.agentsChange > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: Zap,
      color: 'text-purple-600',
    },
    {
      title: 'Success Rate',
      value: `${currentMetrics.successRate || 0}%`,
      change: currentMetrics.successRateChange,
      changeType: (currentMetrics.successRateChange > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: Activity,
      color: 'text-orange-600',
    },
  ];

  if (!isConnected) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Real-time metrics unavailable
              </p>
              <p className="text-xs text-muted-foreground">
                Reconnecting to live data...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {showLastUpdated && lastUpdated && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Real-time Metrics</h3>
          <Badge variant="outline" className="text-xs">
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
        </div>
      )}
      
      <div className={
        layout === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
          : 'flex flex-col sm:flex-row gap-4'
      }>
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard
              {...metric}
              isLive={isConnected}
            />
          </motion.div>
        ))}
      </div>
      
      {isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <Badge variant="outline" className="text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Live data stream active
          </Badge>
        </motion.div>
      )}
    </div>
  );
}

export default RealtimeMetrics;