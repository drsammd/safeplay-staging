
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Updated subscription plans with FREE plan (v1.5.0)
    const plans = [
      {
        id: 'free',
        name: 'Free Plan',
        description: 'Get started with basic safety features - No credit card required!',
        planType: 'FREE',
        price: 0,
        yearlyPrice: 0,
        lifetimePrice: null,
        stripePriceId: null, // No Stripe price ID needed - bypass payment
        stripeYearlyPriceId: null,
        stripeLifetimePriceId: null,
        currency: 'USD',
        trialDays: 0, // No trial needed for free plan
        maxChildren: 1,
        maxPhotoDownloads: 1, // 1 photo per month
        maxVideoDownloads: 1, // 1 video per month
        unlimitedDownloads: false,
        premiumAlerts: false,
        aiInsights: false,
        prioritySupport: false,
        advancedAnalytics: false,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: false,
        // v1.5.0 - New FREE plan features
        basicSafety: true,
        emailSupport: true,
        allSafetyFeatures: false,
        priorityEmailSupport: false,
        archiveAccess: false,
        customBranding: false,
        phoneSupport: false,
        premiumFeatures: false,
        isActive: true,
        displayOrder: 0
      },
      {
        id: 'basic',
        name: 'Basic Plan', // Renamed from "Starter"
        description: 'Perfect for families with up to 2 children',
        planType: 'BASIC',
        price: 9.99,
        yearlyPrice: 99.99,
        lifetimePrice: null,
        stripePriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_1RjxePC2961Zxi3Wku9h51bx',
        stripeYearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_1RjxePC2961Zxi3W1DWonzM2',
        stripeLifetimePriceId: null,
        currency: 'USD',
        trialDays: 7,
        maxChildren: 2,
        maxPhotoDownloads: 5, // Updated: 5 photos per month
        maxVideoDownloads: 3, // Updated: 3 videos per month
        unlimitedDownloads: false,
        premiumAlerts: false,
        aiInsights: false,
        prioritySupport: false,
        advancedAnalytics: false,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: false,
        // v1.5.0 - New Basic plan features
        basicSafety: true,
        emailSupport: true,
        allSafetyFeatures: true,
        priorityEmailSupport: true,
        archiveAccess: true,
        customBranding: false,
        phoneSupport: false,
        premiumFeatures: false,
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'premium',
        name: 'Premium Plan', // Renamed from "Professional"
        description: 'Enhanced features for active families',
        planType: 'PREMIUM',
        price: 19.99,
        yearlyPrice: 199.99,
        lifetimePrice: null,
        stripePriceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_1RjxeQC2961Zxi3WYMyCkKBk',
        stripeYearlyPriceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || 'price_1RjxeQC2961Zxi3WJiOiKaME',
        stripeLifetimePriceId: null,
        currency: 'USD',
        trialDays: 7,
        maxChildren: 3,
        maxPhotoDownloads: 10, // Updated: 10 photos per month
        maxVideoDownloads: 6, // Updated: 6 videos per month
        unlimitedDownloads: false,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: false,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        // v1.5.0 - New Premium plan features
        basicSafety: true,
        emailSupport: true,
        allSafetyFeatures: true,
        priorityEmailSupport: true,
        archiveAccess: true,
        customBranding: true,
        phoneSupport: false,
        premiumFeatures: false,
        isActive: true,
        displayOrder: 2
      },
      {
        id: 'family',
        name: 'Family Plan', // Renamed from "Enterprise"
        description: 'Unlimited access for large families',
        planType: 'FAMILY',
        price: 29.99,
        yearlyPrice: 299.99,
        lifetimePrice: null,
        stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_1RjxeRC2961Zxi3WbYHieRfm',
        stripeYearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_1RjxeRC2961Zxi3WiuHVSCVe',
        stripeLifetimePriceId: null,
        currency: 'USD',
        trialDays: 7,
        maxChildren: -1, // Unlimited
        maxPhotoDownloads: -1, // Unlimited
        maxVideoDownloads: -1, // Unlimited
        unlimitedDownloads: true,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: true,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        // v1.5.0 - New Family plan features
        basicSafety: true,
        emailSupport: true,
        allSafetyFeatures: true,
        priorityEmailSupport: true,
        archiveAccess: true,
        customBranding: true,
        phoneSupport: true,
        premiumFeatures: true,
        isActive: true,
        displayOrder: 3
      }
    ];

    console.log('📋 Returning subscription plans with real Stripe price IDs:', plans.map(p => `${p.name}: ${p.stripePriceId} (monthly), ${p.stripeYearlyPriceId} (yearly)`));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
