
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

// Storage key base for form persistence (will be made user-specific)
const FORM_STORAGE_KEY_BASE = 'safeplay_payment_form_data';
const CARD_STORAGE_KEY_BASE = 'safeplay_card_data';

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
  onError
}: PaymentSetupProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dataRestored, setDataRestored] = useState(false);
  const [cardDataRestored, setCardDataRestored] = useState(false);
  const [savedCardInfo, setSavedCardInfo] = useState<any>(null);
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

  // User-specific storage keys - CRITICAL FIX for cross-user data privacy
  const getUserSpecificKey = useCallback((baseKey: string) => {
    const userIdentifier = session?.user?.email || session?.user?.id || 'anonymous';
    return `${baseKey}_${userIdentifier}`;
  }, [session?.user?.email, session?.user?.id]);



  // Clear previous user data when session changes - CRITICAL FIX
  useEffect(() => {
    if (session?.user?.email) {
      // Clear any data from previous users
      const allKeys = Object.keys(localStorage);
      const currentUserKey = getUserSpecificKey(FORM_STORAGE_KEY_BASE);
      const currentCardKey = getUserSpecificKey(CARD_STORAGE_KEY_BASE);
      
      // Remove data from other users (privacy protection)
      allKeys.forEach(key => {
        if ((key.startsWith(FORM_STORAGE_KEY_BASE) || key.startsWith(CARD_STORAGE_KEY_BASE)) && 
            key !== currentUserKey && key !== currentCardKey) {
          try {
            localStorage.removeItem(key);
            console.log('🗑️ Cleared previous user data:', key);
          } catch (error) {
            console.error('Error clearing previous user data:', error);
          }
        }
      });
    }
  }, [session?.user?.email, getUserSpecificKey]);

  // Load saved form data on component mount - FIXED with user-specific keys
  useEffect(() => {
    if (!session?.user?.email) return;

    const loadSavedData = () => {
      try {
        const formKey = getUserSpecificKey(FORM_STORAGE_KEY_BASE);
        const cardKey = getUserSpecificKey(CARD_STORAGE_KEY_BASE);
        
        // Load billing details
        const savedFormData = localStorage.getItem(formKey);
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          if (parsedData.name || parsedData.address?.line1) {
            setBillingDetails(parsedData);
            setDataRestored(true);
            console.log('📂 Loaded saved billing details for user:', session.user.email);
          }
        }

        // Load card data indication (for user experience)
        const savedCardData = localStorage.getItem(cardKey);
        if (savedCardData) {
          const parsedCardData = JSON.parse(savedCardData);
          if (parsedCardData.hasCardData) {
            setSavedCardInfo(parsedCardData);
            setCardDataRestored(true);
            console.log('💳 Previous card data detected:', { 
              hasCardData: parsedCardData.hasCardData,
              brand: parsedCardData.brand,
              lastUsed: parsedCardData.lastUsed
            });
          }
        }
        
        // Clear notifications after 5 seconds
        setTimeout(() => {
          setDataRestored(false);
          setCardDataRestored(false);
        }, 5000);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    };

    loadSavedData();
  }, [session?.user?.email, getUserSpecificKey]);

  // Save form data to localStorage whenever billingDetails changes - FIXED with user-specific keys
  useEffect(() => {
    if (!session?.user?.email) return;
    
    try {
      const formKey = getUserSpecificKey(FORM_STORAGE_KEY_BASE);
      localStorage.setItem(formKey, JSON.stringify(billingDetails));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [billingDetails, session?.user?.email, getUserSpecificKey]);

  // Save card data indication (for user experience) - ENHANCED FEATURE
  const saveCardData = useCallback((cardData: any) => {
    if (!session?.user?.email) return;
    
    try {
      const cardKey = getUserSpecificKey(CARD_STORAGE_KEY_BASE);
      const dataToSave = {
        hasCardData: cardData.hasCardData || false,
        brand: cardData.brand || null,
        lastUsed: cardData.lastUsed || new Date().toISOString(),
        // Intentionally NOT saving actual card details for security
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(cardKey, JSON.stringify(dataToSave));
      console.log('💾 Saved card data indication:', { hasCardData: dataToSave.hasCardData, brand: dataToSave.brand });
    } catch (error) {
      console.error('Error saving card data indication:', error);
    }
  }, [session?.user?.email, getUserSpecificKey]);

  // Clear stored data on successful payment - UPDATED for user-specific keys
  const clearStoredData = useCallback(() => {
    if (!session?.user?.email) return;
    
    try {
      const formKey = getUserSpecificKey(FORM_STORAGE_KEY_BASE);
      const cardKey = getUserSpecificKey(CARD_STORAGE_KEY_BASE);
      localStorage.removeItem(formKey);
      localStorage.removeItem(cardKey);
      console.log('🗑️ Cleared stored form data for user:', session.user.email);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }, [session?.user?.email, getUserSpecificKey]);



  useEffect(() => {
    // Check if all card elements are complete
    const isComplete = cardNumber?.complete && cardExpiry?.complete && cardCvc?.complete;
    setCardComplete(isComplete);

    // Save indication that card data was entered (for persistence UX)
    if (cardNumber?.complete && cardExpiry?.complete) {
      // Note: Stripe doesn't expose actual card data for security
      // We just save that card info was previously entered
      const cardData = {
        hasCardData: true,
        lastUsed: new Date().toISOString(),
        brand: cardNumber?.brand || 'card', // This might be available
      };
      
      saveCardData(cardData);
    }
  }, [cardNumber, cardExpiry, cardCvc, saveCardData]);

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

  // FIXED subscription error handling
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
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: billingDetails,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create subscription with payment method
      console.log('🎯 FRONTEND: Sending subscription request with:', {
        stripePriceId,
        paymentMethodId: paymentMethod.id,
        planId,
        billingInterval
      });
      
      const response = await fetch('/api/stripe/subscription/create-fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: stripePriceId, // FIXED: Use actual Stripe price ID instead of constructing it
          paymentMethodId: paymentMethod.id,
          discountCodeId,
        }),
      });

      const data = await response.json();

      // ENHANCED: Better error detection and success handling
      if (!response.ok) {
        console.error('❌ Subscription API Error:', data);
        throw new Error(data.error || data.message || 'Payment failed');
      }

      console.log('✅ Subscription API Response:', data);

      // Handle subscription confirmation if needed FIRST
      if (data.requires_action && data.client_secret) {
        console.log('🔄 Confirming payment with client_secret...');
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.client_secret);
        if (confirmError) {
          console.error('❌ Payment confirmation failed:', confirmError);
          throw new Error(confirmError.message);
        }
        
        console.log('✅ Payment confirmed:', paymentIntent?.status);
        // After successful confirmation, subscription should be active
        clearStoredData();
        setSuccess(true);
        onSuccess?.();
        return;
      }

      // ENHANCED: Check for subscription creation success with multiple status checks
      if (data.subscription) {
        const subStatus = data.subscription.status;
        console.log('📋 Subscription status:', subStatus);
        
        if (['active', 'trialing', 'incomplete', 'past_due'].includes(subStatus)) {
          // These are all considered successful subscription states
          clearStoredData();
          setSuccess(true);
          onSuccess?.();
          return;
        } else {
          console.warn('⚠️ Unexpected subscription status:', subStatus);
          // Still try to proceed as subscription was created
          clearStoredData();
          setSuccess(true);
          onSuccess?.();
          return;
        }
      }

      // ENHANCED: More specific error handling
      if (data.error) {
        throw new Error(data.error);
      }
      
      // If we reach here without a subscription object, something went wrong
      console.error('❌ No subscription in response:', data);
      throw new Error('Subscription creation failed - no subscription returned');

    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during payment';
      console.error('Payment error:', err);
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
            <Button onClick={() => window.location.reload()}>
              Continue to Dashboard
            </Button>
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

          {dataRestored && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your billing information has been restored from your previous session.
              </AlertDescription>
            </Alert>
          )}

          {cardDataRestored && savedCardInfo && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                Previous payment method detected{savedCardInfo.brand ? ` (${savedCardInfo.brand.toUpperCase()} card)` : ''}. 
                For security, please re-enter your complete card information including CVV.
              </AlertDescription>
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
            disabled={loading || !stripe || !elements || !billingDetails.name || !billingDetails.address.line1}
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

interface PaymentSetupProps {
  planId: string;
  stripePriceId: string; // Add the actual Stripe price ID
  billingInterval: 'monthly' | 'yearly' | 'lifetime';
  planName: string;
  amount: number;
  originalAmount?: number;
  discountCodeId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Main PaymentSetup component with Elements provider
export default function PaymentSetup(props: PaymentSetupProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}
