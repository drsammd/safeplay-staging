import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSubscriptionPlans() {
  try {
    console.log('🌱 Creating subscription plans...');

    // First, let's check if the SubscriptionPlan model exists
    // Since it doesn't exist in the schema, we need to create it
    
    // For now, let's create a simple API response that returns hardcoded plans
    console.log('💡 Since SubscriptionPlan model doesn\'t exist, we\'ll create hardcoded plans in the API');
    
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

    console.log('📋 Plan data prepared:', plans.map(p => `${p.name}: $${p.planType === 'LIFETIME' ? p.lifetimePrice : p.price}`));
    console.log('✅ Plans ready for API response');
    
    return plans;

  } catch (error) {
    console.error('❌ Error creating subscription plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSubscriptionPlans().catch((error) => {
  console.error('Failed to create subscription plans:', error);
  process.exit(1);
});
