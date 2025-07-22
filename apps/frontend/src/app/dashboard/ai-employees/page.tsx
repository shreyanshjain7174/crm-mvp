'use client';

import { useUserStage, useUserStats } from '@/stores/userProgress';
import { AIEmployeesDashboard } from '@/components/ai-employees/ai-employees-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, Bot, Zap, DollarSign, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AIEmployeesPage() {
  const stage = useUserStage();
  const stats = useUserStats();

  // Check if user has unlocked AI employees (Stage 5)
  const hasUnlockedAIEmployees = stage === 'expert';

  if (!hasUnlockedAIEmployees) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Employees</h1>
          <p className="text-gray-600">Create autonomous AI workers for your business</p>
        </div>

        {/* Locked State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <Bot className="w-16 h-16 text-gray-300" />
              <Lock className="w-6 h-6 text-gray-400 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              AI Employees Coming Soon!
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Master AI assistance first to unlock the ability to create autonomous AI employees that work independently.
            </p>

            {/* Requirements */}
            <div className="w-full max-w-md space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">AI Interactions</span>
                <span className="text-sm font-medium">
                  {stats.aiInteractions} / 25
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Complete AI Assistant Stage</span>
                <span className="text-sm font-medium">
                  {stage === 'advanced' ? '✓' : 'In Progress'}
                </span>
              </div>
            </div>

            <Link href="/dashboard">
              <Button>
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue Building Your CRM
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Preview of AI Employees Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <Bot className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-sm">Autonomous Workers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                AI employees work independently without constant supervision
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <Zap className="w-8 h-8 text-yellow-600 mb-2" />
              <CardTitle className="text-sm">24/7 Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Your AI workforce never sleeps, handling tasks around the clock
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <DollarSign className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-sm">Zero Ongoing Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Local AI means $0 per task, unlike expensive cloud APIs
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader className="pb-3">
              <Shield className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle className="text-sm">Private & Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                All AI processing happens locally for maximum data privacy
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User has unlocked AI employees - show both internal AI employees and external agents
  return (
    <div className="space-y-8">
      {/* Internal AI Employees */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your AI Employees</h2>
        <AIEmployeesDashboard />
      </div>
      
      {/* External AI Agents */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party AI Agents</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900">Enhanced Security Controls</div>
              <div className="text-sm text-blue-700 mt-1">
                Third-party agents include advanced permission management, security monitoring, 
                and audit trails to ensure your data stays safe.
              </div>
            </div>
          </div>
        </div>
        {/* Import and use the EnhancedAgentDashboard */}
        <div className="text-sm text-gray-600">
          Enhanced agent management with security controls is being loaded...
        </div>
      </div>
    </div>
  );
}