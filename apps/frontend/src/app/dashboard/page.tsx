'use client';

import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { LeadsPipeline } from '@/components/dashboard/leads-pipeline';
import { AIInsights } from '@/components/dashboard/ai-insights';
import { AIAgentStatus } from '@/components/dashboard/ai-agent-status';
import { AIActivityFeed } from '@/components/dashboard/ai-activity-feed';
import { PendingApprovals } from '@/components/dashboard/pending-approvals';
import { SystemMonitoring } from '@/components/dashboard/system-monitoring';
import { RealtimeNotifications } from '@/components/dashboard/realtime-notifications';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-gray-600">Overview of your AI-powered CRM performance</p>
        </div>
        <ConnectionStatus showDetails={true} />
      </div>
      
      <DashboardStats />
      
      <AIAgentStatus />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsPipeline />
        <AIInsights />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AIActivityFeed />
        <PendingApprovals />
        <RealtimeNotifications />
      </div>
      
      <SystemMonitoring />
      
      <RecentActivity />
    </div>
  );
}