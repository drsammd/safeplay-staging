
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useSession } from 'next-auth/react';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key');

// Stripe Elements styling
const elementStyles = {
  base: {
    fontSize: '16px',
    color: '#424770',
    '::placeholder': {
      color: '#aab7c4',
    },
    padding: '12px',
  },
  invalid: {
    color: '#9e2146',
  },
};

const elementOptions = {
  style: elementStyles,
};

interface AddressFields {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

interface PaymentSetupProps {
  planId: string;
  stripePriceId: string;
  billingInterval: 'monthly' | 'yearly' | 'lifetime';
  planName: string;
  amount: number;
  originalAmount?: number;
  discountCodeId?: string;
  onSuccess?: (subscriptionData?: any) => void;
  onError?: (error: string) => void;
  prefilledBillingAddress?: string;
  billingAddressValidation?: any;
  prefilledBillingFields?: AddressFields;
  userEmail?: string;
  userName?: string;
  isExistingUserUpgrade?: boolean;
}

// Payment Form Component (inside Elements provider)
function PaymentFormContent({
  planId,
  stripePriceId,
  billingInterval,
  planName,
  amount,
  originalAmount,
  discountCodeId,
  onSuccess,
  onError,
  prefilledBillingAddress,
  billingAddressValidation,
  prefilledBillingFields,
  userEmail,
  userName,
  isExistingUserUpgrade = false
}: PaymentSetupProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState<any>(null);
  const [cardExpiry, setCardExpiry] = useState<any>(null);
  const [cardCvc, setCardCvc] = useState<any>(null);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  // 🔧 ENHANCED BILLING ADDRESS DEBUG: Comprehensive address field debugging
  useEffect(() => {
    const debugTimestamp = new Date().toISOString();
    console.log(`🔧 BILLING ADDRESS DEBUG: PaymentSetup useEffect triggered at ${debugTimestamp}`);
    console.log(`🔧 BILLING ADDRESS DEBUG: === ADDRESS PREFILL DATA INSPECTION ===`);
    console.log('🔧 BILLING ADDRESS DEBUG: prefilledBillingFields TYPE:', typeof prefilledBillingFields);
    console.log('🔧 BILLING ADDRESS DEBUG: prefilledBillingFields VALUE:', prefilledBillingFields);
    console.log('🔧 BILLING ADDRESS DEBUG: prefilledBillingFields JSON:', JSON.stringify(prefilledBillingFields, null, 2));
    console.log('🔧 BILLING ADDRESS DEBUG: prefilledBillingAddress VALUE:', prefilledBillingAddress);
    console.log('🔧 BILLING ADDRESS DEBUG: billingAddressValidation VALUE:', billingAddressValidation);
    console.log(`🔧 BILLING ADDRESS DEBUG: === CURRENT BILLING DETAILS STATE ===`);
    console.log('🔧 BILLING ADDRESS DEBUG: Current billingDetails:', JSON.stringify(billingDetails, null, 2));
    
    if (prefilledBillingFields) {
      console.log('🔧 BILLING ADDRESS DEBUG: === USING PREFILLED BILLING FIELDS ===');
      console.log('🔧 BILLING ADDRESS DEBUG: Field extraction:');
      console.log('🔧 BILLING ADDRESS DEBUG:   - street:', prefilledBillingFields.street, '(type:', typeof prefilledBillingFields.street, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - city:', prefilledBillingFields.city, '(type:', typeof prefilledBillingFields.city, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - state:', prefilledBillingFields.state, '(type:', typeof prefilledBillingFields.state, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - zipCode:', prefilledBillingFields.zipCode, '(type:', typeof prefilledBillingFields.zipCode, ')');
      console.log('🔧 BILLING ADDRESS DEBUG:   - fullAddress:', prefilledBillingFields.fullAddress, '(type:', typeof prefilledBillingFields.fullAddress, ')');
      
      // Use the parsed address fields directly
      const newBillingDetails = {
        ...billingDetails,
        address: {
          line1: String(prefilledBillingFields.street || ''),
          city: String(prefilledBillingFields.city || ''),
          state: String(prefilledBillingFields.state || ''),
          postal_code: String(prefilledBillingFields.zipCode || ''),
          country: 'US',
        }
      };
      
      console.log('🔧 BILLING ADDRESS DEBUG: === NEW BILLING DETAILS CONSTRUCTED ===');
      console.log('🔧 BILLING ADDRESS DEBUG: newBillingDetails JSON:', JSON.stringify(newBillingDetails, null, 2));
      console.log('🔧 BILLING ADDRESS DEBUG: Setting billing details...');
      setBillingDetails(newBillingDetails);
      console.log('🔧 BILLING ADDRESS DEBUG: ✅ Billing details set from prefilledBillingFields');
      
    } else if (prefilledBillingAddress && billingAddressValidation) {
      console.log('🔧 BILLING ADDRESS DEBUG: === USING PREFILLED BILLING ADDRESS WITH VALIDATION ===');
      try {
        // Use standardized address if available
        const addressData = billingAddressValidation.standardizedAddress;
        console.log('🔧 BILLING ADDRESS DEBUG: addressData from validation:', JSON.stringify(addressData, null, 2));
        
        if (addressData) {
          const constructedAddress = {
            line1: `${addressData.street_number || ''} ${addressData.route || ''}`.trim() || prefilledBillingAddress,
            city: addressData.locality || '',
            state: addressData.administrative_area_level_1 || '',
            postal_code: addressData.postal_code || '',
            country: addressData.country || 'US',
          };
          
          console.log('🔧 BILLING ADDRESS DEBUG: Constructed address from validation:', JSON.stringify(constructedAddress, null, 2));
          
          setBillingDetails(prev => ({
            ...prev,
            address: constructedAddress
          }));
          console.log('🔧 BILLING ADDRESS DEBUG: ✅ Billing details set from address validation');
        } else {
          console.log('🔧 BILLING ADDRESS DEBUG: No standardized address data, using raw address');
          // Fall back to using the original address string
          setBillingDetails(prev => ({
            ...prev,
            address: {
              ...prev.address,
              line1: prefilledBillingAddress,
            }
          }));
          console.log('🔧 BILLING ADDRESS DEBUG: ✅ Billing details set from raw address');
        }
      } catch (error) {
        console.error('🔧 BILLING ADDRESS DEBUG: ❌ Error prefilling billing address:', error);
        console.error('🔧 BILLING ADDRESS DEBUG: Error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        });
        // Still set the basic address if parsing fails
        setBillingDetails(prev => ({
          ...prev,
          address: {
            ...prev.address,
            line1: prefilledBillingAddress || '',
          }
        }));
        console.log('🔧 BILLING ADDRESS DEBUG: ⚠️ Fallback billing details set after error');
      }
    } else {
      console.log('🔧 BILLING ADDRESS DEBUG: === NO PREFILLED DATA AVAILABLE ===');
      console.log('🔧 BILLING ADDRESS DEBUG: prefilledBillingFields is:', prefilledBillingFields);
      console.log('🔧 BILLING ADDRESS DEBUG: prefilledBillingAddress is:', prefilledBillingAddress);
      console.log('🔧 BILLING ADDRESS DEBUG: billingAddressValidation is:', billingAddressValidation);
    }
    
    console.log(`🔧 BILLING ADDRESS DEBUG: === END ADDRESS PREFILL DEBUG ===`);
  }, [prefilledBillingAddress, billingAddressValidation, prefilledBillingFields]);

  // Set cardholder name from session or props (signup flow)
  useEffect(() => {
    let nameToUse = '';
    
    // Priority: userName prop (signup flow) > session name > userEmail as fallback
    if (userName?.trim()) {
      nameToUse = userName;
    } else if (session?.user?.name?.trim()) {
      nameToUse = session.user.name;
    } else if (userEmail?.trim()) {
      // Extract name from email as fallback
      nameToUse = userEmail.split('@')[0].replace(/[._]/g, ' ');
    }
    
    if (nameToUse) {
      setBillingDetails(prev => ({
        ...prev,
        name: nameToUse
      }));
    }
  }, [session?.user?.name, userName, userEmail]);

  useEffect(() => {
    // Check if all card elements are complete
    const isComplete = cardNumber?.complete && cardExpiry?.complete && cardCvc?.complete;
    setCardComplete(isComplete);
  }, [cardNumber, cardExpiry, cardCvc]);

  // Comprehensive form validation
  const isFormValid = useCallback(() => {
    const isBillingComplete = !!(
      billingDetails.name?.trim() &&
      billingDetails.address.line1?.trim() &&
      billingDetails.address.city?.trim() &&
      billingDetails.address.state?.trim() &&
      billingDetails.address.postal_code?.trim()
    );
    
    return cardComplete && isBillingComplete;
  }, [cardComplete, billingDetails]);

  const handleCardChange = (elementType: string) => (event: any) => {
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }

    // Store element completion status
    switch (elementType) {
      case 'cardNumber':
        setCardNumber(event);
        break;
      case 'cardExpiry':
        setCardExpiry(event);
        break;
      case 'cardCvc':
        setCardCvc(event);
        break;
    }
  };

  const handleBillingChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBillingDetails(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object || {}),
          [child]: value
        }
      }));
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // COMPREHENSIVE DEBUGGING - START
    const debugId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔍 PAYMENT DEBUG [${debugId}]: Starting payment process...`);
    console.log(`🔍 PAYMENT DEBUG [${debugId}]: Session state:`, {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name
    });
    console.log(`🔍 PAYMENT DEBUG [${debugId}]: Payment parameters:`, {
      planId,
      stripePriceId,
      billingInterval,
      planName,
      amount,
      discountCodeId,
      userEmail,
      userName
    });

    if (!stripe || !elements) {
      const errorMsg = 'Stripe has not loaded correctly';
      console.error(`🚨 PAYMENT DEBUG [${debugId}]: ${errorMsg}`);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      const errorMsg = 'Card element not found';
      console.error(`🚨 PAYMENT DEBUG [${debugId}]: ${errorMsg}`);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      console.log(`💳 PAYMENT DEBUG [${debugId}]: Creating payment method...`);
      
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: billingDetails,
      });

      if (paymentMethodError) {
        console.error(`🚨 PAYMENT DEBUG [${debugId}]: Payment method creation failed:`, paymentMethodError);
        throw new Error(paymentMethodError.message);
      }

      console.log(`✅ PAYMENT DEBUG [${debugId}]: Payment method created:`, paymentMethod.id);

      // 🔧 CRITICAL FIX: Determine API endpoint and request body based on user type
      const isSignupFlow = !session?.user?.id;
      let endpoint: string;
      let requestBody: any;

      if (isExistingUserUpgrade) {
        // Existing user upgrade - use modify-fixed endpoint
        endpoint = '/api/stripe/subscription/modify-fixed';
        requestBody = {
          priceId: stripePriceId, // Use real Stripe price ID
          paymentMethodId: paymentMethod.id,
          debugId: debugId // Include debug ID for tracking
        };
        console.log(`🔄 PAYMENT DEBUG [${debugId}]: Existing user upgrade flow selected`);
      } else {
        // New user signup - use subscription endpoint
        endpoint = '/api/stripe/subscription';
        requestBody = {
          priceId: stripePriceId, // Use real Stripe price ID instead of planId
          paymentMethodId: paymentMethod.id,
          discountCodeId,
          isSignupFlow: isSignupFlow,
          email: userEmail, // Include email for signup flow
          name: userName,   // Include name for signup flow
          debugId: debugId // Include debug ID for tracking
        };
        console.log(`🆕 PAYMENT DEBUG [${debugId}]: New user signup flow selected`);
      }

      console.log(`🚀 PAYMENT DEBUG [${debugId}]: Making API call to:`, endpoint);
      console.log(`🚀 PAYMENT DEBUG [${debugId}]: Request body:`, requestBody);
      console.log(`🚀 PAYMENT DEBUG [${debugId}]: IsSignupFlow:`, isSignupFlow);
      console.log(`🚀 PAYMENT DEBUG [${debugId}]: IsExistingUserUpgrade:`, isExistingUserUpgrade);

      // Log timestamp before API call
      const apiCallStart = Date.now();
      console.log(`⏰ PAYMENT DEBUG [${debugId}]: API call started at:`, new Date(apiCallStart).toISOString());

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const apiCallEnd = Date.now();
      const apiCallDuration = apiCallEnd - apiCallStart;
      console.log(`⏰ PAYMENT DEBUG [${debugId}]: API call completed at:`, new Date(apiCallEnd).toISOString());
      console.log(`⏰ PAYMENT DEBUG [${debugId}]: API call duration:`, `${apiCallDuration}ms`);

      console.log(`📡 PAYMENT DEBUG [${debugId}]: API response status:`, response.status);
      console.log(`📡 PAYMENT DEBUG [${debugId}]: API response ok:`, response.ok);

      const data = await response.json();
      console.log(`📡 PAYMENT DEBUG [${debugId}]: API response data:`, data);

      if (!response.ok) {
        console.error(`🚨 PAYMENT DEBUG [${debugId}]: Subscription API Error:`, {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          fullResponse: data
        });
        
        // 🚨🚨🚨 PHANTOM ERROR OBJECT DETECTION 🚨🚨🚨
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: API Error Response Inspection:`);
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: data.error TYPE:`, typeof data.error);
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: data.error VALUE:`, data.error);
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: data.error JSON:`, JSON.stringify(data.error, null, 2));
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: data.details TYPE:`, typeof data.details);
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: data.details VALUE:`, data.details);
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: data.message TYPE:`, typeof data.message);
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: data.message VALUE:`, data.message);
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: FULL DATA OBJECT:`, JSON.stringify(data, null, 2));
        
        // 🔧 ERROR HANDLING FIX: Safely extract error message from API response
        let apiErrorMessage = 'Payment failed';
        if (typeof data.error === 'string' && data.error.trim() !== '') {
          apiErrorMessage = data.error;
          console.log(`✅ PAYMENT SETUP ERROR DEBUG [${debugId}]: Using data.error string:`, apiErrorMessage);
        } else if (typeof data.error === 'object' && data.error !== null) {
          if (typeof data.error.message === 'string' && data.error.message.trim() !== '') {
            apiErrorMessage = data.error.message;
            console.log(`✅ PAYMENT SETUP ERROR DEBUG [${debugId}]: Using data.error.message:`, apiErrorMessage);
          } else if (typeof data.error.details === 'string' && data.error.details.trim() !== '') {
            apiErrorMessage = data.error.details;
            console.log(`✅ PAYMENT SETUP ERROR DEBUG [${debugId}]: Using data.error.details:`, apiErrorMessage);
          } else {
            apiErrorMessage = `Payment failed - Error object: ${JSON.stringify(data.error)}`;
            console.log(`⚠️ PAYMENT SETUP ERROR DEBUG [${debugId}]: Using stringified error object:`, apiErrorMessage);
          }
        } else if (typeof data.details === 'string' && data.details.trim() !== '') {
          apiErrorMessage = data.details;
          console.log(`✅ PAYMENT SETUP ERROR DEBUG [${debugId}]: Using data.details:`, apiErrorMessage);
        } else if (typeof data.message === 'string' && data.message.trim() !== '') {
          apiErrorMessage = data.message;
          console.log(`✅ PAYMENT SETUP ERROR DEBUG [${debugId}]: Using data.message:`, apiErrorMessage);
        } else {
          apiErrorMessage = `Payment failed (Status ${response.status}) - No clear error message found`;
          console.log(`⚠️ PAYMENT SETUP ERROR DEBUG [${debugId}]: Using fallback error message:`, apiErrorMessage);
        }
        
        console.error(`🚨 PAYMENT SETUP ERROR DEBUG [${debugId}]: FINAL ERROR MESSAGE:`, apiErrorMessage);
        
        throw new Error(apiErrorMessage);
      }

      console.log(`✅ PAYMENT DEBUG [${debugId}]: Subscription API Success:`, data);

      // Handle subscription confirmation if needed (for real Stripe subscriptions)
      if (data.subscription?.latest_invoice?.payment_intent?.status === 'requires_action') {
        console.log(`🔐 PAYMENT DEBUG [${debugId}]: Payment requires additional action`);
        const { error: confirmError } = await stripe.confirmCardPayment(
          data.subscription.latest_invoice.payment_intent.client_secret
        );
        
        if (confirmError) {
          console.error(`🚨 PAYMENT DEBUG [${debugId}]: Payment confirmation failed:`, confirmError);
          throw new Error(confirmError.message);
        }
        console.log(`✅ PAYMENT DEBUG [${debugId}]: Payment confirmed successfully`);
      }

      // Success!
      setSuccess(true);
      console.log(`🎉 PAYMENT DEBUG [${debugId}]: Payment process completed successfully`);
      
      // For signup flow, pass both subscription and customer data
      if (isSignupFlow && data.isSignupFlow) {
        console.log(`🚀 PAYMENT DEBUG [${debugId}]: Signup flow success - passing subscription and customer data`);
        onSuccess?.({
          subscription: data.subscription,
          customer: data.customer,
          isSignupFlow: true,
          debugId: debugId
        });
      } else {
        // For authenticated users, pass regular subscription data
        console.log(`👤 PAYMENT DEBUG [${debugId}]: Authenticated user flow success`);
        onSuccess?.(data);
      }
      
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during payment';
      console.error(`🚨 PAYMENT DEBUG [${debugId}]: Payment error:`, {
        errorMessage,
        errorStack: err.stack,
        errorName: err.name,
        fullError: err
      });
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      console.log(`🏁 PAYMENT DEBUG [${debugId}]: Payment process finished`);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payment Successful!</h3>
              <p className="text-gray-600">
                Welcome to {planName}! Your subscription is now active.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Information
        </CardTitle>
        <CardDescription>
          Complete your subscription to {planName}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="flex justify-between items-center">
              <span>{planName}</span>
              <span className="font-medium">${amount}</span>
            </div>
            {originalAmount && originalAmount > amount && (
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Original Price</span>
                <span className="line-through">${originalAmount}</span>
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {billingInterval === 'lifetime' ? 'One-time payment' : 
               billingInterval === 'yearly' ? 'Billed annually' : 'Billed monthly'}
            </div>
            {billingInterval !== 'lifetime' && (
              <div className="mt-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  7 day free trial included
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Billing Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Billing Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="cardholder-name">Full Name *</Label>
              <Input 
                id="cardholder-name" 
                placeholder="John Doe" 
                value={billingDetails.name}
                onChange={(e) => handleBillingChange('name', e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address-line1">Address *</Label>
              <Input 
                id="address-line1" 
                placeholder="123 Main Street" 
                value={billingDetails.address.line1}
                onChange={(e) => handleBillingChange('address.line1', e.target.value)}
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  placeholder="New York" 
                  value={billingDetails.address.city}
                  onChange={(e) => handleBillingChange('address.city', e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input 
                  id="state" 
                  placeholder="NY" 
                  value={billingDetails.address.state}
                  onChange={(e) => handleBillingChange('address.state', e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal-code">ZIP Code *</Label>
                <Input 
                  id="postal-code" 
                  placeholder="12345" 
                  value={billingDetails.address.postal_code}
                  onChange={(e) => handleBillingChange('address.postal_code', e.target.value)}
                  required 
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-4">
            <h4 className="font-medium">Payment Method</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Card Number *</Label>
                <div className="border rounded-md p-3 bg-white">
                  <CardNumberElement 
                    options={elementOptions}
                    onChange={handleCardChange('cardNumber')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date *</Label>
                  <div className="border rounded-md p-3 bg-white">
                    <CardExpiryElement 
                      options={elementOptions}
                      onChange={handleCardChange('cardExpiry')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>CVC *</Label>
                  <div className="border rounded-md p-3 bg-white">
                    <CardCvcElement 
                      options={elementOptions}
                      onChange={handleCardChange('cardCvc')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !stripe || !elements || !isFormValid()}
          >
            {loading ? 'Processing...' : 
             billingInterval === 'lifetime' ? `Pay $${amount}` : 
             `Start ${billingInterval === 'yearly' ? 'Annual' : 'Monthly'} Subscription`}
          </Button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            {billingInterval !== 'lifetime' && ' You can cancel anytime.'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

// Main PaymentSetup component with Elements provider
export default function PaymentSetup(props: PaymentSetupProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}
