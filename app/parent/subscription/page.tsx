

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SubscriptionPlans from '@/components/subscription/subscription-plans';
import BillingDashboard from '@/components/subscription/billing-dashboard';
import PaymentSetup from '@/components/subscription/payment-setup';
import { AddressAutocomplete } from '@/components/verification/address-autocomplete';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

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
  
  // 🔧 BILLING ADDRESS FIX: Add state for address collection
  const [billingAddress, setBillingAddress] = useState('');
  const [billingAddressValidation, setBillingAddressValidation] = useState<any>(null);
  const [billingAddressFields, setBillingAddressFields] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    fullAddress: ''
  });
  const [showAddressCollection, setShowAddressCollection] = useState(false);

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
      console.log('🔍 SUBSCRIPTION PAGE: Fetching real user subscription data...');
      
      // Fetch real user subscription data
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ SUBSCRIPTION PAGE: User data fetched:', userData);
        
        setUser({
          id: userData.id,
          role: userData.role || 'PARENT',
          subscription: userData.subscription || null,
        });
      } else {
        console.log('❌ SUBSCRIPTION PAGE: Failed to fetch user data, using fallback');
        // Fallback to basic user data if API call fails
        setUser({
          id: session?.user?.id,
          role: 'PARENT',
          subscription: null,
        });
      }
    } catch (error) {
      console.error('❌ SUBSCRIPTION PAGE: Error fetching user data:', error);
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
    console.log('🚀 SUBSCRIPTION PAGE: Starting plan selection process...', { 
      planId,
      stripePriceId,
      interval,
      hasActiveSubscription: hasActiveSubscription,
      sessionUserId: session?.user?.id,
      sessionUserEmail: session?.user?.email
    });

    // 🔧 CRITICAL FIX: Handle FREE plan selection (downgrade)
    if (planId === 'free' || stripePriceId === null) {
      console.log('🆓 SUBSCRIPTION PAGE: Processing FREE plan selection (downgrade)');
      
      setPlanChangeLoading(true);
      setPlanChangeError(null);
      setPlanChangeSuccess(null);

      try {
        const response = await fetch('/api/stripe/subscription/modify-fixed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceId: null }), // null indicates FREE plan
        });

        const data = await response.json();

        if (response.ok) {
          setPlanChangeSuccess('🎉 Successfully downgraded to FREE plan! Your subscription has been updated.');
          console.log('✅ SUBSCRIPTION PAGE: FREE plan downgrade successful');
          
          // Refresh user data to get updated subscription info
          await fetchUserData();
          
          setTimeout(() => {
            console.log('🔄 SUBSCRIPTION PAGE: Auto-clearing downgrade success message');
            setPlanChangeSuccess(null);
          }, 8000);
        } else {
          console.error('❌ SUBSCRIPTION PAGE: FREE plan downgrade failed:', data);
          setPlanChangeError(data.error || 'Failed to downgrade to FREE plan. Please try again.');
        }
      } catch (error) {
        console.error('❌ SUBSCRIPTION PAGE: Error during FREE plan downgrade:', error);
        setPlanChangeError('Failed to downgrade to FREE plan. Please try again.');
      } finally {
        setPlanChangeLoading(false);
      }
      
      return;
    }

    // 🔧 CRITICAL FIX: For ANY user upgrading to paid plans, show payment method collection
    console.log('💳 SUBSCRIPTION PAGE: Paid plan selected - showing payment method collection');
    
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
        
        // 🔧 CRITICAL FIX: Show payment method collection for ALL paid plan upgrades
        if (!hasActiveSubscription) {
          // New users: Address collection first, then payment
          console.log('🏠 SUBSCRIPTION PAGE: New user - showing address collection first');
          setShowAddressCollection(true);
        } else {
          // Existing users: Skip address collection, go straight to payment
          console.log('👤 SUBSCRIPTION PAGE: Existing user - showing payment method collection');
          setShowPaymentSetup(true);
        }
      } else {
        setPlanChangeError('Selected plan not found. Please try again.');
      }
    } catch (error) {
      console.error('❌ SUBSCRIPTION PAGE: Error fetching plan details:', error);
      setPlanChangeError('Failed to load plan details. Please try again.');
    }
  };

  const handlePaymentSuccess = async (subscriptionData?: any) => {
    console.log('✅ SUBSCRIPTION PAGE: Payment successful - refreshing user data');
    setShowPaymentSetup(false);
    setSelectedPlan(null);
    
    // 🔧 CRITICAL FIX: Handle different success scenarios for new vs existing users
    if (hasActiveSubscription) {
      // Existing user upgrade - show plan change success message
      setPlanChangeSuccess('🎉 Plan changed successfully! Your subscription has been updated and your payment method has been saved.');
      console.log('✅ SUBSCRIPTION PAGE: Existing user plan change successful');
      
      // Switch to dashboard to show updated billing info
      setTimeout(() => {
        console.log('🔄 SUBSCRIPTION PAGE: Switching to dashboard to show updated subscription details');
        setActiveTab('dashboard');
      }, 2000);
    } else {
      // New user signup - show welcome message
      setPlanChangeSuccess('🎉 Welcome to SafePlay! Your subscription is now active and your 7-day free trial has started. You can cancel anytime from your dashboard.');
      console.log('✅ SUBSCRIPTION PAGE: New user signup successful');
      
      // Switch to dashboard to show new subscription details
      setTimeout(() => {
        console.log('🔄 SUBSCRIPTION PAGE: Switching to dashboard to show new subscription details');
        setActiveTab('dashboard');
      }, 2000);
    }
    
    // Refresh user data to get updated subscription info
    await fetchUserData();
    
    // Clear success message after user has had time to read it
    setTimeout(() => {
      console.log('🔄 SUBSCRIPTION PAGE: Auto-clearing payment success message after user has had time to read it');
      setPlanChangeSuccess(null);
    }, 10000);
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ SUBSCRIPTION PAGE: Payment failed:', error);
    setPlanChangeError(String(error));
    setShowPaymentSetup(false);
    setSelectedPlan(null);
  };

  // 🔧 BILLING ADDRESS FIX: Address collection handlers
  const handleAddressChange = (address: string) => {
    console.log('🔧 BILLING ADDRESS DEBUG: Address changed:', address);
    setBillingAddress(address);
  };

  const handleAddressValidationChange = (validation: any) => {
    console.log('🔧 BILLING ADDRESS DEBUG: Address validation changed:', validation);
    setBillingAddressValidation(validation);
  };

  const handleAddressFieldsChange = (fields: any) => {
    console.log('🔧 BILLING ADDRESS DEBUG: Address fields changed:', fields);
    setBillingAddressFields(fields);
  };

  const handleAddressComplete = () => {
    console.log('🔧 BILLING ADDRESS DEBUG: Address collection complete');
    setShowAddressCollection(false);
    setShowPaymentSetup(true);
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

  // 🔧 CRITICAL FIX: Enhanced subscription detection using the improved user data
  const hasActiveSubscription = user.subscription?.isActive === true || 
                                user.subscription?.status === 'ACTIVE' || 
                                user.subscription?.status === 'TRIALING';

  console.log('🔍 SUBSCRIPTION PAGE: Subscription status debug:', {
    hasSubscription: !!user.subscription,
    subscriptionStatus: user.subscription?.status,
    isActive: user.subscription?.isActive,
    hasActiveSubscription,
    planType: user.subscription?.planType
  });

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
                <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg animate-pulse">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="font-semibold text-lg">
                      <strong className="text-green-800">Success:</strong> <span className="text-green-700">{planChangeSuccess}</span>
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
                        console.log('🔄 SUBSCRIPTION PAGE: Close button clicked - switching to dashboard tab');
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
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg animate-pulse">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="font-semibold text-lg">
                  <strong className="text-green-800">Success:</strong> <span className="text-green-700">{planChangeSuccess}</span>
                </div>
              </div>
            </div>
          )}

          <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">Choose Your SafePlay Plan</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Select the perfect plan for your family's safety needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionPlans 
                loading={planChangeLoading}
                onSelectPlan={handlePlanChange}
                hasActiveSubscription={hasActiveSubscription}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Address Collection Modal */}
      <Dialog open={showAddressCollection} onOpenChange={setShowAddressCollection}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Billing Address Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide your billing address to complete the subscription process.
            </p>
            <AddressAutocomplete
              value={billingAddress}
              onChange={handleAddressChange}
              onValidationChange={handleAddressValidationChange}
              onFieldsChange={handleAddressFieldsChange}
              placeholder="Enter your billing address"
              className="w-full"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddressCollection(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddressComplete}
                disabled={!billingAddressValidation?.isValid}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Setup Modal */}
      <Dialog open={showPaymentSetup} onOpenChange={setShowPaymentSetup}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {hasActiveSubscription ? 'Complete Plan Change' : 'Complete Your Subscription'}
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <PaymentSetup
              planId={selectedPlan.planId}
              stripePriceId={selectedPlan.stripePriceId}
              billingInterval={selectedPlan.interval}
              planName={selectedPlan.planName}
              amount={selectedPlan.amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              prefilledBillingAddress={billingAddress}
              billingAddressValidation={billingAddressValidation}
              prefilledBillingFields={billingAddressFields}
              isExistingUserUpgrade={hasActiveSubscription}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
