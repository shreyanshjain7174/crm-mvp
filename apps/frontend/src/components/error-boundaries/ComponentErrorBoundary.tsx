'use client';

import React from 'react';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  showMinimal?: boolean;
  onRetry?: () => void;
}

export function ComponentErrorBoundary({ 
  children, 
  componentName,
  showMinimal = false,
  onRetry
}: ComponentErrorBoundaryProps) {
  const [retryKey, setRetryKey] = React.useState(0);

  const handleRetry = () => {
    setRetryKey(prev => prev + 1);
    onRetry?.();
  };

  const fallback = showMinimal ? (
    <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">
          {componentName ? `${componentName} failed to load` : 'Component error'}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRetry}
          className="text-red-600 hover:text-red-700 h-auto p-1"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  ) : (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h4 className="font-medium text-red-900 mb-1">
          {componentName ? `${componentName} Error` : 'Component Error'}
        </h4>
        <p className="text-red-700 text-sm mb-3">
          This component encountered an error and couldn&apos;t render properly.
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <GlobalErrorBoundary 
      key={retryKey}
      level="component" 
      fallback={fallback}
      showDetails={false}
      onError={(error, errorInfo) => {
        console.error(`Component error in ${componentName || 'unknown component'}:`, error, errorInfo);
      }}
    >
      {children}
    </GlobalErrorBoundary>
  );
}

export default ComponentErrorBoundary;