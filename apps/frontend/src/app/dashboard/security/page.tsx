'use client';

import { SecurityDashboard } from '@/components/agent-security/SecurityDashboard';
import { useUserStage } from '@/stores/userProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function SecurityPage() {
  const stage = useUserStage();

  // Security features unlock at expert level (when users have AI employees)
  const hasUnlockedSecurity = stage === 'expert';

  if (!hasUnlockedSecurity) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600">Monitor and manage agent security & permissions</p>
        </div>

        {/* Locked State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <Shield className="w-16 h-16 text-gray-300" />
              <Lock className="w-6 h-6 text-gray-400 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Security Center Coming Soon!
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Install AI agents first to unlock comprehensive security monitoring and permission management.
            </p>

            <Link href="/dashboard/ai-employees">
              <Button>
                <ArrowRight className="w-4 h-4 mr-2" />
                Explore AI Agents
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Preview Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="opacity-60">
            <CardContent className="p-4">
              <Shield className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Permission Management</h4>
              <p className="text-sm text-gray-600">
                Control exactly what data and actions your AI agents can access
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="p-4">
              <Lock className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Security Monitoring</h4>
              <p className="text-sm text-gray-600">
                Real-time alerts for security events and permission changes
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="p-4">
              <Shield className="w-8 h-8 text-green-600 mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Audit Trails</h4>
              <p className="text-sm text-gray-600">
                Complete audit logs of all agent activities and data access
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User has unlocked security features
  return <SecurityDashboard businessId="demo-business" />;
}