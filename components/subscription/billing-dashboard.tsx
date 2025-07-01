
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Camera, 
  Bell, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import dynamic from 'next/dynamic';

// Dynamically import Stripe components to avoid SSR issues
const Elements = dynamic(() => import('@stripe/react-stripe-js').then(mod => ({ default: mod.Elements })), { ssr: false });
const CardElement = dynamic(() => import('@stripe/react-stripe-js').then(mod => ({ default: mod.CardElement })), { ssr: false });

interface BillingData {
  subscription: {
    planName: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
    nextBillingAmount: number;
    monthlyPhotoDownloads: number;
    monthlyVideoDownloads: number;
    monthlyAlerts: number;
  };
  plan: {
    maxPhotoDownloads: number;
    maxVideoDownloads: number;
    maxAlerts: number;
    unlimitedDownloads: boolean;
    premiumAlerts: boolean;
    aiInsights: boolean;
  };
  paymentMethods: Array<{
    id: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    status: string;
    description: string;
    createdAt: string;
  }>;
}



// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Real Stripe Payment Method Form Component
function StripePaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // This will be set when Stripe loads
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);

  useEffect(() => {
    // Initialize setup intent when component mounts
    createSetupIntent();
  }, []);

  const createSetupIntent = async () => {
    try {
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } else {
        setError('Failed to initialize payment method setup');
      }
    } catch (error) {
      setError('Error setting up payment method');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement('card');
      
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment method setup failed');
      } else if (setupIntent) {
        // Attach the payment method to the customer
        const attachResponse = await fetch('/api/stripe/payment-methods/attach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setupIntentId: setupIntent.id,
            setAsDefault: true
          }),
        });

        if (attachResponse.ok) {
          onSuccess();
        } else {
          const errorData = await attachResponse.json();
          setError(errorData.error || 'Failed to save payment method');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {clientSecret && (
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#0570de',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '6px',
              }
            }
          }}
        >
          <PaymentForm 
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onCancel={onCancel}
            onStripeLoad={setStripe}
            onElementsLoad={setElements}
          />
        </Elements>
      )}
      
      {!clientSecret && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Setting up payment method...</span>
        </div>
      )}
    </div>
  );
}

// Inner form component that has access to Stripe context
function PaymentForm({ 
  onSubmit, 
  loading, 
  error, 
  onCancel,
  onStripeLoad,
  onElementsLoad
}: { 
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onStripeLoad: (stripe: any) => void;
  onElementsLoad: (elements: any) => void;
}) {
  useEffect(() => {
    const loadStripeHooks = async () => {
      try {
        const stripeReact = await import('@stripe/react-stripe-js');
        const stripe = stripeReact.useStripe();
        const elements = stripeReact.useElements();
        
        if (stripe) onStripeLoad(stripe);
        if (elements) onElementsLoad(elements);
      } catch (error) {
        console.error('Error loading Stripe hooks:', error);
      }
    };

    loadStripeHooks();
  }, [onStripeLoad, onElementsLoad]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Add Payment Method
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function BillingDashboard() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethodLoading, setPaymentMethodLoading] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/stripe/subscription/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBillingData(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch billing data:', errorData);
        
        // Show user-friendly error
        if (response.status === 404) {
          console.log('No subscription found for this user');
          setBillingData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleCancelSubscription = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.'
    );
    
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately: false }),
      });

      if (response.ok) {
        await fetchBillingData();
        alert('Your subscription has been scheduled for cancellation at the end of the current billing period.');
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel subscription: ${errorData.error}`);
      }
    } catch (error) {
      alert('Error canceling subscription. Please try again.');
      console.error('Error canceling subscription:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (current: number, max: number) => {
    const percentage = max === -1 ? 0 : (current / max) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Unable to load billing information</AlertDescription>
      </Alert>
    );
  }

  const { subscription, plan, paymentMethods, transactions } = billingData;

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {subscription.planName}
              </CardTitle>
              <CardDescription>
                Current subscription period
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Trial ends on {format(new Date(subscription.trialEnd), 'MMM dd, yyyy')}
              </AlertDescription>
            </Alert>
          )}

          {subscription.cancelAtPeriodEnd && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Subscription will cancel on {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="font-medium">
                {format(new Date(subscription.currentPeriodStart), 'MMM dd')} - {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Billing</p>
              <p className="font-medium">
                ${subscription.nextBillingAmount} on {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">

            {!subscription.cancelAtPeriodEnd && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelSubscription}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              Photo Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{subscription.monthlyPhotoDownloads}</span>
                <span className="text-gray-500">
                  {plan.maxPhotoDownloads === -1 ? 'Unlimited' : `of ${plan.maxPhotoDownloads}`}
                </span>
              </div>
              {plan.maxPhotoDownloads !== -1 && (
                <Progress 
                  value={(subscription.monthlyPhotoDownloads / plan.maxPhotoDownloads) * 100}
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Video Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{subscription.monthlyVideoDownloads}</span>
                <span className="text-gray-500">
                  {plan.maxVideoDownloads === -1 ? 'Unlimited' : `of ${plan.maxVideoDownloads}`}
                </span>
              </div>
              {plan.maxVideoDownloads !== -1 && (
                <Progress 
                  value={(subscription.monthlyVideoDownloads / plan.maxVideoDownloads) * 100}
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alerts Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{subscription.monthlyAlerts}</span>
                <span className="text-gray-500">
                  {plan.maxAlerts === -1 ? 'Unlimited' : `of ${plan.maxAlerts}`}
                </span>
              </div>
              {plan.maxAlerts !== -1 && (
                <Progress 
                  value={(subscription.monthlyAlerts / plan.maxAlerts) * 100}
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPaymentDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your recent billing history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.status === 'SUCCEEDED' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${transaction.amount}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {transaction.status.toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Add Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method to your account
            </DialogDescription>
          </DialogHeader>
          <StripePaymentMethodForm
            onSuccess={() => {
              setShowPaymentDialog(false);
              fetchBillingData(); // Refresh payment methods
            }}
            onCancel={() => setShowPaymentDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
