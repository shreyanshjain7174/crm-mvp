'use client';

import { ProgressiveNavigation } from '@/components/layout/ProgressiveNavigation';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/contexts/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <ProgressiveNavigation />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}