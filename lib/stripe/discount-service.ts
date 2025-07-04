// @ts-nocheck


import { stripe, stripeConfig } from './config';

export { stripe } from './config'; // Export stripe for external access
import { prisma } from '../db';
import { 
  DiscountCode, 
  DiscountCodeUsage, 
  DiscountType, 
  DiscountCodeStatus, 
  CodeUsageStatus,
  DiscountCategory,
  SubscriptionPlanType 
} from '@prisma/client';
import Stripe from 'stripe';

export class DiscountService {
  
  // Create a Stripe coupon from a discount code
  async createStripeCoupon(discountCode: DiscountCode): Promise<Stripe.Coupon> {
    try {
      const couponData: Stripe.CouponCreateParams = {
        id: `safeplay_${discountCode.code.toLowerCase()}`,
        name: discountCode.name,
        metadata: {
          discountCodeId: discountCode.id,
          category: discountCode.category,
          safeplayCode: discountCode.code
        }
      };

      // Set discount amount based on type
      if (discountCode.discountType === DiscountType.PERCENTAGE) {
        couponData.percent_off = discountCode.discountValue;
      } else if (discountCode.discountType === DiscountType.FIXED_AMOUNT) {
        couponData.amount_off = Math.round(discountCode.discountValue * 100); // Convert to cents
        couponData.currency = 'usd';
      }

      // Set usage limits
      if (discountCode.maxUses) {
        couponData.max_redemptions = discountCode.maxUses;
      }

      // Set expiration
      if (discountCode.expiresAt) {
        couponData.redeem_by = Math.floor(discountCode.expiresAt.getTime() / 1000);
      }

      // Set duration for subscription discounts
      if (discountCode.discountType === DiscountType.FIRST_MONTH_FREE) {
        couponData.duration = 'once';
      } else if (discountCode.discountType === DiscountType.FREE_TRIAL_EXTENSION) {
        couponData.duration = 'once';
      } else {
        couponData.duration = 'once'; // Default to once unless specified
      }

      const coupon = await stripe.coupons.create(couponData);

      // Update discount code with Stripe coupon ID
      await prisma.discountCode.update({
        where: { id: discountCode.id },
        data: { stripeCouponId: coupon.id }
      });

      return coupon;
    } catch (error) {
      console.error('Error creating Stripe coupon:', error);
      throw error;
    }
  }

  // Create a Stripe promotion code (user-friendly code)
  async createStripePromotionCode(discountCode: DiscountCode): Promise<Stripe.PromotionCode> {
    try {
      if (!discountCode.stripeCouponId) {
        throw new Error('Discount code must have a Stripe coupon ID');
      }

      const promotionCodeData: Stripe.PromotionCodeCreateParams = {
        coupon: discountCode.stripeCouponId,
        code: discountCode.code,
        active: discountCode.status === DiscountCodeStatus.ACTIVE,
        max_redemptions: discountCode.maxUsesPerUser > 1 ? (discountCode.maxUses || undefined) : undefined,
        metadata: {
          discountCodeId: discountCode.id,
          category: discountCode.category
        }
      };

      // Set restrictions
      const restrictions: Stripe.PromotionCodeCreateParams.Restrictions = {};
      
      if (discountCode.minimumPurchase) {
        restrictions.minimum_amount = Math.round(discountCode.minimumPurchase * 100);
        restrictions.minimum_amount_currency = 'usd';
      }

      if (discountCode.restrictToFirstTime) {
        restrictions.first_time_transaction = true;
      }

      if (Object.keys(restrictions).length > 0) {
        promotionCodeData.restrictions = restrictions;
      }

      const promotionCode = await stripe.promotionCodes.create(promotionCodeData);

      // Update discount code with Stripe promotion code ID
      await prisma.discountCode.update({
        where: { id: discountCode.id },
        data: { stripePromotionCodeId: promotionCode.id }
      });

      return promotionCode;
    } catch (error) {
      console.error('Error creating Stripe promotion code:', error);
      throw error;
    }
  }

