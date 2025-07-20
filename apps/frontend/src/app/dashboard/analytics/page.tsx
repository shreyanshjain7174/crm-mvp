'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageCircle, 
  Target, 
  DollarSign, 
  Calendar, 
  Clock,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Star
} from 'lucide-react';
import { useUserProgressStore, useCanAccessFeature } from '@/stores/userProgress';
import { EmptyAnalytics } from '@/components/empty-states/EmptyAnalytics';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const router = useRouter();
  const canAccessAnalytics = useCanAccessFeature()('analytics:full');
  const { stats } = useUserProgressStore();
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  const handleUseAI = () => {
    router.push('/dashboard/ai-assistant');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
  };

  // Show empty state if analytics is locked
  if (!canAccessAnalytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyAnalytics
          onStartAnalytics={() => console.log('Analytics unlocked')}
          onUseAI={handleUseAI}
          aiInteractions={stats.aiInteractions}
          requiredInteractions={25}
          isLocked={true}
        />
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
          <p className="text-gray-600">
            Deep insights into your CRM performance and business metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">₹2,45,680</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+18.3%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-gray-50 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Lead Conversion</p>
                <p className="text-2xl font-bold">24.8%</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+5.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-gray-50 text-blue-600">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Response Time</p>
                <p className="text-2xl font-bold">1.2h</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">-67.4%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-gray-50 text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Customer Satisfaction</p>
                <p className="text-2xl font-bold">4.8/5</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+0.3</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-gray-50 text-yellow-600">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { source: 'WhatsApp', count: 1250, percentage: 45, color: 'bg-green-500' },
                { source: 'Website', count: 890, percentage: 32, color: 'bg-blue-500' },
                { source: 'Referral', count: 456, percentage: 16, color: 'bg-purple-500' },
                { source: 'Social Media', count: 234, percentage: 7, color: 'bg-pink-500' },
              ].map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium">{item.source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'January', leads: 245, converted: 59, rate: 24.1 },
                { month: 'February', leads: 289, converted: 73, rate: 25.3 },
                { month: 'March', leads: 321, converted: 87, rate: 27.1 },
                { month: 'April', leads: 298, converted: 74, rate: 24.8 },
              ].map((item) => (
                <div key={item.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.month}</p>
                    <p className="text-sm text-gray-600">{item.leads} leads</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{item.converted} converted</p>
                    <p className="text-sm text-gray-600">{item.rate}% rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">Response Accuracy</h3>
              <p className="text-3xl font-bold text-primary mt-2">89.5%</p>
              <p className="text-sm text-gray-600 mt-1">+3.2% this month</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">Messages Generated</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">2,847</p>
              <p className="text-sm text-gray-600 mt-1">+12% this month</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900">Approval Rate</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">92.3%</p>
              <p className="text-sm text-gray-600 mt-1">+1.8% this month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Response Time Optimization</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Leads who receive responses within 5 minutes have 3x higher conversion rates.
                  Consider enabling auto-responses for common queries.
                </p>
                <Badge className="mt-2 bg-blue-100 text-blue-800">High Impact</Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Lead Scoring Accuracy</h4>
                <p className="text-sm text-green-700 mt-1">
                  AI-scored leads above 80% have a 45% conversion rate vs 12% for manual scoring.
                  Trust the AI recommendations more.
                </p>
                <Badge className="mt-2 bg-green-100 text-green-800">Proven</Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <MessageCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Follow-up Timing</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Leads from WhatsApp respond best to follow-ups between 10-11 AM and 4-5 PM.
                  Schedule your outreach accordingly.
                </p>
                <Badge className="mt-2 bg-yellow-100 text-yellow-800">Timing</Badge>
              </div>
            </div>
          </div>
        </CardContent>
          </div>
        </TabsContent>
        
        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pipeline Analytics</h3>
                <p className="text-gray-600">Detailed pipeline performance metrics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <LineChart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Dashboard</h3>
                <p className="text-gray-600">Advanced performance tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🤖</div>
                  <h3 className="text-xl font-semibold mb-2">AI Performance Dashboard</h3>
                  <p className="text-gray-600">
                    Comprehensive AI analytics and machine learning insights
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Zap className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">24.5h</p>
                      <p className="text-sm text-gray-600">Time Saved This Month</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Activity className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold text-blue-600">94.2%</p>
                      <p className="text-sm text-gray-600">AI Accuracy Rate</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold text-green-600">78%</p>
                      <p className="text-sm text-gray-600">Automation Coverage</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Monthly Sales Report', description: 'Comprehensive sales performance analysis', icon: BarChart3 },
                  { name: 'Lead Source Analysis', description: 'Track which sources generate the best leads', icon: Users },
                  { name: 'AI Performance Report', description: 'Detailed AI efficiency and accuracy metrics', icon: Activity },
                  { name: 'Revenue Forecast', description: 'Predictive revenue analysis and projections', icon: TrendingUp },
                  { name: 'Customer Journey Map', description: 'Visualize customer touchpoints and conversions', icon: Target },
                  { name: 'Team Performance', description: 'Individual and team productivity metrics', icon: Award }
                ].map((report, index) => {
                  const IconComponent = report.icon;
                  return (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{report.name}</h4>
                            <p className="text-xs text-gray-600 mb-3">{report.description}</p>
                            <Button size="sm" variant="outline" className="w-full">
                              Generate Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}