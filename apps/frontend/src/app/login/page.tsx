'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ModernLoginForm } from '@/components/auth/ModernLoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-800">Loading...</p>
        </div>
      </div>
    }>
      <ModernLoginForm />
    </Suspense>
  );
}