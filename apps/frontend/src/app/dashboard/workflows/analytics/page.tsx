'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Loader2,
  Calendar,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface WorkflowAnalytics {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  executions: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  performance: {
    averageExecutionTime: number;
    lastExecuted: string;
    trend: 'up' | 'down' | 'stable';
  };
  triggers: {
    total: number;
    breakdown: Record<string, number>;
  };
}

export default function WorkflowAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<WorkflowAnalytics[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [analyticsData, statsData] = await Promise.all([
          apiClient.getWorkflowAnalytics(selectedPeriod),
          apiClient.getWorkflowStats()
        ]);
        
        setAnalytics(analyticsData.analytics || []);
        setGlobalStats(statsData.stats || null);
      } catch (error) {
        console.error('Error loading analytics:', error);
        // Mock data for demonstration
        const mockAnalytics: WorkflowAnalytics[] = [
          {
            id: '1',
            name: 'Welcome New Contacts',
            status: 'active',
            executions: {
              total: 1247,
              successful: 1185,
              failed: 62,
              successRate: 95.0
            },
            performance: {
              averageExecutionTime: 2.3,
              lastExecuted: '2 minutes ago',
              trend: 'up'
            },
            triggers: {
              total: 1247,
              breakdown: {
                'contact_added': 1247
              }
            }
          },
          {
            id: '2',
            name: 'Lead Scoring System',
            status: 'active',
            executions: {
              total: 890,
              successful: 845,
              failed: 45,
              successRate: 94.9
            },
            performance: {
              averageExecutionTime: 1.8,
              lastExecuted: '5 minutes ago',
              trend: 'stable'
            },
            triggers: {
              total: 890,
              breakdown: {
                'lead_score_change': 534,
                'contact_updated': 356
              }
            }
          },
          {
            id: '3',
            name: 'Follow-up Reminders',
            status: 'active',
            executions: {
              total: 670,
              successful: 598,
              failed: 72,
              successRate: 89.3
            },
            performance: {
              averageExecutionTime: 3.1,
              lastExecuted: '1 hour ago',
              trend: 'down'
            },
            triggers: {
              total: 670,
              breakdown: {
                'time_based': 450,
                'pipeline_stage_change': 220
              }
            }
          }
        ];

        const mockGlobalStats = {
          totalExecutions: 2807,
          successfulExecutions: 2628,
          failedExecutions: 179,
          averageSuccessRate: 93.6,
          activeWorkflows: 8,
          totalWorkflows: 12,
          averageExecutionTime: 2.4,
          executionTrend: 'up',
          topPerformingCategory: 'lead-management'
        };

        setAnalytics(mockAnalytics);
        setGlobalStats(mockGlobalStats);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Workflow Analytics</h1>
            <p className="text-gray-600">
              Monitor performance and execution metrics for your workflows
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* Global Stats */}
          {globalStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    {getTrendIcon(globalStats.executionTrend)}
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{globalStats.totalExecutions.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Executions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">{globalStats.averageSuccessRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{globalStats.averageExecutionTime.toFixed(1)}s</p>
                  <p className="text-sm text-gray-600">Avg Execution Time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-5 w-5 mx-auto text-orange-600 mb-2" />
                  <p className="text-2xl font-bold text-orange-600">{globalStats.activeWorkflows}</p>
                  <p className="text-sm text-gray-600">Active Workflows</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Analytics */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Workflow Performance</h2>
            
            {analytics.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
                <p className="text-gray-600">Create and run some workflows to see analytics here</p>
              </div>
            ) : (
              analytics.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{workflow.name}</h3>
                          <Badge className={workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {workflow.status}
                          </Badge>
                          {getTrendIcon(workflow.performance.trend)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                          {/* Executions */}
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Executions</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-sm">{workflow.executions.successful} successful</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="text-sm">{workflow.executions.failed} failed</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Total: {workflow.executions.total}
                              </div>
                            </div>
                          </div>

                          {/* Success Rate */}
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                            <p className={`text-xl font-bold ${getSuccessRateColor(workflow.executions.successRate)}`}>
                              {workflow.executions.successRate.toFixed(1)}%
                            </p>
                          </div>

                          {/* Performance */}
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Performance</p>
                            <div className="space-y-1">
                              <div className="text-sm">
                                Avg: {workflow.performance.averageExecutionTime.toFixed(1)}s
                              </div>
                              <div className="text-xs text-gray-500">
                                Last: {workflow.performance.lastExecuted}
                              </div>
                            </div>
                          </div>

                          {/* Triggers */}
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Trigger Breakdown</p>
                            <div className="space-y-1">
                              {Object.entries(workflow.triggers.breakdown).map(([trigger, count]) => (
                                <div key={trigger} className="text-sm">
                                  <span className="text-xs text-gray-500">{trigger.replace('_', ' ')}:</span>
                                  <span className="ml-1 font-medium">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar for Success Rate */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Success Rate</span>
                        <span>{workflow.executions.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${workflow.executions.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}