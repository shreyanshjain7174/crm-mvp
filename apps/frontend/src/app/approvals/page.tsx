'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApprovalCenter } from '@/components/dashboard/approval-center';
import { ApprovalNotifications } from '@/components/dashboard/approval-notifications';
import { ApprovalRules } from '@/components/dashboard/approval-rules';
import { useAuth } from '@/contexts/auth-context';

export default function ApprovalsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Human-in-the-Loop Approvals</h1>
        <p className="text-gray-600">Manage AI-generated content and action approvals with intelligent workflow controls</p>
      </div>

      <Tabs defaultValue="center" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="center">Approval Center</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="rules">Rules & Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="center" className="space-y-6">
          <ApprovalCenter />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApprovalNotifications />
            <div className="space-y-6">
              {/* Additional notification widgets can go here */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <ApprovalRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}