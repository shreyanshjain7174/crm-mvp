'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Home, RefreshCw, AlertTriangle } from 'lucide-react';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  routeName?: string;
}

export function RouteErrorBoundary({ children, routeName }: RouteErrorBoundaryProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const fallback = (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          
          <CardTitle className="text-xl text-gray-900 mb-2">
            Page Error
          </CardTitle>
          
          <p className="text-gray-600">
            {routeName ? `The ${routeName} page` : 'This page'} encountered an error. 
            You can go back or return to the dashboard.
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <GlobalErrorBoundary 
      level="page" 
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error(`Route error in ${routeName || 'unknown route'}:`, error, errorInfo);
      }}
    >
      {children}
    </GlobalErrorBoundary>
  );
}

export default RouteErrorBoundary;