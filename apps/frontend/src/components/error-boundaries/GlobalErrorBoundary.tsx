'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'global' | 'page' | 'component';
  showDetails?: boolean;
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for certain types of errors after delay
    if (this.shouldAutoRetry(error) && this.state.retryCount < 3) {
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 2000 * Math.pow(2, this.state.retryCount)); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry for network errors, chunk loading errors, etc.
    const retryableErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'NetworkError',
      'fetch',
    ];
    
    return retryableErrors.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error reporting service
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
    };

    // Example: Send to error reporting service
    // errorReportingService.report(errorReport);
    
    // For development, log to console
    console.error('Error Report:', errorReport);
  }

  private getErrorSeverity(error: Error): 'critical' | 'high' | 'medium' | 'low' {
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'medium';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'high';
    }
    if (error.stack?.includes('React') || error.stack?.includes('Component')) {
      return 'critical';
    }
    return 'medium';
  }

  private getErrorCategory(error: Error): string {
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'Code Splitting';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Network';
    }
    if (error.stack?.includes('React')) {
      return 'React Component';
    }
    return 'Application';
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const subject = `Error Report: ${error?.message || 'Unknown error'}`;
    const body = `Error ID: ${errorId}\n\nError: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`;
    const mailtoUrl = `mailto:support@yourapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId, retryCount } = this.state;
      const { level = 'global', showDetails = true } = this.props;
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity(error!);
      const category = this.getErrorCategory(error!);

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              
              <CardTitle className="text-2xl text-gray-900 mb-2">
                {level === 'global' ? 'Application Error' : 'Something went wrong'}
              </CardTitle>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
                  {severity.toUpperCase()}
                </Badge>
                <Badge variant="outline">{category}</Badge>
                {retryCount > 0 && (
                  <Badge variant="outline">Retry {retryCount}/3</Badge>
                )}
              </div>
              
              <p className="text-gray-600">
                {level === 'global' 
                  ? "We're sorry, but something unexpected happened. Our team has been notified."
                  : "This section encountered an error. You can try refreshing or continue using other parts of the app."
                }
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details */}
              {showDetails && error && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Error Details</h4>
                    <Badge variant="outline" className="text-xs">
                      ID: {errorId.slice(-8)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Message:</span>
                      <span className="ml-2 text-gray-600">{error.message}</span>
                    </div>
                    
                    {error.name && (
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-600">{error.name}</span>
                      </div>
                    )}
                    
                    <div>
                      <span className="font-medium text-gray-700">Time:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button variant="outline" onClick={this.handleReload} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                
                {level === 'global' && (
                  <>
                    <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                      <Home className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                    
                    <Button variant="outline" onClick={this.handleReportBug} className="w-full">
                      <Bug className="w-4 h-4 mr-2" />
                      Report Issue
                    </Button>
                  </>
                )}
              </div>

              {/* Additional Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Need Help?</h4>
                    <p className="text-blue-800 text-sm">
                      If this error persists, please contact our support team with the error ID: 
                      <code className="bg-blue-100 px-1 py-0.5 rounded text-xs ml-1">
                        {errorId.slice(-8)}
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Development Details */}
              {process.env.NODE_ENV === 'development' && showDetails && (
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-900 mb-2">
                    Development Details
                  </summary>
                  
                  <div className="space-y-3 text-sm">
                    {error?.stack && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Stack Trace:</div>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {errorInfo?.componentStack && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Component Stack:</div>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;