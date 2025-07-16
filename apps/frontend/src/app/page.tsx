'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DEMO_MODE } from '@/lib/demo-mode';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      {DEMO_MODE && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 z-50">
          🎭 DEMO MODE ACTIVE - Loading CRM Dashboard
        </div>
      )}
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Agentic CRM...</p>
      </div>
    </div>
  );
}