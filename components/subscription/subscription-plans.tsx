
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Star, Crown, Infinity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  planType: string;
  price: number;
  yearlyPrice: number | null;
  lifetimePrice: number | null;
  stripePriceId: string | null;
  stripeYearlyPriceId: string | null;
  stripeLifetimePriceId: string | null;
  currency: string;
  trialDays: number;
  maxChildren: number;
  maxPhotoDownloads: number;
  maxVideoDownloads: number;
  unlimitedDownloads: boolean;
  premiumAlerts: boolean;
  aiInsights: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  biometricFeatures: boolean;
  realTimeTracking: boolean;
  emergencyFeatures: boolean;
  familySharing: boolean;
}

interface SubscriptionPlansProps {
  onSelectPlan?: (stripePriceId: string, billingInterval: 'monthly' | 'yearly' | 'lifetime', planId: string) => void;
  currentPlanId?: string;
  loading?: boolean;
  hasActiveSubscription?: boolean; // New prop to determine if user has any subscription
}

export default function SubscriptionPlans({ onSelectPlan, currentPlanId, loading = false, hasActiveSubscription = false }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/stripe/plans-fixed');
      const data = await response.json();
      if (data.plans) {
        // FIXED: Sort plans by price (ascending) - Basic, Premium, Family, Lifetime
        const sortedPlans = data.plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) => {
          // Handle lifetime plans separately - put them at the end
          if (a.planType === 'LIFETIME' && b.planType !== 'LIFETIME') return 1;
          if (b.planType === 'LIFETIME' && a.planType !== 'LIFETIME') return -1;
          if (a.planType === 'LIFETIME' && b.planType === 'LIFETIME') {
            return (a.lifetimePrice || 0) - (b.lifetimePrice || 0);
          }
          
          // For non-lifetime plans, sort by monthly price
          return a.price - b.price;
        });
        
        console.log('📋 Plans sorted by price:', sortedPlans.map((p: SubscriptionPlan) => `${p.name}: $${p.planType === 'LIFETIME' ? p.lifetimePrice : p.price}`));
        setPlans(sortedPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'BASIC':
        return <Zap className="w-6 h-6 text-blue-500" />;
      case 'PREMIUM':
        return <Star className="w-6 h-6 text-purple-500" />;
      case 'FAMILY':
        return <Crown className="w-6 h-6 text-gold-500" />;
      case 'LIFETIME':
        return <Infinity className="w-6 h-6 text-green-500" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'BASIC':
        return 'border-blue-200 hover:border-blue-300';
      case 'PREMIUM':
        return 'border-purple-200 hover:border-purple-300 ring-2 ring-purple-100';
      case 'FAMILY':
        return 'border-yellow-200 hover:border-yellow-300';
      case 'LIFETIME':
        return 'border-green-200 hover:border-green-300';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  const formatPrice = (plan: SubscriptionPlan, interval: 'monthly' | 'yearly' | 'lifetime') => {
    if (interval === 'lifetime' && plan.lifetimePrice) {
      return `$${plan.lifetimePrice}`;
    }
    if (interval === 'yearly' && plan.yearlyPrice) {
      return `$${plan.yearlyPrice}`;
    }
    return `$${plan.price}`;
  };

  const getFeatures = (plan: SubscriptionPlan) => {
    const features = [
      `${plan.maxChildren === -1 ? 'Unlimited' : plan.maxChildren} children`,
      `${plan.maxPhotoDownloads === -1 ? 'Unlimited' : plan.maxPhotoDownloads} photo downloads/month`,
      `${plan.maxVideoDownloads === -1 ? 'Unlimited' : plan.maxVideoDownloads} video downloads/month`,
      'Basic safety alerts',
      plan.biometricFeatures && 'Biometric features',
      plan.realTimeTracking && 'Real-time tracking',
      plan.emergencyFeatures && 'Emergency features',
      plan.premiumAlerts && 'Premium alerts',
      plan.aiInsights && 'AI insights',
      plan.advancedAnalytics && 'Advanced analytics',
      plan.familySharing && 'Family sharing',
      plan.prioritySupport && 'Priority support',
      plan.unlimitedDownloads && 'Unlimited downloads',
    ].filter(Boolean) as string[];

    return features;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="w-6 h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full h-10 bg-gray-200 rounded"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle for non-lifetime plans */}
      <div className="text-center">
        <Tabs value={billingInterval} onValueChange={(value) => setBillingInterval(value as 'monthly' | 'yearly')}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative h-full transition-all duration-200 ${getPlanColor(plan.planType)} ${
              currentPlanId === plan.id ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
            }`}>
              {currentPlanId === plan.id && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                </div>
              )}
              {plan.planType === 'PREMIUM' && currentPlanId !== plan.id && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getPlanIcon(plan.planType)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="text-center">
                  {plan.planType === 'LIFETIME' ? (
                    <div>
                      <div className="text-3xl font-bold">
                        {formatPrice(plan, 'lifetime')}
                      </div>
                      <div className="text-sm text-gray-500">one-time</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold">
                        {formatPrice(plan, billingInterval)}
                      </div>
                      <div className="text-sm text-gray-500">
                        per {billingInterval === 'yearly' ? 'year' : 'month'}
                      </div>
                      {billingInterval === 'yearly' && plan.yearlyPrice && plan.price && (
                        <div className="text-xs text-green-600">
                          Save ${(plan.price * 12 - plan.yearlyPrice).toFixed(2)} per year
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Trial */}
                {plan.trialDays > 0 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {plan.trialDays} day free trial
                    </Badge>
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  {getFeatures(plan).slice(0, 6).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {getFeatures(plan).length > 6 && (
                    <li className="text-gray-500">
                      +{getFeatures(plan).length - 6} more features
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto">
                <Button
                  className={`w-full ${currentPlanId === plan.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                  variant={currentPlanId === plan.id ? 'secondary' : plan.planType === 'PREMIUM' ? 'default' : 'outline'}
                  disabled={loading || currentPlanId === plan.id}
                  onClick={() => {
                    if (onSelectPlan && currentPlanId !== plan.id) {
                      const interval = plan.planType === 'LIFETIME' ? 'lifetime' : billingInterval;
                      
                      // Get the correct Stripe price ID based on billing interval
                      let stripePriceId: string | null = null;
                      if (interval === 'monthly') {
                        stripePriceId = plan.stripePriceId;
                      } else if (interval === 'yearly') {
                        stripePriceId = plan.stripeYearlyPriceId;
                      } else if (interval === 'lifetime') {
                        stripePriceId = plan.stripeLifetimePriceId;
                      }
                      
                      console.log('🔍 SubscriptionPlans: Plan selected', { 
                        planId: plan.id, 
                        planName: plan.name,
                        planType: plan.planType,
                        interval: interval,
                        stripePriceId: stripePriceId,
                        currentPlanId: currentPlanId,
                        hasActiveSubscription: hasActiveSubscription
                      });
                      
                      if (!stripePriceId) {
                        console.error('❌ SubscriptionPlans: No Stripe price ID found for plan:', {
                          planId: plan.id,
                          interval: interval,
                          availablePriceIds: {
                            monthly: plan.stripePriceId,
                            yearly: plan.stripeYearlyPriceId,
                            lifetime: plan.stripeLifetimePriceId
                          }
                        });
                        return;
                      }
                      
                      onSelectPlan(stripePriceId, interval, plan.id);
                    }
                  }}
                >
                  {loading ? 'Processing...' : 
                   currentPlanId === plan.id ? '✓ Current Plan' : 
                   plan.planType === 'LIFETIME' ? 'Buy Once' : 
                   hasActiveSubscription ? 'Change to This Plan' : 'Choose this Plan'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-center mb-8">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-4 min-w-[120px]">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Children', getValue: (p: SubscriptionPlan) => p.maxChildren === -1 ? 'Unlimited' : p.maxChildren },
                { label: 'Photo Downloads', getValue: (p: SubscriptionPlan) => p.maxPhotoDownloads === -1 ? 'Unlimited' : `${p.maxPhotoDownloads}/month` },
                { label: 'Video Downloads', getValue: (p: SubscriptionPlan) => p.maxVideoDownloads === -1 ? 'Unlimited' : `${p.maxVideoDownloads}/month` },
                { label: 'Premium Alerts', getValue: (p: SubscriptionPlan) => p.premiumAlerts },
                { label: 'AI Insights', getValue: (p: SubscriptionPlan) => p.aiInsights },
                { label: 'Advanced Analytics', getValue: (p: SubscriptionPlan) => p.advancedAnalytics },
                { label: 'Family Sharing', getValue: (p: SubscriptionPlan) => p.familySharing },
                { label: 'Priority Support', getValue: (p: SubscriptionPlan) => p.prioritySupport },
              ].map((feature, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{feature.label}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {typeof feature.getValue(plan) === 'boolean' ? (
                        feature.getValue(plan) ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span>{feature.getValue(plan)}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
