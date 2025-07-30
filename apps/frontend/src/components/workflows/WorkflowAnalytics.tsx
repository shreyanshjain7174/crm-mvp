'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Timer,
  Target,
  DollarSign,
  Users,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  Brain,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowMetrics {
  executions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    averageDuration: number;
  };
  performance: {
    successRate: number;
    errorRate: number;
    averageExecutionTime: number;
    medianExecutionTime: number;
    p95ExecutionTime: number;
  };
  trends: Array<{
    date: string;
    executions: number;
    successes: number;
    failures: number;
    avgDuration: number;
  }>;
  workflowBreakdown: Array<{
    workflowId: string;
    workflowName: string;
    executions: number;
    successRate: number;
    avgDuration: number;
    lastRun: string;
  }>;
  nodePerformance: Array<{
    nodeType: string;
    executions: number;
    avgDuration: number;
    errorRate: number;
  }>;
  costAnalysis: {
    totalCost: number;
    costPerExecution: number;
    costByWorkflow: Array<{
      workflowName: string;
      cost: number;
      executions: number;
    }>;
  };
  engineComparison: {
    n8n: {
      executions: number;
      successRate: number;
      avgDuration: number;
    };
    langgraph: {
      executions: number;
      successRate: number;
      avgDuration: number;
    };
    hybrid: {
      executions: number;
      successRate: number;
      avgDuration: number;
    };
  };
}

interface WorkflowAnalyticsProps {
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: string) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const generateMockMetrics = (timeRange: string): WorkflowMetrics => {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const trends = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const executions = Math.floor(Math.random() * 200) + 100;
    const successes = Math.floor(executions * (0.85 + Math.random() * 0.1));
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      executions,
      successes,
      failures: executions - successes,
      avgDuration: Math.floor(Math.random() * 5000) + 2000
    };
  }).reverse();

  const totalExecutions = trends.reduce((sum, t) => sum + t.executions, 0);
  const totalSuccesses = trends.reduce((sum, t) => sum + t.successes, 0);
  const totalFailures = trends.reduce((sum, t) => sum + t.failures, 0);

  return {
    executions: {
      total: totalExecutions,
      successful: totalSuccesses,
      failed: totalFailures,
      pending: Math.floor(Math.random() * 20),
      averageDuration: 3542
    },
    performance: {
      successRate: (totalSuccesses / totalExecutions) * 100,
      errorRate: (totalFailures / totalExecutions) * 100,
      averageExecutionTime: 3542,
      medianExecutionTime: 3200,
      p95ExecutionTime: 7800
    },
    trends,
    workflowBreakdown: [
      {
        workflowId: 'lead-nurturing',
        workflowName: 'Lead Nurturing Sequence',
        executions: Math.floor(totalExecutions * 0.35),
        successRate: 92,
        avgDuration: 2800,
        lastRun: '2 hours ago'
      },
      {
        workflowId: 'customer-support',
        workflowName: 'AI Customer Support',
        executions: Math.floor(totalExecutions * 0.25),
        successRate: 88,
        avgDuration: 4200,
        lastRun: '15 minutes ago'
      },
      {
        workflowId: 'sales-pipeline',
        workflowName: 'Sales Pipeline Automation',
        executions: Math.floor(totalExecutions * 0.20),
        successRate: 95,
        avgDuration: 3100,
        lastRun: '1 hour ago'
      },
      {
        workflowId: 'data-sync',
        workflowName: 'Data Synchronization',
        executions: Math.floor(totalExecutions * 0.15),
        successRate: 91,
        avgDuration: 5600,
        lastRun: '30 minutes ago'
      },
      {
        workflowId: 'content-gen',
        workflowName: 'Content Generation',
        executions: Math.floor(totalExecutions * 0.05),
        successRate: 86,
        avgDuration: 8900,
        lastRun: '3 hours ago'
      }
    ],
    nodePerformance: [
      { nodeType: 'Trigger', executions: totalExecutions, avgDuration: 150, errorRate: 0.5 },
      { nodeType: 'AI Agent', executions: Math.floor(totalExecutions * 0.7), avgDuration: 2200, errorRate: 5.2 },
      { nodeType: 'API Call', executions: Math.floor(totalExecutions * 0.8), avgDuration: 800, errorRate: 3.1 },
      { nodeType: 'Data Transform', executions: Math.floor(totalExecutions * 0.6), avgDuration: 400, errorRate: 1.2 },
      { nodeType: 'Condition', executions: Math.floor(totalExecutions * 0.9), avgDuration: 50, errorRate: 0.1 },
      { nodeType: 'Human Approval', executions: Math.floor(totalExecutions * 0.2), avgDuration: 18000, errorRate: 2.5 }
    ],
    costAnalysis: {
      totalCost: totalExecutions * 0.0025,
      costPerExecution: 0.0025,
      costByWorkflow: [
        { workflowName: 'AI Customer Support', cost: totalExecutions * 0.25 * 0.004, executions: Math.floor(totalExecutions * 0.25) },
        { workflowName: 'Content Generation', cost: totalExecutions * 0.05 * 0.008, executions: Math.floor(totalExecutions * 0.05) },
        { workflowName: 'Lead Nurturing', cost: totalExecutions * 0.35 * 0.002, executions: Math.floor(totalExecutions * 0.35) },
        { workflowName: 'Sales Pipeline', cost: totalExecutions * 0.20 * 0.0015, executions: Math.floor(totalExecutions * 0.20) },
        { workflowName: 'Data Sync', cost: totalExecutions * 0.15 * 0.001, executions: Math.floor(totalExecutions * 0.15) }
      ]
    },
    engineComparison: {
      n8n: {
        executions: Math.floor(totalExecutions * 0.45),
        successRate: 94,
        avgDuration: 2100
      },
      langgraph: {
        executions: Math.floor(totalExecutions * 0.30),
        successRate: 86,
        avgDuration: 4800
      },
      hybrid: {
        executions: Math.floor(totalExecutions * 0.25),
        successRate: 90,
        avgDuration: 3500
      }
    }
  };
};

