// @ts-nocheck

import { config } from 'dotenv';
import { PrismaClient, SubscriptionPlanType, BillingInterval } from '@prisma/client';

// Load environment variables
config();

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  try {
    // Create Basic Plan
    await prisma.subscriptionPlan.upsert({
      where: { name: 'Basic Plan' },
      update: {
        trialDays: 7, // Ensure 7-day trial
      },
      create: {
        name: 'Basic Plan',
        description: 'Perfect for families with 1-2 children. Essential safety features included.',
        planType: SubscriptionPlanType.BASIC,
        price: 9.99,
        yearlyPrice: 99.99, // 2 months free
        currency: 'USD',
        billingInterval: BillingInterval.MONTHLY,
        trialDays: 7,
        
        // Feature limits
        maxChildren: 2,
        maxVenues: 3,
        maxPhotoDownloads: 25,
        maxVideoDownloads: 10,
        maxMemoryStorage: 1000, // 1GB
        maxAlerts: 50,
        
        // Feature flags
        unlimitedDownloads: false,
        premiumAlerts: false,
        aiInsights: false,
        prioritySupport: false,
        customBranding: false,
        advancedAnalytics: false,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: false,
        
        isActive: true,
        displayOrder: 1,
      }
    });

    // Create Premium Plan  
    await prisma.subscriptionPlan.upsert({
      where: { name: 'Premium Plan' },
      update: {
        trialDays: 7, // Ensure 7-day trial
      },
      create: {
        name: 'Premium Plan',
        description: 'Enhanced features for active families. AI insights and premium alerts included.',
        planType: SubscriptionPlanType.PREMIUM,
        price: 19.99,
        yearlyPrice: 199.99, // 2 months free
        currency: 'USD',
        billingInterval: BillingInterval.MONTHLY,
        trialDays: 7,
        
        // Feature limits
        maxChildren: 5,
        maxVenues: 10,
        maxPhotoDownloads: 100,
        maxVideoDownloads: 50,
        maxMemoryStorage: 5000, // 5GB
        maxAlerts: 200,
        
        // Feature flags
        unlimitedDownloads: false,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: false,
        customBranding: false,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        
        isActive: true,
        displayOrder: 2,
      }
    });

    // Create Family Plan
    await prisma.subscriptionPlan.upsert({
      where: { name: 'Family Plan' },
      update: {
        trialDays: 7, // Ensure 7-day trial
      },
      create: {
        name: 'Family Plan',
        description: 'Unlimited access for large families. All features included with priority support.',
        planType: SubscriptionPlanType.FAMILY,
        price: 39.99,
        yearlyPrice: 399.99, // 2 months free
        currency: 'USD',
        billingInterval: BillingInterval.MONTHLY,
        trialDays: 7,
        
        // Feature limits (unlimited)
        maxChildren: -1,
        maxVenues: -1,
        maxPhotoDownloads: -1,
        maxVideoDownloads: -1,
        maxMemoryStorage: -1,
        maxAlerts: -1,
        
        // Feature flags (all enabled)
        unlimitedDownloads: true,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: true,
        customBranding: false,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        
        isActive: true,
        displayOrder: 3,
      }
    });

    // Create Lifetime Plan
    await prisma.subscriptionPlan.upsert({
      where: { name: 'Lifetime Plan' },
      update: {
        trialDays: 7, // Add 7-day trial to lifetime plan
      },
      create: {
        name: 'Lifetime Plan',
        description: 'One-time payment for lifetime access. All features forever with no recurring fees.',
        planType: SubscriptionPlanType.LIFETIME,
        price: 0, // No monthly price
        yearlyPrice: 0, // No yearly price
        lifetimePrice: 599.99, // One-time payment
        currency: 'USD',
        billingInterval: BillingInterval.LIFETIME,
        trialDays: 7,
        
        // Feature limits (unlimited)
        maxChildren: -1,
        maxVenues: -1,
        maxPhotoDownloads: -1,
        maxVideoDownloads: -1,
        maxMemoryStorage: -1,
        maxAlerts: -1,
        
        // Feature flags (all enabled)
        unlimitedDownloads: true,
        premiumAlerts: true,
        aiInsights: true,
        prioritySupport: true,
        customBranding: true,
        advancedAnalytics: true,
        biometricFeatures: true,
        realTimeTracking: true,
        emergencyFeatures: true,
        familySharing: true,
        
        isActive: true,
        displayOrder: 4,
      }
    });

    console.log('✅ Subscription plans seeded successfully!');
    
    // Show created plans
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log('\n📋 Created Plans:');
    plans.forEach(plan => {
      console.log(`  ${plan.name} - $${plan.price}/month (${plan.planType})`);
    });

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedSubscriptionPlans()
    .then(() => {
      console.log('🎉 Subscription plans seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Subscription plans seeding failed:', error);
      process.exit(1);
    });
}

export default seedSubscriptionPlans;
