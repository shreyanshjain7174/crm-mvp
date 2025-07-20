'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Users, 
  MessageSquare, 
  Target, 
  TrendingUp,
  ChevronRight,
  Star,
  Zap,
  Clock,
  BarChart3,
  Settings,
  Sparkles,
  Brain,
  Workflow,
  Monitor,
  Bell,
  Cog,
  Lock
} from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { useRouter } from 'next/navigation';

interface ExpertStageProps {
  onConfigureWorkflows?: () => void;
  onViewAnalytics?: () => void;
  onSystemMonitoring?: () => void;
}

export function ExpertStage({ onConfigureWorkflows, onViewAnalytics, onSystemMonitoring }: ExpertStageProps) {
  const { stats, stage } = useUserProgressStore();
  const router = useRouter();
  
  const handleViewAnalytics = () => {
    router.push('/dashboard/analytics');
  };
  
  const handleViewWorkflows = () => {
    router.push('/dashboard/workflows');
  };
  
  const handleSystemMonitoring = () => {
    router.push('/dashboard/monitoring');
  };
  
  const handleViewAI = () => {
    router.push('/dashboard/ai-assistant');
  };
  
  const handleViewPipeline = () => {
    router.push('/dashboard/pipeline');
  };
  
  // Mock expert-level stats
  const expertStats = {
    totalAutomations: 12,
    workflowsCreated: 8,
    timesSaved: 24.5, // hours
    accuracyRate: 94.2,
    conversionImprovement: 18.3,
    responseTimeReduction: 67.4
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/30 to-transparent rounded-bl-full"></div>
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">
                CRM Master Achieved! 👑
              </h2>
              <Badge className="bg-yellow-500 text-white animate-pulse">
                Expert
              </Badge>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-slate-700 mb-2">
              Outstanding! You&apos;ve mastered all CRM features with {stats.contactsAdded} contacts, 
              {stats.aiInteractions} AI interactions, and {stats.templatesUsed} template uses.
            </p>
            <p className="text-slate-600 text-sm">
              You now have access to advanced automation, custom workflows, and enterprise-grade analytics.
            </p>
          </div>
        </div>
      </div>
      
      {/* Expert Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <Workflow className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{expertStats.totalAutomations}</p>
            <p className="text-sm text-blue-700">Active Automations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{expertStats.timesSaved}h</p>
            <p className="text-sm text-green-700">Time Saved This Month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">+{expertStats.conversionImprovement}%</p>
            <p className="text-sm text-purple-700">Conversion Improvement</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Expert Tools Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Expert Tools Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={handleViewAnalytics}
              className="flex items-center justify-between p-6 h-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <div className="text-left">
                <div className="font-semibold">Advanced Analytics</div>
                <div className="text-sm opacity-90">Deep insights & reports</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleViewWorkflows}
              className="flex items-center justify-between p-6 h-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <div className="text-left">
                <div className="font-semibold">Workflow Builder</div>
                <div className="text-sm opacity-90">Custom automations</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleSystemMonitoring}
              className="flex items-center justify-between p-6 h-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <div className="text-left">
                <div className="font-semibold">System Monitor</div>
                <div className="text-sm opacity-90">Performance tracking</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleViewAI}
              className="flex items-center justify-between p-6 h-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <div className="text-left">
                <div className="font-semibold">AI Control Center</div>
                <div className="text-sm opacity-90">Advanced AI settings</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleViewPipeline}
              className="flex items-center justify-between p-6 h-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              <div className="text-left">
                <div className="font-semibold">Smart Pipeline</div>
                <div className="text-sm opacity-90">AI-optimized views</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline"
              className="flex items-center justify-between p-6 h-auto border-2 border-dashed border-gray-300 hover:border-gray-400"
            >
              <div className="text-left">
                <div className="font-semibold text-gray-600">API Access</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
              <Lock className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Accuracy</span>
                  <span className="font-medium">{expertStats.accuracyRate}%</span>
                </div>
                <Progress value={expertStats.accuracyRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Response Time Reduction</span>
                  <span className="font-medium">{expertStats.responseTimeReduction}%</span>
                </div>
                <Progress value={expertStats.responseTimeReduction} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Automation Coverage</span>
                  <span className="font-medium">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">CRM Master</p>
                  <p className="text-xs text-gray-600">Reached expert level</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Workflow className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Automation Expert</p>
                  <p className="text-xs text-gray-600">Created 10+ workflows</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Efficiency Master</p>
                  <p className="text-xs text-gray-600">Saved 20+ hours</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Expert Features Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Enterprise Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Advanced Analytics</h4>
                <p className="text-sm text-gray-600">
                  Custom reports, revenue forecasting, ROI analysis, and predictive insights.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Workflow className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Custom Workflows</h4>
                <p className="text-sm text-gray-600">
                  Visual workflow builder with conditional logic and multi-step automations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Monitor className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">System Monitoring</h4>
                <p className="text-sm text-gray-600">
                  Real-time performance monitoring, uptime tracking, and system health.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Smart Notifications</h4>
                <p className="text-sm text-gray-600">
                  Intelligent alerts, escalation rules, and priority-based notifications.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Cog className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Advanced Integrations</h4>
                <p className="text-sm text-gray-600">
                  API access, webhook support, and third-party service integrations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Team Management</h4>
                <p className="text-sm text-gray-600">
                  Multi-user support, role-based permissions, and team collaboration tools.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExpertStage;