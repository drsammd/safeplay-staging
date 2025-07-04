// @ts-nocheck

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// Stripe configuration
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  connectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  currency: 'usd',
  
  // Test mode configuration
  testMode: process.env.NODE_ENV !== 'production',
  
  // Connect settings
  connect: {
    refreshUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/venue-admin`,
    returnUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/venue-admin/payment-setup/complete`,
  },
  
  // Subscription settings
  subscription: {
    trialDays: 7,
    defaultBillingInterval: 'month' as const,
  },
  
  // Revenue sharing settings
  revenueSharing: {
    defaultVenuePercentage: 30, // 30% to venue, 70% to SafePlay
    minimumPayoutAmount: 25.00,
    defaultPayoutSchedule: 'weekly' as const,
  }
};

// Subscription plan configurations (will be created in Stripe)
export const subscriptionPlans = {
  basic: {
    name: 'Basic Plan',
    description: 'Perfect for families with 1-2 children',
    monthlyPriceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
    features: {
      maxChildren: 2,
      maxPhotoDownloads: 25,
      maxVideoDownloads: 10,
      basicAlerts: true,
      premiumAlerts: false,
      aiInsights: false,
      prioritySupport: false,
    }
  },
  premium: {
    name: 'Premium Plan', 
    description: 'Enhanced features for active families',
    monthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    features: {
      maxChildren: 5,
      maxPhotoDownloads: 100,
      maxVideoDownloads: 50,
      basicAlerts: true,
      premiumAlerts: true,
      aiInsights: true,
      prioritySupport: false,
    }
  },
  family: {
    name: 'Family Plan',
    description: 'Unlimited access for large families',
    monthlyPriceId: process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_FAMILY_YEARLY_PRICE_ID,
    features: {
      maxChildren: -1, // unlimited
      maxPhotoDownloads: -1, // unlimited
      maxVideoDownloads: -1, // unlimited
      basicAlerts: true,
      premiumAlerts: true,
      aiInsights: true,
      prioritySupport: true,
    }
  },
  lifetime: {
    name: 'Lifetime Plan',
    description: 'One-time payment for lifetime access',
    lifetimePriceId: process.env.STRIPE_LIFETIME_PRICE_ID,
    features: {
      maxChildren: -1, // unlimited
      maxPhotoDownloads: -1, // unlimited
      maxVideoDownloads: -1, // unlimited
      basicAlerts: true,
      premiumAlerts: true,
      aiInsights: true,
      prioritySupport: true,
      advancedAnalytics: true,
    }
  }
};

export type StripeConfig = typeof stripeConfig;
export type SubscriptionPlan = typeof subscriptionPlans[keyof typeof subscriptionPlans];
