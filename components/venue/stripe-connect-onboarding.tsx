
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';

interface ConnectStatus {
  status: string;
  requirements: any;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

interface VenueEarnings {
  totalRevenue: number;
  venueEarnings: number;
  safeplayEarnings: number;
  transactionCount: number;
  pendingPayouts: number;
}

export default function StripeConnectOnboarding() {
  const [loading, setLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [earnings, setEarnings] = useState<VenueEarnings | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    checkConnectStatus();
  }, []);

  const checkConnectStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status');
      const data = await response.json();
      
      if (response.ok) {
        setConnectStatus(data.accountStatus);
        setEarnings(data.earnings);
      }
    } catch (error) {
      console.error('Error checking Connect status:', error);
    }
  };

  const startOnboarding = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error starting onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'restricted':
        return 'bg-orange-100 text-orange-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionPercentage = () => {
    if (!connectStatus) return 0;
    if (connectStatus.chargesEnabled && connectStatus.payoutsEnabled) return 100;
    if (connectStatus.detailsSubmitted) return 75;
    if (connectStatus.status === 'pending') return 25;
    return 0;
  };

  // If not set up yet, show onboarding form
  if (!connectStatus || connectStatus.status === 'not_created') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Set Up Payment Processing
            </CardTitle>
            <CardDescription>
              Connect your Stripe account to receive revenue sharing payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                Earn revenue from photos, videos, and premium services sold at your venue. 
                Default revenue share is 30% to your venue, 70% to SafePlay.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your venue business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@yourvenue.com"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll be redirected to Stripe to verify your business</li>
                <li>• Provide tax information and bank account details</li>
                <li>• Once approved, you'll start receiving revenue sharing payments</li>
                <li>• Payments are processed weekly by default</li>
              </ul>
            </div>

            <Button 
              onClick={startOnboarding}
              disabled={loading || !businessName || !email}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Start Stripe Onboarding'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Payment Account Status
              </CardTitle>
              <CardDescription>
                Your Stripe Connect account setup progress
              </CardDescription>
            </div>
            <Badge className={getStatusColor(connectStatus.status)}>
              {connectStatus.status.charAt(0).toUpperCase() + connectStatus.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {connectStatus.detailsSubmitted ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-sm">Details Submitted</p>
                <p className="text-xs text-gray-500">
                  {connectStatus.detailsSubmitted ? 'Complete' : 'Pending'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {connectStatus.chargesEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-sm">Charges Enabled</p>
                <p className="text-xs text-gray-500">
                  {connectStatus.chargesEnabled ? 'Ready' : 'Pending approval'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {connectStatus.payoutsEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-sm">Payouts Enabled</p>
                <p className="text-xs text-gray-500">
                  {connectStatus.payoutsEnabled ? 'Active' : 'Pending setup'}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {connectStatus.requirements?.currently_due?.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Action Required:</p>
                  <ul className="text-sm space-y-1">
                    {connectStatus.requirements.currently_due.map((req: string, idx: number) => (
                      <li key={idx}>• {req.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!connectStatus.chargesEnabled && (
              <Button onClick={startOnboarding} disabled={loading}>
                Complete Setup
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Button variant="outline" onClick={checkConnectStatus}>
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      {earnings && connectStatus.chargesEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue Summary
            </CardTitle>
            <CardDescription>
              Your earnings from SafePlay revenue sharing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${earnings.venueEarnings.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Your Earnings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  ${earnings.totalRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {earnings.transactionCount}
                </p>
                <p className="text-sm text-gray-500">Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  ${earnings.pendingPayouts.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Pending Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Data Security</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PCI DSS compliant payment processing</li>
                <li>• Bank-level encryption for all transactions</li>
                <li>• Secure data transmission via TLS 1.2+</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Compliance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• SOC 2 Type II certified infrastructure</li>
                <li>• Regular security audits and monitoring</li>
                <li>• GDPR and CCPA compliant data handling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
