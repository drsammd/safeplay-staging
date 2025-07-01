
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentSetup from '@/components/subscription/payment-setup';
import DiscountCodeInput from '@/components/discount/discount-code-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function CheckoutContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);

  const planId = searchParams.get('plan');
  const interval = searchParams.get('interval');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    if (!planId || !interval) {
      router.push('/parent/subscription');
      return;
    }

    fetchPlanData();
  }, [session, status, router, planId, interval]);

  const fetchPlanData = async () => {
    try {
      // FIXED: Fetch real plan data from API instead of using mock data
      const response = await fetch('/api/stripe/plans');
      const data = await response.json();
      const realPlan = data.plans?.find((p: any) => p.id === planId);
      
      if (!realPlan) {
        console.error('Plan not found:', planId);
        router.push('/parent/subscription');
        return;
      }
      
      setPlan(realPlan);
    } catch (error) {
      console.error('Error fetching plan data:', error);
      router.push('/parent/subscription');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  // Calculate amount based on interval
  let originalAmount = 0;
  if (interval === 'lifetime' && plan.lifetimePrice) {
    originalAmount = plan.lifetimePrice;
  } else if (interval === 'yearly' && plan.yearlyPrice) {
    originalAmount = plan.yearlyPrice;
  } else {
    originalAmount = plan.price;
  }

  // Calculate final amount with discount
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const finalAmount = originalAmount - discountAmount;

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
        <p className="text-gray-600">
          You're one step away from keeping your family safe
        </p>
      </div>

      <div className="space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {interval === 'lifetime' ? 'One-time payment' : 
                   interval === 'yearly' ? 'Annual billing' : 'Monthly billing'}
                </p>
              </div>
              <Badge variant="secondary">${originalAmount.toFixed(2)}</Badge>
            </div>
            
            {appliedDiscount && (
              <>
                <Separator />
                <div className="flex justify-between items-center text-green-600">
                  <div>
                    <p className="font-medium">Discount Applied</p>
                    <p className="text-sm">{appliedDiscount.name}</p>
                  </div>
                  <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>${finalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Discount Code Input */}
        <DiscountCodeInput
          planType={planId?.toUpperCase() as any}
          purchaseAmount={originalAmount}
          onDiscountApplied={setAppliedDiscount}
          onDiscountRemoved={() => setAppliedDiscount(null)}
          appliedDiscount={appliedDiscount}
        />

        {/* Payment Setup */}
        <PaymentSetup
          planId={planId || ''}
          stripePriceId={
            interval === 'monthly' ? plan.stripePriceId :
            interval === 'yearly' ? plan.stripeYearlyPriceId :
            interval === 'lifetime' ? plan.stripeLifetimePriceId :
            plan.stripePriceId // fallback to monthly
          } // FIXED: Pass the actual Stripe price ID based on billing interval
          billingInterval={interval as 'monthly' | 'yearly' | 'lifetime'}
          planName={plan.name}
          amount={finalAmount}
          originalAmount={originalAmount}
          discountCodeId={appliedDiscount?.id}
          onSuccess={() => {
            window.location.href = '/parent/subscription?success=true';
          }}
          onError={(error) => {
            console.error('Payment error:', error);
          }}
        />

        {/* Security Notice */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Secure Payment</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600">
              Your payment information is processed securely by Stripe. 
              We never store your payment details on our servers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 text-center">
        <p>Loading...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
