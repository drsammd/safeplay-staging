
import { PrismaClient } from '@prisma/client';
import { 
  DiscountType, 
  DiscountCategory, 
  DiscountCodeStatus,
  DiscountApplication,
  SubscriptionPlanType 
} from '@prisma/client';

const prisma = new PrismaClient();

async function seedDiscountCodes() {
  try {
    console.log('🎫 Seeding discount codes...');

    // Get the admin user to set as creator
    const adminUser = await prisma.user.findFirst({
      where: { email: 'john@doe.com' }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found. Please run the main seed script first.');
      return;
    }

    const discountCodes = [
      // Welcome discount for new users
      {
        code: 'WELCOME20',
        name: 'Welcome Discount',
        description: '20% off your first month for new SafePlay users',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        category: DiscountCategory.WELCOME,
        status: DiscountCodeStatus.ACTIVE,
        application: DiscountApplication.USER_INPUT,
        maxUses: 1000,
        maxUsesPerUser: 1,
        restrictToNewUsers: true,
        restrictToFirstTime: true,
        applicablePlans: [SubscriptionPlanType.BASIC, SubscriptionPlanType.PREMIUM, SubscriptionPlanType.FAMILY],
        campaignName: 'New User Welcome Campaign',
        notes: 'Welcome discount for first-time users',
        createdBy: adminUser.id,
        tags: ['welcome', 'new-user', 'onboarding']
      },
      
      // Summer seasonal promotion
      {
        code: 'SUMMER2024',
        name: 'Summer Safety Special',
        description: '$15 off any annual plan during summer 2024',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 15,
        category: DiscountCategory.SEASONAL,
        status: DiscountCodeStatus.ACTIVE,
        application: DiscountApplication.USER_INPUT,
        maxUses: 500,
        maxUsesPerUser: 1,
        minimumPurchase: 50,
        applicablePlans: [SubscriptionPlanType.BASIC, SubscriptionPlanType.PREMIUM, SubscriptionPlanType.FAMILY],
        campaignName: 'Summer 2024 Promotion',
        notes: 'Seasonal summer discount for annual plans',
        createdBy: adminUser.id,
        tags: ['summer', 'seasonal', 'annual'],
        expiresAt: new Date('2024-09-01')
      },

      // Loyalty program discount
      {
        code: 'LOYAL25',
        name: 'Loyalty Reward',
        description: '25% off for returning customers',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 25,
        category: DiscountCategory.LOYALTY,
        status: DiscountCodeStatus.ACTIVE,
        application: DiscountApplication.USER_INPUT,
        maxUses: 200,
        maxUsesPerUser: 2,
        restrictToNewUsers: false,
        applicablePlans: [SubscriptionPlanType.PREMIUM, SubscriptionPlanType.FAMILY],
        campaignName: 'Customer Loyalty Program',
        notes: 'Reward discount for loyal customers',
        createdBy: adminUser.id,
        tags: ['loyalty', 'retention', 'returning-customers']
      },

      // Partner promotion
      {
        code: 'PARTNER50',
        name: 'Partner Exclusive',
        description: '$50 off lifetime plan through partner referral',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 50,
        category: DiscountCategory.PARTNER,
        status: DiscountCodeStatus.ACTIVE,
        application: DiscountApplication.USER_INPUT,
        maxUses: 100,
        maxUsesPerUser: 1,
        minimumPurchase: 200,
        applicablePlans: [SubscriptionPlanType.LIFETIME],
        campaignName: 'Partner Referral Program',
        notes: 'Exclusive discount for partner referrals',
        createdBy: adminUser.id,
        tags: ['partner', 'referral', 'lifetime']
      },

      // Flash sale
      {
        code: 'FLASH30',
        name: 'Flash Sale Special',
        description: '30% off - Limited time offer!',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 30,
        category: DiscountCategory.FLASH_SALE,
        status: DiscountCodeStatus.ACTIVE,
        application: DiscountApplication.USER_INPUT,
        maxUses: 50,
        maxUsesPerUser: 1,
        isTimeSensitive: true,
        applicablePlans: [SubscriptionPlanType.BASIC, SubscriptionPlanType.PREMIUM],
        campaignName: 'Flash Sale Week',
        notes: 'Limited time flash sale discount',
        createdBy: adminUser.id,
        tags: ['flash-sale', 'limited-time', 'urgent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },

      // Family plan special
      {
        code: 'FAMILY40',
        name: 'Family Plan Special',
        description: '$40 off family plan for large families',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 40,
        category: DiscountCategory.MARKETING,
        status: DiscountCodeStatus.ACTIVE,
        application: DiscountApplication.USER_INPUT,
        maxUses: 200,
        maxUsesPerUser: 1,
        minimumPurchase: 100,
        applicablePlans: [SubscriptionPlanType.FAMILY],
        campaignName: 'Family Safety Initiative',
        notes: 'Special discount for family plan users',
        createdBy: adminUser.id,
        tags: ['family', 'large-families', 'special-offer']
      },

      // Test discount (inactive)
      {
        code: 'TEST10',
        name: 'Test Discount',
        description: '10% off for testing purposes',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        category: DiscountCategory.MARKETING,
        status: DiscountCodeStatus.INACTIVE,
        application: DiscountApplication.USER_INPUT,
        maxUses: 10,
        maxUsesPerUser: 1,
        applicablePlans: [SubscriptionPlanType.BASIC],
        campaignName: 'Testing Campaign',
        notes: 'Test discount code for development',
        createdBy: adminUser.id,
        tags: ['test', 'development'],
        isTest: true
      }
    ];

    for (const codeData of discountCodes) {
      try {
        const discountCode = await prisma.discountCode.create({
          data: codeData
        });
        console.log(`✅ Created discount code: ${discountCode.code} - ${discountCode.name}`);
      } catch (error) {
        console.error(`❌ Error creating discount code ${codeData.code}:`, error);
      }
    }

    console.log('🎉 Discount codes seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding discount codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDiscountCodes();