  // Validate a discount code
  async validateDiscountCode(
    code: string, 
    userId: string, 
    planType?: SubscriptionPlanType,
    purchaseAmount?: number
  ): Promise<{
    isValid: boolean;
    discountCode?: DiscountCode;
    reason?: string;
    discountAmount?: number;
  }> {
    try {
      // Find the discount code
      const discountCode = await prisma.discountCode.findUnique({
        where: { code: code.toUpperCase() },
        include: { usageHistory: true }
      });

      if (!discountCode) {
        return { isValid: false, reason: 'Invalid discount code' };
      }

      // Check if code is active
      if (discountCode.status !== DiscountCodeStatus.ACTIVE) {
        return { isValid: false, reason: 'Discount code is not active' };
      }

      // Check expiration
      if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
        return { isValid: false, reason: 'Discount code has expired' };
      }

      // Check start date
      if (discountCode.startsAt && new Date() < discountCode.startsAt) {
        return { isValid: false, reason: 'Discount code is not yet active' };
      }

      // Check usage limits
      if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
        return { isValid: false, reason: 'Discount code usage limit reached' };
      }

      // Check per-user usage limits
      const userUsages = discountCode.usageHistory?.filter(usage => 
        usage.userId === userId && 
        usage.usageStatus !== CodeUsageStatus.CANCELLED &&
        usage.usageStatus !== CodeUsageStatus.REFUNDED
      ).length || 0;

      if (userUsages >= discountCode.maxUsesPerUser) {
        return { isValid: false, reason: 'You have already used this discount code' };
      }

      // Check plan restrictions
      if (planType && discountCode.applicablePlans.length > 0) {
        if (!discountCode.applicablePlans.includes(planType)) {
          return { isValid: false, reason: 'Discount code is not applicable to this plan' };
        }
      }

      // Check minimum purchase amount
      if (discountCode.minimumPurchase && purchaseAmount) {
        if (purchaseAmount < discountCode.minimumPurchase) {
          return { isValid: false, reason: `Minimum purchase amount is $${discountCode.minimumPurchase}` };
        }
      }

