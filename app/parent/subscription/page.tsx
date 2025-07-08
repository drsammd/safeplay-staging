
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SubscriptionPlans from '@/components/subscription/subscription-plans';
import BillingDashboard from '@/components/subscription/billing-dashboard';
import PaymentSetup from '@/components/subscription/payment-setup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planChangeLoading, setPlanChangeLoading] = useState(false);
  const [planChangeError, setPlanChangeError] = useState<string | null>(null);
  const [planChangeSuccess, setPlanChangeSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    planId: string;
    stripePriceId: string;
    interval: 'monthly' | 'yearly' | 'lifetime';
    planName: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    // Fetch user data
    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      console.log('🔍 Fetching real user subscription data...');
      
      // Fetch real user subscription data
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data fetched:', userData);
        
        setUser({
          id: userData.id,
          role: userData.role || 'PARENT',
          subscription: userData.subscription || null,
        });
      } else {
        console.log('❌ Failed to fetch user data, using fallback');
        // Fallback to basic user data if API call fails
        setUser({
          id: session?.user?.id,
          role: 'PARENT',
          subscription: null,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to basic user data on error
      setUser({
        id: session?.user?.id,
        role: 'PARENT',
        subscription: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (stripePriceId: string, interval: 'monthly' | 'yearly' | 'lifetime', planId: string) => {
    console.log('🚀 Starting plan selection process...', { 
      planId,
      stripePriceId,
      interval,
      hasActiveSubscription: hasActiveSubscription,
      sessionUserId: session?.user?.id,
      sessionUserEmail: session?.user?.email
    });

    // For new users without active subscription, show payment setup
    if (!hasActiveSubscription) {
      console.log('💳 New user detected - showing payment setup');
      
      // Fetch plan details for payment setup
      try {
        const response = await fetch('/api/stripe/plans-fixed');
        const data = await response.json();
        const plan = data.plans?.find((p: any) => p.id === planId);
        
        if (plan) {
          const amount = interval === 'lifetime' && plan.lifetimePrice ? plan.lifetimePrice :
                        interval === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : 
                        plan.price;
          
          setSelectedPlan({
            planId,
            stripePriceId, // FIXED: Include the actual Stripe price ID
            interval,
            planName: plan.name,
            amount: amount
          });
          setShowPaymentSetup(true);
        } else {
          setPlanChangeError('Selected plan not found. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching plan details:', error);
        setPlanChangeError('Failed to load plan details. Please try again.');
      }
      return;
    }

    // For existing subscribers, proceed with plan change
    console.log('🔄 Existing subscriber - proceeding with plan change');
    
    setPlanChangeLoading(true);
    setPlanChangeError(null);
    setPlanChangeSuccess(null);

    try {
      const requestBody = { planId };
      console.log('📡 Sending request to modify subscription...');
      console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/stripe/subscription/modify-fixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: stripePriceId }),
      });

      console.log('📥 Response received:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText
      });
      
      const responseText = await response.text();
      console.log('📄 Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📊 Parsed response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (response.ok) {
        setPlanChangeSuccess('Plan changed successfully! Your subscription has been updated.');
        console.log('✅ Plan change successful');
        
        // Refresh user data to get updated subscription info
        await fetchUserData();
        
        // Auto-close the Change Plan window after 2 seconds
        setTimeout(() => {
          console.log('🔄 Auto-closing Change Plan window - switching to dashboard tab');
          setActiveTab('dashboard');
          setPlanChangeSuccess(null); // Clear success message
        }, 2000);
      } else {
        console.error('❌ API call failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        let errorMessage = 'Failed to change plan. Please try again.';
        
        // Handle specific HTTP status codes
        if (response.status === 401) {
          errorMessage = 'Please log in again to change your plan. Your session may have expired.';
        } else if (response.status === 404) {
          if (data.error?.includes('Plan not found')) {
            errorMessage = 'The selected plan is no longer available. Please refresh the page and try again.';
          } else if (data.error?.includes('subscription not found')) {
            errorMessage = 'No active subscription found. Please contact support for assistance.';
          } else {
            errorMessage = 'Service not found. Please try again later.';
          }
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to change your plan. Please contact support.';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again in a few minutes.';
        } else {
          // Use the error message from the server if available
          errorMessage = data.error || `Failed to change plan (Error ${response.status})`;
        }
        
        console.error('❌ Plan change failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('💥 Error changing plan:', error);
      
      let errorMessage = 'Failed to change plan. Please try again.';
      
      if (error instanceof Error) {
        // Use the error message we already constructed above
        errorMessage = error.message;
      }
      
      setPlanChangeError(errorMessage);
    } finally {
      setPlanChangeLoading(false);
      console.log('🏁 Plan change process completed');
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('✅ Payment successful - refreshing user data');
    setShowPaymentSetup(false);
    setSelectedPlan(null);
    setPlanChangeSuccess('Welcome to SafePlay! Your subscription is now active.');
    
    // Refresh user data to get updated subscription info
    await fetchUserData();
    
    // Show success message for a few seconds then redirect to dashboard
    setTimeout(() => {
      setActiveTab('dashboard');
      setPlanChangeSuccess(null);
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment failed:', error);
    setPlanChangeError(error);
    setShowPaymentSetup(false);
    setSelectedPlan(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'PARENT') {
    router.push('/unauthorized');
    return null;
  }

  const hasActiveSubscription = user.subscription?.status === 'ACTIVE';

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="text-gray-700 text-lg font-medium">
          Manage your SafePlay subscription and track your usage
        </p>
      </div>

      {hasActiveSubscription ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/95 backdrop-blur-sm shadow-lg">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-semibold">Billing Dashboard</TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-semibold">Change Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <BillingDashboard />
          </TabsContent>

          <TabsContent value="plans">
            <div className="space-y-6">
              {/* Feedback Messages */}
              {planChangeError && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <strong>Error:</strong> {planChangeError}
                    </div>
                  </div>
                </div>
              )}
              
              {planChangeSuccess && (
                <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <strong>Success:</strong> {planChangeSuccess}
                    </div>
                  </div>
                </div>
              )}

              <Card className="bg-white/95 backdrop-blur-sm shadow-lg relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-gray-900">Change Your Plan</CardTitle>
                      <CardDescription className="text-gray-600">
                        Upgrade or downgrade your subscription plan
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => {
                        console.log('🔄 Close button clicked - switching to dashboard tab');
                        setActiveTab('dashboard');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
                      aria-label="Close"
                    >
                      <svg 
                        className="w-5 h-5 text-gray-400 group-hover:text-gray-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <SubscriptionPlans 
                    currentPlanId={user.subscription?.planId}
                    loading={planChangeLoading}
                    onSelectPlan={handlePlanChange}
                    hasActiveSubscription={hasActiveSubscription}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-8">
          {/* Feedback Messages */}
          {planChangeError && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <strong>Error:</strong> {planChangeError}
                </div>
              </div>
            </div>
          )}
          
          {planChangeSuccess && (
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <strong>Success:</strong> {planChangeSuccess}
                </div>
              </div>
            </div>
          )}

          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Choose Your SafePlay Plan</CardTitle>
              <CardDescription className="text-blue-700">
                Select the perfect plan for your family's enjoyment, safety and peace of mind. All plans have a no-risk 7-day risk free trial. To cancel anytime just click on the 'Cancel Subscription' button under the Subscription or the Account menus.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <SubscriptionPlans 
              loading={planChangeLoading}
              onSelectPlan={handlePlanChange}
              hasActiveSubscription={hasActiveSubscription}
            />
          </div>
        </div>
      )}

      {/* Payment Setup Modal for New Users */}
      <Dialog open={showPaymentSetup} onOpenChange={setShowPaymentSetup}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {selectedPlan && (
              <PaymentSetup
                planId={selectedPlan.planId}
                stripePriceId={selectedPlan.stripePriceId} // FIXED: Pass the actual Stripe price ID
                billingInterval={selectedPlan.interval}
                planName={selectedPlan.planName}
                amount={selectedPlan.amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
