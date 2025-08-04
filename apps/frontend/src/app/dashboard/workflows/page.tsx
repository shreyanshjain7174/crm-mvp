'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  GitBranch,
  Layout,
  BarChart,
  Workflow,
  Plus,
  Zap,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkflowsMainPage() {
  const router = useRouter();

  const workflowFeatures = [
    {
      id: 'builder',
      title: 'Visual Builder',
      description: 'Create workflows with drag-and-drop components',
      icon: GitBranch,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      route: '/dashboard/workflows/builder',
      stats: 'Build visually'
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Start from pre-built workflow templates',
      icon: Layout,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      route: '/dashboard/workflows/templates',
      stats: '20+ templates'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Monitor workflow performance and metrics',
      icon: BarChart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      route: '/dashboard/workflows/analytics',
      stats: 'Performance insights'
    },
    {
      id: 'manage',
      title: 'Manage Workflows',
      description: 'View, edit, and control all your workflows',
      icon: Workflow,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      route: '/dashboard/workflows/manage',
      stats: 'Full control'
    }
  ];

  const quickStats = [
    { label: 'Active Workflows', value: '8', icon: Zap, color: 'text-blue-600' },
    { label: 'Time Saved', value: '24h', icon: Clock, color: 'text-green-600' },
    { label: 'Executions', value: '1.2k', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Success Rate', value: '94%', icon: Users, color: 'text-orange-600' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/automation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Automation
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Workflows</h1>
            <p className="text-gray-600">
              Build, manage, and monitor your automation workflows
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => router.push('/dashboard/workflows/builder')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-6 w-6 mx-auto ${stat.color} mb-2`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflowFeatures.map((feature) => (
          <Card 
            key={feature.id} 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${feature.borderColor} border-2`}
            onClick={() => router.push(feature.route)}
          >
            <CardHeader className="pb-4">
              <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{feature.stats}</span>
                <Button size="sm" variant="outline">
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">Getting Started with Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">Choose a Template</h4>
              <p className="text-sm text-gray-600">Start with a pre-built template or create from scratch</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">Build Your Workflow</h4>
              <p className="text-sm text-gray-600">Use the visual builder to create your automation logic</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">Monitor & Optimize</h4>
              <p className="text-sm text-gray-600">Track performance and improve your workflows over time</p>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => router.push('/dashboard/workflows/templates')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Layout className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}