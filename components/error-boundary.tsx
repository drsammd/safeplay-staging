
'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  level?: 'global' | 'page' | 'component';
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Log to external service in production
    this.logErrorToService(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, this would send to an error tracking service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        level: this.props.level || 'component',
      };

      // For now, just log to console
      console.error('Error Report:', errorReport);

      // In production, send to error tracking service:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback: Fallback, maxRetries = 3, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (Fallback) {
        return <Fallback error={error} resetError={this.handleRetry} />;
      }

      // Default fallback UI based on error boundary level
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">
                {level === 'global' && 'Application Error'}
                {level === 'page' && 'Page Error'}
                {level === 'component' && 'Something went wrong'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {level === 'global' && 
                    'The application encountered an unexpected error. Our team has been notified.'}
                  {level === 'page' && 
                    'This page encountered an error. Please try refreshing or navigate to another page.'}
                  {level === 'component' && 
                    'A component failed to load properly. You can try again or refresh the page.'}
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && (
                <Alert>
                  <AlertDescription className="font-mono text-xs">
                    <strong>Error:</strong> {error.message}
                    <br />
                    <strong>Stack:</strong> {error.stack?.split('\n')[1]}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {retryCount < maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({maxRetries - retryCount} left)
                  </Button>
                )}

                {level === 'page' && (
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {level === 'global' && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Need help? Contact our support team:
                  </p>
                  <Button variant="link" size="sm" asChild>
                    <a href="mailto:support@mysafeplay.ai">
                      <Mail className="h-4 w-4 mr-2" />
                      support@mysafeplay.ai
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component wrapper for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: string) => {
    // In a real app, this would report to error tracking service
    console.error('Manual error report:', error, errorInfo);
    
    // Trigger error boundary by throwing
    throw error;
  }, []);
}

// Async error handler for promises
export async function handleAsyncError<T>(
  promise: Promise<T>,
  context?: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Log error with context
    console.error(`Async error${context ? ` in ${context}` : ''}:`, errorObj);
    
    return { data: null, error: errorObj };
  }
}