      // Check user restrictions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true, paymentTransactions: true }
      });

      if (!user) {
        return { isValid: false, reason: 'User not found' };
      }

      // Check new user restrictions
      if (discountCode.restrictToNewUsers && user.subscription) {
        return { isValid: false, reason: 'This code is only for new users' };
      }

      // Check first-time purchase restrictions
      if (discountCode.restrictToFirstTime && user.paymentTransactions.length > 0) {
        return { isValid: false, reason: 'This code is only for first-time purchases' };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (purchaseAmount) {
        if (discountCode.discountType === DiscountType.PERCENTAGE) {
          discountAmount = (purchaseAmount * discountCode.discountValue) / 100;
        } else if (discountCode.discountType === DiscountType.FIXED_AMOUNT) {
          discountAmount = Math.min(discountCode.discountValue, purchaseAmount);
        }
      }

      return {
        isValid: true,
        discountCode,
        discountAmount
      };
    } catch (error) {
      console.error('Error validating discount code:', error);
      return { isValid: false, reason: 'Error validating discount code' };
    }
  }

  // Apply discount code to a subscription
  async applyDiscountToSubscription(
    subscriptionId: string,
    discountCodeId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const discountCode = await prisma.discountCode.findUnique({
        where: { id: discountCodeId }
      });

      if (!discountCode || !discountCode.stripeCouponId) {
        return { success: false, error: 'Invalid discount code' };
      }

      const subscription = await prisma.userSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        return { success: false, error: 'Subscription not found' };
      }

      // Apply coupon to Stripe subscription
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        discounts: [{ coupon: discountCode.stripeCouponId }]
      });

      // Record usage in database
      // Get subscription plan info
      const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscription.planId }
      });

      await this.recordDiscountUsage(discountCodeId, userId, {
        subscriptionId: subscription.id,
        planType: subscriptionPlan?.planType as any
      });

      return { success: true };
    } catch (error) {
      console.error('Error applying discount to subscription:', error);
      return { success: false, error: 'Failed to apply discount' };
    }
  }

  // Record discount code usage
  async recordDiscountUsage(
    discountCodeId: string,
    userId: string,
    options: {
      subscriptionId?: string;
      transactionId?: string;
      orderId?: string;
      originalAmount?: number;
      discountAmount?: number;
      finalAmount?: number;
      planType?: SubscriptionPlanType;
      venueId?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<DiscountCodeUsage> {
    try {
      const discountCode = await prisma.discountCode.findUnique({
        where: { id: discountCodeId }
      });

      if (!discountCode) {
        throw new Error('Discount code not found');
      }

      // Create usage record
      const usage = await prisma.discountCodeUsage.create({
        data: {
          discountCodeId,
          userId,
          code: discountCode.code,
          usageStatus: CodeUsageStatus.APPLIED,
          subscriptionId: options.subscriptionId,
          transactionId: options.transactionId,
          orderId: options.orderId,
          originalAmount: options.originalAmount || 0,
          discountAmount: options.discountAmount || 0,
          finalAmount: options.finalAmount || 0,
          planType: options.planType,
          venueId: options.venueId,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          appliedAt: new Date()
        }
      });

      // Update discount code usage count
      await prisma.discountCode.update({
        where: { id: discountCodeId },
        data: {
          currentUses: { increment: 1 },
          clickCount: { increment: 1 }
        }
      });

      return usage;
    } catch (error) {
      console.error('Error recording discount usage:', error);
      throw error;
    }
  }

  // Get discount codes by category
  async getDiscountCodesByCategory(category: DiscountCategory): Promise<DiscountCode[]> {
    return prisma.discountCode.findMany({
      where: {
        category,
        status: DiscountCodeStatus.ACTIVE,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get active discount codes for a user
  async getActiveDiscountCodesForUser(userId: string): Promise<DiscountCode[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) return [];

    return prisma.discountCode.findMany({
      where: {
        status: DiscountCodeStatus.ACTIVE,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
        AND: [
          // Check user role restrictions
          {
            OR: [
              { allowedUserRoles: { isEmpty: true } },
              { allowedUserRoles: { has: user.role } }
            ]
          },
          // Check new user restrictions
          {
            OR: [
              { restrictToNewUsers: false },
              { 
                AND: [
                  { restrictToNewUsers: true },
                  user.subscription ? {} : {} // Allow if no subscription exists
                ]
              }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Auto-apply eligible discount codes
  async autoApplyDiscountCodes(
    userId: string,
    planType: SubscriptionPlanType,
    purchaseAmount: number
  ): Promise<DiscountCode[]> {
    const eligibleCodes = await prisma.discountCode.findMany({
      where: {
        status: DiscountCodeStatus.ACTIVE,
        application: 'AUTOMATIC',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
        AND: [
          {
            OR: [
              { applicablePlans: { isEmpty: true } },
              { applicablePlans: { has: planType } }
            ]
          },
          {
            OR: [
              { minimumPurchase: null },
              { minimumPurchase: { lte: purchaseAmount } }
            ]
          }
        ]
      },
      orderBy: { autoApplyPriority: 'asc' }
    });

    const validCodes: DiscountCode[] = [];

    for (const code of eligibleCodes) {
      const validation = await this.validateDiscountCode(
        code.code,
        userId,
        planType,
        purchaseAmount
      );

      if (validation.isValid && validation.discountCode) {
        validCodes.push(validation.discountCode);
        
        // If code is not stackable, only return this one
        if (!code.isStackable) {
          break;
        }
      }
    }

    return validCodes;
  }

  // Update discount code analytics
  async updateDiscountAnalytics(discountCodeId: string): Promise<void> {
    try {
      const discountCode = await prisma.discountCode.findUnique({
        where: { id: discountCodeId },
        include: { usageHistory: true }
      });

      if (!discountCode) return;

      const usages = discountCode.usageHistory || [];
      const successfulUsages = usages.filter(u => 
        u.usageStatus === CodeUsageStatus.REDEEMED
      );

      const totalRevenue = successfulUsages.reduce((sum, usage) => 
        sum + (usage.finalAmount || 0), 0
      );

      const averageOrderValue = successfulUsages.length > 0 
        ? totalRevenue / successfulUsages.length 
        : 0;

      const conversionRate = usages.length > 0 
        ? (successfulUsages.length / usages.length) * 100 
        : 0;

      await prisma.discountCode.update({
        where: { id: discountCodeId },
        data: {
          conversionRate,
          averageOrderValue,
          actualImpact: totalRevenue
        }
      });
    } catch (error) {
      console.error('Error updating discount analytics:', error);
    }
  }
}

export const discountService = new DiscountService();

