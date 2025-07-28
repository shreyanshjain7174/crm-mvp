'use client';

import { useState } from 'react';
import { ModernNavigation } from '@/components/layout/modern-navigation';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/contexts/auth-context';
import { DebugPanel } from '@/components/debug/DebugPanel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
        <ModernNavigation 
          isCollapsed={isNavCollapsed}
          onCollapsedChange={setIsNavCollapsed}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      {/* Debug Panel - only visible in development or with debug flag */}
      <DebugPanel />
    </ProtectedRoute>
  );
}