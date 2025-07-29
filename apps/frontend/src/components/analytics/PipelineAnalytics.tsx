'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Users,
  DollarSign,
  Target,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Maximize2,
  ChevronRight,
  Activity,
  Percent,
  Timer,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PipelineMetrics {
  totalValue: number;
  totalDeals: number;
  conversionRate: number;
  averageDealSize: number;
  averageCycleTime: number;
  velocityScore: number;
  stageMetrics: {
    stageId: string;
    stageName: string;
    totalValue: number;
    dealCount: number;
    conversionRate: number;
    averageTimeInStage: number;
    dropOffRate: number;
    color: string;
  }[];
  trends: {
    period: string;
    totalValue: number;
    dealCount: number;
    conversionRate: number;
  }[];
  forecasting: {
    projectedRevenue: number;
    projectedDeals: number;
    confidenceLevel: number;
    riskFactors: string[];
  };
  healthScore: {
    overall: number;
    factors: {
      name: string;
      score: number;
      trend: 'up' | 'down' | 'stable';
      impact: 'high' | 'medium' | 'low';
    }[];
  };
}

interface PipelineAnalyticsProps {
  metrics: PipelineMetrics;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
  className?: string;
}

// Mock data for demonstration
const MOCK_METRICS: PipelineMetrics = {
  totalValue: 1250000,
  totalDeals: 47,
  conversionRate: 34.2,
  averageDealSize: 26595,
  averageCycleTime: 23,
  velocityScore: 8.4,
  stageMetrics: [
    {
      stageId: 'new-leads',
      stageName: 'New Leads',
      totalValue: 450000,
      dealCount: 18,
      conversionRate: 67,
      averageTimeInStage: 3.2,
      dropOffRate: 33,
      color: 'bg-blue-500'
    },
    {
      stageId: 'contacted',
      stageName: 'Contacted',
      totalValue: 320000,
      dealCount: 12,
      conversionRate: 75,
      averageTimeInStage: 5.8,
      dropOffRate: 25,
      color: 'bg-purple-500'
    },
    {
      stageId: 'qualified',
      stageName: 'Qualified',
      totalValue: 270000,
      dealCount: 9,
      conversionRate: 78,
      averageTimeInStage: 8.4,
      dropOffRate: 22,
      color: 'bg-orange-500'
    },
    {
      stageId: 'proposal',
      stageName: 'Proposal',
      totalValue: 140000,
      dealCount: 5,
      conversionRate: 60,
      averageTimeInStage: 4.2,
      dropOffRate: 40,
      color: 'bg-pink-500'
    },
    {
      stageId: 'won',
      stageName: 'Won',
      totalValue: 70000,
      dealCount: 3,
      conversionRate: 100,
      averageTimeInStage: 0,
      dropOffRate: 0,
      color: 'bg-green-500'
    }
  ],
  trends: [
    { period: 'Week 1', totalValue: 180000, dealCount: 7, conversionRate: 28.5 },
    { period: 'Week 2', totalValue: 220000, dealCount: 8, conversionRate: 31.2 },
    { period: 'Week 3', totalValue: 340000, dealCount: 12, conversionRate: 35.8 },
    { period: 'Week 4', totalValue: 510000, dealCount: 20, conversionRate: 34.2 }
  ],
  forecasting: {
    projectedRevenue: 890000,
    projectedDeals: 32,
    confidenceLevel: 84,
    riskFactors: ['Economic uncertainty', 'Seasonal trends', 'Competition pressure']
  },
  healthScore: {
    overall: 82,
    factors: [
      { name: 'Conversion Rate', score: 85, trend: 'up', impact: 'high' },
      { name: 'Cycle Time', score: 78, trend: 'stable', impact: 'high' },
      { name: 'Deal Velocity', score: 88, trend: 'up', impact: 'medium' },
      { name: 'Stage Balance', score: 72, trend: 'down', impact: 'medium' },
      { name: 'Lead Quality', score: 91, trend: 'up', impact: 'high' }
    ]
  }
};

