
'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Server, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// Network/Connectivity Error Fallback
export function NetworkErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            {isOffline ? (
              <WifiOff className="h-6 w-6 text-orange-600" />
            ) : (
              <Wifi className="h-6 w-6 text-orange-600" />
            )}
          </div>
          <CardTitle>Connection Problem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isOffline 
                ? "You appear to be offline. Please check your internet connection."
                : "Unable to connect to SafePlay services. Please check your connection and try again."
              }
            </AlertDescription>
          </Alert>
          
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// API Error Fallback
export function APIErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const is500Error = error.message.includes('500') || error.message.includes('Internal Server Error');
  const is404Error = error.message.includes('404') || error.message.includes('Not Found');
  
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Server className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>
            {is500Error && 'Server Error'}
            {is404Error && 'Not Found'}
            {!is500Error && !is404Error && 'API Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {is500Error && "Our servers are experiencing issues. Please try again in a moment."}
              {is404Error && "The requested resource could not be found."}
              {!is500Error && !is404Error && "An error occurred while communicating with our servers."}
            </AlertDescription>
          </Alert>
          
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// AWS Service Error Fallback
export function AWSErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isQuotaError = error.message.includes('quota') || error.message.includes('limit');
  const isCredentialsError = error.message.includes('credentials') || error.message.includes('access');
  
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <Server className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>Service Temporarily Unavailable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isQuotaError && "Service usage limit reached. Please try again later."}
              {isCredentialsError && "Service authentication issue. Please contact support."}
              {!isQuotaError && !isCredentialsError && "Facial recognition services are temporarily unavailable. Core features still work."}
            </AlertDescription>
          </Alert>
          
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Database Error Fallback
export function DatabaseErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Database className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle>Data Service Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to access data at the moment. Please try again or refresh the page.
            </AlertDescription>
          </Alert>
          
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Form Error Fallback
export function FormErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Form submission failed: {error.message}
        </AlertDescription>
      </Alert>
      
      <Button onClick={resetError} className="mt-4 w-full" variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reset Form
      </Button>
    </div>
  );
}

// Generic Loading Error Fallback
export function LoadingErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-8 text-center">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load content. {error.message}
        </AlertDescription>
      </Alert>
      
      <Button onClick={resetError} className="mt-4" variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}