export function WorkflowAnalytics({ 
  timeRange = '7d',
  onTimeRangeChange 
}: WorkflowAnalyticsProps) {
  const [metrics, setMetrics] = useState<WorkflowMetrics>(() => generateMockMetrics(timeRange));
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'cost' | 'comparison'>('overview');

  useEffect(() => {
    setMetrics(generateMockMetrics(timeRange));
  }, [timeRange]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Workflow Analytics</h2>
          <p className="text-muted-foreground">
            Monitor performance, costs, and trends across all your workflows
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{metrics.executions.total.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
              <span className="text-muted-foreground ml-1">vs previous</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{metrics.performance.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+2.3%</span>
              <span className="text-muted-foreground ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{formatDuration(metrics.performance.averageExecutionTime)}</p>
              </div>
              <Timer className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">-18%</span>
              <span className="text-muted-foreground ml-1">faster</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{metrics.performance.errorRate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">-0.8%</span>
              <span className="text-muted-foreground ml-1">reduction</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.costAnalysis.totalCost)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-muted-foreground">{formatCurrency(metrics.costAnalysis.costPerExecution)}/run</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Engine Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Execution Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Execution Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="successes" 
                      stackId="1"
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Successful"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="failures" 
                      stackId="1"
                      stroke="#ff7c7c" 
                      fill="#ff7c7c" 
                      name="Failed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Workflow Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.workflowBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="executions"
                    >
                      {metrics.workflowBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Workflow</th>
                      <th className="text-right p-2">Executions</th>
                      <th className="text-right p-2">Success Rate</th>
                      <th className="text-right p-2">Avg Duration</th>
                      <th className="text-right p-2">Last Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.workflowBreakdown.map((workflow) => (
                      <tr key={workflow.workflowId} className="border-b">
                        <td className="p-2">{workflow.workflowName}</td>
                        <td className="text-right p-2">{workflow.executions.toLocaleString()}</td>
                        <td className="text-right p-2">
                          <span className={cn(
                            "inline-flex items-center",
                            workflow.successRate >= 90 ? "text-green-600" : 
                            workflow.successRate >= 80 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {workflow.successRate}%
                          </span>
                        </td>
                        <td className="text-right p-2">{formatDuration(workflow.avgDuration)}</td>
                        <td className="text-right p-2 text-muted-foreground">{workflow.lastRun}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Node Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Node Type Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.nodePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nodeType" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="avgDuration" fill="#8884d8" name="Avg Duration (ms)" />
                    <Bar yAxisId="right" dataKey="errorRate" fill="#ff7c7c" name="Error Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Duration Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Execution Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Average</span>
                      <span className="text-sm font-medium">{formatDuration(metrics.performance.averageExecutionTime)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Median</span>
                      <span className="text-sm font-medium">{formatDuration(metrics.performance.medianExecutionTime)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">95th Percentile</span>
                      <span className="text-sm font-medium">{formatDuration(metrics.performance.p95ExecutionTime)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Performance Insights</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Human approval nodes significantly impact avg duration</li>
                    <li>• AI agent nodes have highest error rate (5.2%)</li>
                    <li>• 90% of executions complete under 7.8 seconds</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Duration Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Duration Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgDuration" 
                    stroke="#8884d8" 
                    name="Avg Duration (ms)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="cost" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cost by Workflow */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.costAnalysis.costByWorkflow} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="workflowName" type="category" width={120} />
                    <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
                    <Bar dataKey="cost" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Total Cost</span>
                      <span className="text-2xl font-bold">{formatCurrency(metrics.costAnalysis.totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average per execution</span>
                      <span className="text-sm font-medium">{formatCurrency(metrics.costAnalysis.costPerExecution)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Cost Factors</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>AI/LLM API Calls</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>External API Calls</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Compute Resources</span>
                        <span className="font-medium">10%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Storage & Logs</span>
                        <span className="font-medium">5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Cost Optimization Tips</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Batch AI requests to reduce API calls</li>
                      <li>• Cache frequently used AI responses</li>
                      <li>• Use conditional logic to skip unnecessary steps</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Trends & Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.trends.map(t => ({
                  ...t,
                  cost: t.executions * metrics.costAnalysis.costPerExecution,
                  projected: t.executions * metrics.costAnalysis.costPerExecution * 1.1
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#8884d8" 
                    name="Actual Cost"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projected" 
                    stroke="#82ca9d" 
                    name="Projected"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engine Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* n8n Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Workflow className="w-5 h-5 mr-2 text-blue-500" />
                  n8n Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Executions</p>
                  <p className="text-xl font-bold">{metrics.engineComparison.n8n.executions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold text-green-600">{metrics.engineComparison.n8n.successRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-xl font-bold">{formatDuration(metrics.engineComparison.n8n.avgDuration)}</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Best for: Business workflows, integrations</p>
                </div>
              </CardContent>
            </Card>

            {/* LangGraph Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-500" />
                  LangGraph Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Executions</p>
                  <p className="text-xl font-bold">{metrics.engineComparison.langgraph.executions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold text-yellow-600">{metrics.engineComparison.langgraph.successRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-xl font-bold">{formatDuration(metrics.engineComparison.langgraph.avgDuration)}</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Best for: AI workflows, complex logic</p>
                </div>
              </CardContent>
            </Card>

            {/* Hybrid Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-orange-500" />
                  Hybrid Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Executions</p>
                  <p className="text-xl font-bold">{metrics.engineComparison.hybrid.executions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold text-blue-600">{metrics.engineComparison.hybrid.successRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-xl font-bold">{formatDuration(metrics.engineComparison.hybrid.avgDuration)}</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Best for: Mixed AI + business logic</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engine Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Engine Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { metric: 'Success Rate', n8n: 94, langgraph: 86, hybrid: 90 },
                  { metric: 'Speed', n8n: 85, langgraph: 60, hybrid: 75 },
                  { metric: 'Cost Efficiency', n8n: 90, langgraph: 70, hybrid: 80 },
                  { metric: 'Complexity Handling', n8n: 60, langgraph: 95, hybrid: 85 },
                  { metric: 'Integration Support', n8n: 95, langgraph: 70, hybrid: 90 },
                  { metric: 'AI Capabilities', n8n: 40, langgraph: 95, hybrid: 80 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="n8n" dataKey="n8n" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Radar name="LangGraph" dataKey="langgraph" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  <Radar name="Hybrid" dataKey="hybrid" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Engine Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Use n8n When:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Integrating with external services</li>
                    <li>• Building simple automation flows</li>
                    <li>• Need fastest execution times</li>
                    <li>• Cost optimization is priority</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Use LangGraph When:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Complex AI reasoning required</li>
                    <li>• Multi-agent workflows</li>
                    <li>• Natural language processing</li>
                    <li>• Adaptive decision making</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Use Hybrid When:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Combining AI with integrations</li>
                    <li>• Need both speed and intelligence</li>
                    <li>• Complex business logic + AI</li>
                    <li>• Flexibility is important</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}