export function PipelineAnalytics({ 
  metrics = MOCK_METRICS, 
  timeRange = '30d', 
  onTimeRangeChange,
  className 
}: PipelineAnalyticsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      case 'stable': return <ArrowUpRight className="w-4 h-4 text-gray-500 rotate-90" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const renderOverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5% vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Deals</p>
              <p className="text-2xl font-bold">{metrics.totalDeals}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8 new this week</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{formatPercent(metrics.conversionRate)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+2.1% improvement</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Cycle Time</p>
              <p className="text-2xl font-bold">{metrics.averageCycleTime}d</p>
              <div className="flex items-center mt-1">
                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">-3 days faster</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Timer className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStageAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stage Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.stageMetrics.map((stage, index) => (
              <div key={stage.stageId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${stage.color}`} />
                    <div>
                      <h4 className="font-medium">{stage.stageName}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{stage.dealCount} deals</span>
                        <span>{formatCurrency(stage.totalValue)}</span>
                        <span>{stage.averageTimeInStage.toFixed(1)} days avg</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatPercent(stage.conversionRate)}
                    </div>
                    <div className="text-sm text-muted-foreground">conversion</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Conversion Rate</span>
                      <span>{formatPercent(stage.conversionRate)}</span>
                    </div>
                    <Progress value={stage.conversionRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Time in Stage</span>
                      <span className={stage.averageTimeInStage > 7 ? 'text-red-600' : 'text-green-600'}>
                        {stage.averageTimeInStage.toFixed(1)}d
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(stage.averageTimeInStage * 10, 100)} 
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Drop-off Rate</span>
                      <span className={stage.dropOffRate > 30 ? 'text-red-600' : 'text-green-600'}>
                        {formatPercent(stage.dropOffRate)}
                      </span>
                    </div>
                    <Progress 
                      value={stage.dropOffRate} 
                      className="h-2"
                    />
                  </div>
                </div>
                
                {index < metrics.stageMetrics.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bottleneck Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.stageMetrics
                .filter(s => s.averageTimeInStage > 7 || s.dropOffRate > 30)
                .map(stage => (
                  <div key={stage.stageId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-900">{stage.stageName}</p>
                        <p className="text-sm text-red-700">
                          {stage.averageTimeInStage > 7 && `Long cycle time: ${stage.averageTimeInStage.toFixed(1)}d`}
                          {stage.averageTimeInStage > 7 && stage.dropOffRate > 30 && ' • '}
                          {stage.dropOffRate > 30 && `High drop-off: ${formatPercent(stage.dropOffRate)}`}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Analyze
                    </Button>
                  </div>
                ))}
              
              {metrics.stageMetrics.filter(s => s.averageTimeInStage <= 7 && s.dropOffRate <= 30).length > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-900">Healthy Stages</p>
                      <p className="text-sm text-green-700">
                        {metrics.stageMetrics.filter(s => s.averageTimeInStage <= 7 && s.dropOffRate <= 30).length} stages performing well
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Velocity Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {metrics.velocityScore.toFixed(1)}/10
                </div>
                <p className="text-sm text-muted-foreground">Pipeline Velocity Score</p>
                <Progress value={metrics.velocityScore * 10} className="mt-3" />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Deal Volume</span>
                  <Badge variant="secondary">High</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Quality</span>
                  <Badge variant="secondary">Good</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cycle Efficiency</span>
                  <Badge variant="secondary">Excellent</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Stage Balance</span>
                  <Badge variant="destructive">Needs Attention</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderForecasting = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(metrics.forecasting.projectedRevenue)}
              </div>
              <p className="text-sm text-muted-foreground">Projected Revenue (Next 30 days)</p>
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">
                    {metrics.forecasting.confidenceLevel}% confidence
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {metrics.forecasting.projectedDeals}
                </div>
                <p className="text-sm text-blue-700">Expected Deals</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency(metrics.forecasting.projectedRevenue / metrics.forecasting.projectedDeals)}
                </div>
                <p className="text-sm text-purple-700">Avg Deal Size</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Confidence Breakdown:</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Historical Performance</span>
                  <span className="text-sm font-medium">High (90%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Current Pipeline Quality</span>
                  <span className="text-sm font-medium">Good (85%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Market Conditions</span>
                  <span className="text-sm font-medium">Moderate (75%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Risk Factors</h4>
              </div>
              <div className="space-y-2">
                {metrics.forecasting.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-sm text-yellow-800">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Mitigation Strategies</h4>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                  <p className="text-sm font-medium text-green-900">Focus on Stage 2 → 3 Conversion</p>
                  <p className="text-xs text-green-700">Improve qualification process to reduce drop-off</p>
                </div>
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-blue-900">Accelerate Proposal Stage</p>
                  <p className="text-xs text-blue-700">Streamline proposal process to reduce cycle time</p>
                </div>
                <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                  <p className="text-sm font-medium text-purple-900">Diversify Lead Sources</p>
                  <p className="text-xs text-purple-700">Reduce dependency on single acquisition channels</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHealthScore = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getHealthScoreColor(metrics.healthScore.overall).split(' ')[0]}`}>
                    {metrics.healthScore.overall}
                  </div>
                  <div className="text-sm text-muted-foreground">Health Score</div>
                </div>
              </div>
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${metrics.healthScore.overall * 2.51} 251`}
                  className={getHealthScoreColor(metrics.healthScore.overall).split(' ')[0]}
                />
              </svg>
            </div>
          </div>
          
          <div className="space-y-4">
            {metrics.healthScore.factors.map((factor) => (
              <div key={factor.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{factor.name}</span>
                    {getTrendIcon(factor.trend)}
                    <Badge variant={factor.impact === 'high' ? 'destructive' : factor.impact === 'medium' ? 'default' : 'secondary'}>
                      {factor.impact} impact
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{factor.score}/100</span>
                </div>
                <Progress value={factor.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Strengths</h3>
            <ul className="space-y-1 text-sm text-green-700">
              <li>• High conversion rates</li>
              <li>• Strong lead quality</li>
              <li>• Efficient closing process</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-yellow-900 mb-2">Areas to Watch</h3>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Stage balance issues</li>
              <li>• Proposal stage delays</li>
              <li>• Lead source concentration</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Optimize qualification</li>
              <li>• Accelerate proposals</li>
              <li>• Diversify lead sources</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pipeline Analytics</h2>
          <p className="text-muted-foreground">
            Deep insights into your sales pipeline performance and forecasting
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {renderOverviewMetrics()}

      {/* Detailed Analytics */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stages">Stage Analysis</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="health">Health Score</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverviewMetrics()}
        </TabsContent>

        <TabsContent value="stages" className="space-y-6">
          {renderStageAnalysis()}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          {renderForecasting()}
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {renderHealthScore()}
        </TabsContent>
      </Tabs>
    </div>
  );
}