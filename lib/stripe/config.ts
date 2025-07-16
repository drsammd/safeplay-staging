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

// Subscription plan configurations (v1.5.0 - Updated with FREE plan and renamed plans)
export const subscriptionPlans = {
  free: {
    name: 'Free Plan',
    description: 'Get started with basic safety features - No credit card required!',
    price: 0,
    monthlyPriceId: null, // No Stripe price ID needed - bypass payment
    yearlyPriceId: null,
    features: {
      maxChildren: 1,
      maxPhotoDownloads: 1, // 1 photo per month
      maxVideoDownloads: 1, // 1 video per month
      basicAlerts: true,
      realTimeTracking: true,
      basicSafety: true,
      emailSupport: true,
      premiumAlerts: false,
      aiInsights: false,
      prioritySupport: false,
      advancedAnalytics: false,
    }
  },
  basic: {
    name: 'Basic Plan', // Renamed from "Starter Plan"
    description: 'Perfect for families with up to 2 children',
    price: 9.99,
    monthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    features: {
      maxChildren: 2,
      maxPhotoDownloads: 5, // 5 photos per month
      maxVideoDownloads: 3, // 3 videos per month
      basicAlerts: true,
      realTimeTracking: true,
      allSafetyFeatures: true,
      priorityEmailSupport: true,
      archiveAccess: true,
      premiumAlerts: false,
      aiInsights: false,
      prioritySupport: false,
      advancedAnalytics: false,
    }
  },
  premium: {
    name: 'Premium Plan', // Renamed from "Professional Plan"
    description: 'Enhanced features for active families',
    price: 19.99,
    monthlyPriceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
    features: {
      maxChildren: 5,
      maxPhotoDownloads: 10, // 10 photos per month
      maxVideoDownloads: 6, // 6 videos per month
      basicAlerts: true,
      realTimeTracking: true,
      allSafetyFeatures: true,
      premiumAlerts: true,
      aiInsights: true,
      advancedAnalytics: true,
      customBranding: true,
      prioritySupport: false,
    }
  },
  family: {
    name: 'Family Plan', // Renamed from "Enterprise Plan"
    description: 'Unlimited access for large families',
    price: 29.99,
    monthlyPriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
    features: {
      maxChildren: -1, // unlimited
      maxPhotoDownloads: -1, // unlimited
      maxVideoDownloads: -1, // unlimited
      basicAlerts: true,
      realTimeTracking: true,
      allSafetyFeatures: true,
      premiumAlerts: true,
      aiInsights: true,
      advancedAnalytics: true,
      customBranding: true,
      prioritySupport: true,
      phoneSupport: true,
      premiumFeatures: true,
    }
  }
};

// Individual Purchase Configurations (v1.5.0)
export const individualPurchases = {
  photo: {
    name: 'Individual Photo',
    description: 'Download a single photo',
    price: 0.99,
    priceId: process.env.STRIPE_INDIVIDUAL_PHOTO_PRICE_ID,
    type: 'PHOTO'
  },
  video: {
    name: 'Individual Video Montage',
    description: 'Download a single video montage',
    price: 2.99,
    priceId: process.env.STRIPE_INDIVIDUAL_VIDEO_PRICE_ID,
    type: 'VIDEO_MONTAGE'
  }
};

// Photo/Video Pack Configurations (v1.5.0)
export const photoVideoPacks = {
  pack1: {
    name: 'Starter Pack',
    description: '5 photos + 3 video montages',
    price: 9.99,
    priceId: process.env.STRIPE_PACK_1_PRICE_ID,
    photoCredits: 5,
    videoCredits: 3,
    packType: 'PACK_1'
  },
  pack2: {
    name: 'Family Pack',
    description: '10 photos + 5 video montages',
    price: 19.99,
    priceId: process.env.STRIPE_PACK_2_PRICE_ID,
    photoCredits: 10,
    videoCredits: 5,
    packType: 'PACK_2'
  },
  pack3: {
    name: 'Premium Pack',
    description: '20 photos + 10 video montages',
    price: 29.99,
    priceId: process.env.STRIPE_PACK_3_PRICE_ID,
    photoCredits: 20,
    videoCredits: 10,
    packType: 'PACK_3'
  }
};

export type StripeConfig = typeof stripeConfig;
export type SubscriptionPlan = typeof subscriptionPlans[keyof typeof subscriptionPlans];
