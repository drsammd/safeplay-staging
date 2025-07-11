
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Hardcoded subscription plans since SubscriptionPlan model doesn't exist
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Perfect for small families',
        planType: 'BASIC',
        price: 9.99,
        yearlyPrice: 99.99,
        lifetimePrice: null,
        stripePriceId: 'price_basic_monthly',
        stripeYearlyPriceId: 'price_basic_yearly',
        stripeLifetimePriceId: null,
        currency: 'USD',
        trialDays: 14,
        maxChildren: 2,
        maxPhotoDownloads: 50,
        maxVideoDownloads: 10,
        unlimitedDownloads: false,
        premiumAlerts: false,
        aiInsights: false,
        prioritySupport: false,
        advancedAnalytics: false,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: false,
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Most popular choice for families',
        planType: 'PREMIUM',
        price: 19.99,
        yearlyPrice: 199.99,
        lifetimePrice: null,
        stripePriceId: 'price_premium_monthly',
        stripeYearlyPriceId: 'price_premium_yearly',
        stripeLifetimePriceId: null,
        currency: 'USD',
        trialDays: 14,
        maxChildren: 5,
        maxPhotoDownloads: 200,
        maxVideoDownloads: 50,
        unlimitedDownloads: false,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: true,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        isActive: true,
        displayOrder: 2
      },
      {
        id: 'family',
        name: 'Family',
        description: 'Unlimited access for large families',
        planType: 'FAMILY',
        price: 29.99,
        yearlyPrice: 299.99,
        lifetimePrice: null,
        stripePriceId: 'price_family_monthly',
        stripeYearlyPriceId: 'price_family_yearly',
        stripeLifetimePriceId: null,
        currency: 'USD',
        trialDays: 14,
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
        isActive: true,
        displayOrder: 3
      },
      {
        id: 'lifetime',
        name: 'Lifetime',
        description: 'One-time payment, lifetime access',
        planType: 'LIFETIME',
        price: 0,
        yearlyPrice: null,
        lifetimePrice: 499.99,
        stripePriceId: null,
        stripeYearlyPriceId: null,
        stripeLifetimePriceId: 'price_lifetime_onetime',
        currency: 'USD',
        trialDays: 0,
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
        isActive: true,
        displayOrder: 4
      }
    ];

    console.log('📋 Returning subscription plans:', plans.map(p => `${p.name}: $${p.planType === 'LIFETIME' ? p.lifetimePrice : p.price}`));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
