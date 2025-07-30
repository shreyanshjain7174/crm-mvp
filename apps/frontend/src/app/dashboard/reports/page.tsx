'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  Users,
  MessageSquare,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportMetrics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealSize: number;
  activePipelineValue: number;
  responseTime: number;
  messagesSent: number;
  callsMade: number;
  emailsSent: number;
}

interface ReportData {
  period: string;
  metrics: ReportMetrics;
  trends: {
    leads: number;
    conversion: number;
    revenue: number;
    activity: number;
  };
  topPerformers: Array<{
    name: string;
    metric: string;
    value: number;
    change: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: 'lead' | 'call' | 'email' | 'meeting';
    description: string;
    timestamp: string;
    status: 'success' | 'pending' | 'failed';
  }>;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Mock data - in production this would come from API
  useEffect(() => {
    const mockData: ReportData = {
      period: selectedPeriod,
      metrics: {
        totalLeads: 156,
        convertedLeads: 23,
        conversionRate: 14.7,
        totalRevenue: 125000,
        avgDealSize: 5434,
        activePipelineValue: 245000,
        responseTime: 2.3,
        messagesSent: 342,
        callsMade: 67,
        emailsSent: 89
      },
      trends: {
        leads: 12.5,
        conversion: -2.1,
        revenue: 18.3,
        activity: 7.8
      },
      topPerformers: [
        { name: 'Rajesh Kumar', metric: 'Conversion Rate', value: 23.5, change: 5.2 },
        { name: 'Priya Sharma', metric: 'Deals Closed', value: 8, change: 2 },
        { name: 'Amit Patel', metric: 'Revenue Generated', value: 45000, change: 12.3 }
      ],
      recentActivities: [
        {
          id: '1',
          type: 'lead',
          description: 'New lead: TechStart Solutions',
          timestamp: '2 hours ago',
          status: 'success'
        },
        {
          id: '2',
          type: 'call',
          description: 'Call completed with Innovative Corp',
          timestamp: '4 hours ago',
          status: 'success'
        },
        {
          id: '3',
          type: 'email',
          description: 'Follow-up email sent to Global Tech',
          timestamp: '6 hours ago',
          status: 'pending'
        }
      ]
    };
    
    setReportData(mockData);
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Mock export functionality
    console.log(`Exporting report as ${format.toUpperCase()}`);
    // In production, this would trigger a download
    alert(`Report export as ${format.toUpperCase()} would start here`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTrend = (value: number) => {
    return (
      <div className={cn(
        'flex items-center space-x-1',
        value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
      )}>
        {value > 0 ? (
          <TrendingUp className="w-4 h-4" />
        ) : value < 0 ? (
          <TrendingDown className="w-4 h-4" />
        ) : null}
        <span className="text-sm font-medium">
          {value > 0 ? '+' : ''}{value.toFixed(1)}%
        </span>
      </div>
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Users className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your CRM performance and business metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'sales', name: 'Sales Performance', icon: TrendingUp },
          { id: 'activity', name: 'Activity Reports', icon: MessageSquare },
          { id: 'pipeline', name: 'Pipeline Analysis', icon: Target }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              selectedReport === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-foreground">
                  {reportData.metrics.totalLeads.toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <Users className="w-8 h-8 text-blue-600" />
                {formatTrend(reportData.trends.leads)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {reportData.metrics.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="flex flex-col items-end">
                <Target className="w-8 h-8 text-green-600" />
                {formatTrend(reportData.trends.conversion)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(reportData.metrics.totalRevenue)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <DollarSign className="w-8 h-8 text-purple-600" />
                {formatTrend(reportData.trends.revenue)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(reportData.metrics.activePipelineValue)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <PieChart className="w-8 h-8 text-orange-600" />
                {formatTrend(reportData.trends.activity)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-blue-600 mb-3" />
            <p className="text-2xl font-bold text-foreground mb-1">
              {reportData.metrics.messagesSent.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Messages Sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Phone className="w-12 h-12 mx-auto text-green-600 mb-3" />
            <p className="text-2xl font-bold text-foreground mb-1">
              {reportData.metrics.callsMade.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Calls Made</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Mail className="w-12 h-12 mx-auto text-purple-600 mb-3" />
            <p className="text-2xl font-bold text-foreground mb-1">
              {reportData.metrics.emailsSent.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Emails Sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{performer.name}</p>
                    <p className="text-sm text-muted-foreground">{performer.metric}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {typeof performer.value === 'number' && performer.value > 1000 
                        ? formatCurrency(performer.value)
                        : `${performer.value}${performer.metric.includes('Rate') ? '%' : ''}`
                      }
                    </p>
                    {formatTrend(performer.change)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusIcon(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <LineChart className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Lead generation chart will be displayed here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Revenue breakdown chart will be displayed here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => handleExport('pdf')} className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')} className="justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              Export as Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')} className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              <strong>Note:</strong> Exported reports include all data from the selected time period. 
              PDF reports contain charts and visualizations, while Excel and CSV formats include raw data for further analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}