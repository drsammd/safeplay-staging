
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Mail, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Page Error:', error);
  }, [error]);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    };

    // In production, this would send to error reporting service
    console.log('Error Report:', errorReport);
    
    // For now, open email client
    const subject = encodeURIComponent('SafePlay Error Report');
    const body = encodeURIComponent(`
Error Details:
- Message: ${error.message}
- Time: ${new Date().toISOString()}
- Page: ${typeof window !== 'undefined' ? window.location.href : ''}
- Error ID: ${error.digest || 'N/A'}

Please provide any additional context about what you were doing when this error occurred.
    `);
    
    window.open(`mailto:support@safeplay.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6">
            <img 
              src="/logos/safeplay_combined_logo.png" 
              alt="SafePlay" 
              className="h-16 mx-auto"
            />
          </div>
          <div className="mb-4 mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            We encountered an unexpected error. Don't worry - your data is safe and our team has been notified.
          </p>
        </div>

        {/* Error Details */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error.message}
                {error.digest && (
                  <>
                    <br />
                    <strong>Error ID:</strong> {error.digest}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && error.stack && (
              <div className="mt-4">
                <details className="cursor-pointer">
                  <summary className="font-medium text-sm text-red-700 hover:text-red-800">
                    Technical Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-100 p-3 rounded overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recovery Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>What can you do?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={reset} 
                variant="default"
                className="h-12 justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              <Button 
                onClick={handleReload} 
                variant="outline"
                className="h-12 justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>

              <Button 
                asChild
                variant="outline"
                className="h-12 justify-start"
              >
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>

              <Button 
                onClick={handleReportError}
                variant="outline"
                className="h-12 justify-start"
              >
                <Bug className="h-4 w-4 mr-2" />
                Report Error
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card className="border-0 shadow-lg bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Need Immediate Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our support team is available 24/7 to help resolve any issues with SafePlay.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" asChild>
                  <a href="mailto:support@safeplay.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Error occurred at {new Date().toLocaleString()}
            {error.digest && ` • Error ID: ${error.digest}`}
          </p>
          <p className="mt-1">
            SafePlay v2.0 • All child safety systems remain operational
          </p>
        </div>
      </div>
    </div>
  );
}
