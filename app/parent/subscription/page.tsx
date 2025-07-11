
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

    // For new users without active subscription, show address collection first
    if (!hasActiveSubscription) {
      console.log('🏠 New user detected - showing address collection first');
      console.log('🔧 BILLING ADDRESS DEBUG: Starting address collection for subscription');
      
      // Fetch plan details for later use
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
          
          // 🔧 BILLING ADDRESS FIX: Show address collection before payment
          setShowAddressCollection(true);
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
        
        // 🔧 ERROR HANDLING FIX: Properly extract error messages from different response formats
        if (response.status === 401) {
          errorMessage = 'Please log in again to change your plan. Your session may have expired.';
        } else if (response.status === 404) {
          const errorStr = typeof data.error === 'string' ? data.error : 
                          typeof data.error === 'object' ? JSON.stringify(data.error) : 
                          'Not found';
          if (errorStr.includes('Plan not found')) {
            errorMessage = 'The selected plan is no longer available. Please refresh the page and try again.';
          } else if (errorStr.includes('subscription not found')) {
            errorMessage = 'No active subscription found. Please contact support for assistance.';
          } else {
            errorMessage = 'Service not found. Please try again later.';
          }
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to change your plan. Please contact support.';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again in a few minutes.';
        } else {
          // 🚨🚨🚨 PHANTOM ERROR OBJECT DETECTION - SUBSCRIPTION PAGE 🚨🚨🚨
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: API Error Response Inspection:`);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: response.status:`, response.status);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data TYPE:`, typeof data);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data VALUE:`, data);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data.error TYPE:`, typeof data.error);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data.error VALUE:`, data.error);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data.error JSON:`, JSON.stringify(data.error, null, 2));
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data.details TYPE:`, typeof data.details);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data.details VALUE:`, data.details);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data.message TYPE:`, typeof data.message);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: data.message VALUE:`, data.message);
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: FULL DATA OBJECT:`, JSON.stringify(data, null, 2));
          
          // 🔧 ERROR HANDLING FIX: Safely extract error message from various formats
          if (typeof data.error === 'string' && data.error.trim() !== '') {
            errorMessage = data.error;
            console.log(`✅ SUBSCRIPTION PAGE ERROR DEBUG: Using data.error string:`, errorMessage);
          } else if (typeof data.error === 'object' && data.error !== null) {
            // If error is an object, try to extract message or details
            if (typeof data.error.message === 'string' && data.error.message.trim() !== '') {
              errorMessage = data.error.message;
              console.log(`✅ SUBSCRIPTION PAGE ERROR DEBUG: Using data.error.message:`, errorMessage);
            } else if (typeof data.error.details === 'string' && data.error.details.trim() !== '') {
              errorMessage = data.error.details;
              console.log(`✅ SUBSCRIPTION PAGE ERROR DEBUG: Using data.error.details:`, errorMessage);
            } else {
              errorMessage = `Failed to change plan - Error object: ${JSON.stringify(data.error)}`;
              console.log(`⚠️ SUBSCRIPTION PAGE ERROR DEBUG: Using stringified error object:`, errorMessage);
            }
          } else if (data.details && typeof data.details === 'string' && data.details.trim() !== '') {
            errorMessage = data.details;
            console.log(`✅ SUBSCRIPTION PAGE ERROR DEBUG: Using data.details:`, errorMessage);
          } else if (data.message && typeof data.message === 'string' && data.message.trim() !== '') {
            errorMessage = data.message;
            console.log(`✅ SUBSCRIPTION PAGE ERROR DEBUG: Using data.message:`, errorMessage);
          } else {
            errorMessage = `Failed to change plan (Error ${response.status}) - No clear error message found`;
            console.log(`⚠️ SUBSCRIPTION PAGE ERROR DEBUG: Using fallback error message:`, errorMessage);
          }
          
          console.error(`🚨🚨🚨 SUBSCRIPTION PAGE ERROR DEBUG: FINAL ERROR MESSAGE:`, errorMessage);
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
    console.error('🚨🚨🚨 PAYMENT ERROR HANDLER DEBUG: === PAYMENT ERROR RECEIVED ===');
    console.error('🚨🚨🚨 PAYMENT ERROR HANDLER DEBUG: error TYPE:', typeof error);
    console.error('🚨🚨🚨 PAYMENT ERROR HANDLER DEBUG: error VALUE:', error);
    console.error('🚨🚨🚨 PAYMENT ERROR HANDLER DEBUG: error JSON:', JSON.stringify(error, null, 2));
    console.error('🚨🚨🚨 PAYMENT ERROR HANDLER DEBUG: === POTENTIAL OBJECT ERROR DETECTION ===');
    
    if (typeof error === 'object' && error !== null) {
      console.error('🚨🚨🚨 PHANTOM USER ID DETECTED! Error is an object, not a string!');
      console.error('🚨🚨🚨 PHANTOM USER ID DETECTED! This will show as "[object Object]"');
      console.error('🚨🚨🚨 PHANTOM USER ID DETECTED! Object contents:', error);
    }
    
    console.error('❌ Payment failed - setting plan change error:', error);
    setPlanChangeError(error);
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
    console.log('🔧 BILLING ADDRESS DEBUG: === ADDRESS FIELDS RECEIVED IN SUBSCRIPTION PAGE ===');
    console.log('🔧 BILLING ADDRESS DEBUG: fields TYPE:', typeof fields);
    console.log('🔧 BILLING ADDRESS DEBUG: fields VALUE:', fields);
    console.log('🔧 BILLING ADDRESS DEBUG: fields JSON:', JSON.stringify(fields, null, 2));
    
    if (fields) {
      console.log('🔧 BILLING ADDRESS DEBUG: Field breakdown:');
      console.log('🔧 BILLING ADDRESS DEBUG:   - street:', fields.street, '(type:', typeof fields.street, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - city:', fields.city, '(type:', typeof fields.city, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - state:', fields.state, '(type:', typeof fields.state, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - zipCode:', fields.zipCode, '(type:', typeof fields.zipCode, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - fullAddress:', fields.fullAddress, '(type:', typeof fields.fullAddress, ')');
    }
    
    console.log('🔧 BILLING ADDRESS DEBUG: Setting billingAddressFields state...');
    setBillingAddressFields(fields);
    console.log('🔧 BILLING ADDRESS DEBUG: ✅ billingAddressFields state updated');
  };

  const handleAddressComplete = () => {
    console.log('🔧 BILLING ADDRESS DEBUG: === ADDRESS COLLECTION COMPLETE ===');
    console.log('🔧 BILLING ADDRESS DEBUG: Current billingAddressFields state:', JSON.stringify(billingAddressFields, null, 2));
    console.log('🔧 BILLING ADDRESS DEBUG: Current billingAddress state:', billingAddress);
    console.log('🔧 BILLING ADDRESS DEBUG: Current billingAddressValidation state:', JSON.stringify(billingAddressValidation, null, 2));
    console.log('🔧 BILLING ADDRESS DEBUG: Proceeding to payment with these address fields...');
    
    setShowAddressCollection(false);
    setShowPaymentSetup(true);
    
    console.log('🔧 BILLING ADDRESS DEBUG: ✅ Payment setup modal should now open with prefilled address fields');
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

      {/* 🔧 BILLING ADDRESS FIX: Address Collection Modal */}
      <Dialog open={showAddressCollection} onOpenChange={setShowAddressCollection}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Billing Address
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <p className="text-gray-600">
              Please enter your billing address for the subscription.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Street Address
              </label>
              <AddressAutocomplete
                value={billingAddress}
                onChange={handleAddressChange}
                onValidationChange={handleAddressValidationChange}
                onFieldsChange={handleAddressFieldsChange}
                placeholder="Enter your billing address"
                required={true}
                className="w-full"
              />
            </div>
            
            {billingAddressFields.street && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Address Selected:</p>
                <p className="text-sm text-green-700">{billingAddressFields.fullAddress}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddressCollection(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddressComplete}
                disabled={!billingAddressFields.street}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Setup Modal for New Users */}
      <Dialog open={showPaymentSetup} onOpenChange={setShowPaymentSetup}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {selectedPlan && (
              <>
                {/* 🔧 BILLING ADDRESS DEBUG: Payment setup data inspection */}
                {(() => {
                  console.log('🔧 BILLING ADDRESS DEBUG: === PAYMENT SETUP RENDER DEBUG ===');
                  console.log('🔧 BILLING ADDRESS DEBUG: About to render PaymentSetup with:');
                  console.log('🔧 BILLING ADDRESS DEBUG:   - selectedPlan:', JSON.stringify(selectedPlan, null, 2));
                  console.log('🔧 BILLING ADDRESS DEBUG:   - prefilledBillingFields:', JSON.stringify(billingAddressFields, null, 2));
                  console.log('🔧 BILLING ADDRESS DEBUG:   - prefilledBillingAddress:', billingAddress);
                  console.log('🔧 BILLING ADDRESS DEBUG:   - billingAddressValidation:', JSON.stringify(billingAddressValidation, null, 2));
                  console.log('🔧 BILLING ADDRESS DEBUG:   - userEmail:', session?.user?.email);
                  console.log('🔧 BILLING ADDRESS DEBUG:   - userName:', session?.user?.name);
                  console.log('🔧 BILLING ADDRESS DEBUG: === END PAYMENT SETUP RENDER DEBUG ===');
                  return null;
                })()}
                
                <PaymentSetup
                  planId={selectedPlan.planId}
                  stripePriceId={selectedPlan.stripePriceId} // FIXED: Pass the actual Stripe price ID
                  billingInterval={selectedPlan.interval}
                  planName={selectedPlan.planName}
                  amount={selectedPlan.amount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  // 🔧 BILLING ADDRESS FIX: Pass collected billing address data
                  userEmail={session?.user?.email || ''}
                  userName={session?.user?.name || ''}
                  prefilledBillingAddress={billingAddress}
                  billingAddressValidation={billingAddressValidation}
                  prefilledBillingFields={billingAddressFields}
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
