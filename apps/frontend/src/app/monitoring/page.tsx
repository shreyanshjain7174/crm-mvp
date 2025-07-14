'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentExecutionHistory } from '@/components/dashboard/agent-execution-history';
import { AgentMetricsDashboard } from '@/components/dashboard/agent-metrics-dashboard';
import { SystemMonitoring } from '@/components/dashboard/system-monitoring';
import { useAuth } from '@/contexts/auth-context';

export default function MonitoringPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Monitoring & Analytics</h1>
        <p className="text-gray-600">Comprehensive monitoring of AI agents, system performance, and execution history</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="metrics">Agent Metrics</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <SystemMonitoring />
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <AgentMetricsDashboard />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <AgentExecutionHistory />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
}