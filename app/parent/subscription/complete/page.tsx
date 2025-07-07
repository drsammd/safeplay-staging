
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SubscriptionCompletePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    processSubscriptionCompletion();
  }, [session, status, router, searchParams]);

  const processSubscriptionCompletion = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      const paymentIntentId = searchParams.get('payment_intent');
      
      if (!sessionId && !paymentIntentId) {
        setError('Missing payment information. Please try again.');
        setProcessing(false);
        return;
      }

      // Verify the payment and complete subscription
      const response = await fetch('/api/stripe/subscription/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          paymentIntentId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setSubscriptionDetails(data.subscription);
      } else {
        setError(data.error || 'Failed to complete subscription');
      }
    } catch (error) {
      console.error('Error completing subscription:', error);
      setError('An unexpected error occurred. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading' || processing) {
    return (
      <div className="container mx-auto py-16 text-center">
        <div className="max-w-md mx-auto">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing your subscription...</h2>
          <p className="text-gray-600">Please wait while we complete your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16">
      <div className="max-w-2xl mx-auto">
        {success ? (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                Subscription Activated!
              </CardTitle>
              <CardDescription>
                Welcome to SafePlay! Your subscription is now active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscriptionDetails && (
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h3 className="font-semibold mb-2">Subscription Details:</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Plan:</strong> {subscriptionDetails.planName}</p>
                    <p><strong>Status:</strong> {subscriptionDetails.status}</p>
                    <p><strong>Next Billing:</strong> {subscriptionDetails.nextBilling}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/parent')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/parent/subscription')}
                  className="w-full"
                >
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                Subscription Error
              </CardTitle>
              <CardDescription>
                There was an issue completing your subscription.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/parent/subscription')}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/contact')}
                  className="w-full"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
