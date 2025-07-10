
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
  userName
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

  // Prefill billing address from signup process
  useEffect(() => {
    if (prefilledBillingFields) {
      // Use the parsed address fields directly
      setBillingDetails(prev => ({
        ...prev,
        address: {
          line1: prefilledBillingFields.street || '',
          city: prefilledBillingFields.city || '',
          state: prefilledBillingFields.state || '',
          postal_code: prefilledBillingFields.zipCode || '',
          country: 'US',
        }
      }));
    } else if (prefilledBillingAddress && billingAddressValidation) {
      try {
        // Use standardized address if available
        const addressData = billingAddressValidation.standardizedAddress;
        if (addressData) {
          setBillingDetails(prev => ({
            ...prev,
            address: {
              line1: `${addressData.street_number || ''} ${addressData.route || ''}`.trim() || prefilledBillingAddress,
              city: addressData.locality || '',
              state: addressData.administrative_area_level_1 || '',
              postal_code: addressData.postal_code || '',
              country: addressData.country || 'US',
            }
          }));
        } else {
          // Fall back to using the original address string
          setBillingDetails(prev => ({
            ...prev,
            address: {
              ...prev.address,
              line1: prefilledBillingAddress,
            }
          }));
        }
      } catch (error) {
        console.error('Error prefilling billing address:', error);
        // Still set the basic address if parsing fails
        setBillingDetails(prev => ({
          ...prev,
          address: {
            ...prev.address,
            line1: prefilledBillingAddress || '',
          }
        }));
      }
    }
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

    if (!stripe || !elements) {
      setError('Stripe has not loaded correctly');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      console.log('🎯 PAYMENT: Starting payment process...');
      
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: billingDetails,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      console.log('✅ PAYMENT: Payment method created:', paymentMethod.id);

      // Create subscription with payment method
      // Use signup endpoint if user is not authenticated (during signup flow)
      const isSignupFlow = !session?.user?.id;
      const endpoint = isSignupFlow ? '/api/stripe/subscription/create-signup' : '/api/stripe/subscription/create-fixed';
      
      const requestBody = isSignupFlow ? {
        priceId: stripePriceId,
        paymentMethodId: paymentMethod.id,
        discountCodeId,
        userEmail: userEmail || session?.user?.email || billingDetails.name?.toLowerCase().replace(/\s+/g, '') + '@temp.com',
        userName: userName || billingDetails.name || 'User'
      } : {
        priceId: stripePriceId,
        paymentMethodId: paymentMethod.id,
        discountCodeId,
      };

      console.log('💳 PAYMENT: Using endpoint:', endpoint, 'IsSignupFlow:', isSignupFlow);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ PAYMENT: Subscription API Error:', data);
        throw new Error(data.error || data.details || 'Payment failed');
      }

      console.log('✅ PAYMENT: Subscription API Response:', data);

      // Handle subscription confirmation if needed
      if (data.subscription?.latest_invoice?.payment_intent?.status === 'requires_action') {
        const { error: confirmError } = await stripe.confirmCardPayment(
          data.subscription.latest_invoice.payment_intent.client_secret
        );
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Success!
      setSuccess(true);
      onSuccess?.(data);
      
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during payment';
      console.error('❌ PAYMENT: Payment error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
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
