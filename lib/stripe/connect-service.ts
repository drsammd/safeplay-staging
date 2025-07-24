// @ts-nocheck

import { stripe, stripeConfig } from './config';
import { prisma } from '../db';
import { StripeAccountStatus, PayoutSchedule } from '@prisma/client';

export class ConnectService {
  
  // Create Stripe Connect account for venue
  async createConnectAccount(venueId: string, email: string, businessName: string) {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: { admin: true }
      });

      if (!venue) {
        throw new Error('Venue not found');
      }

      // Create Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        business_type: 'company',
        company: {
          name: businessName,
        },
        metadata: {
          venueId,
          adminId: venue.adminId,
          platform: 'safeplay'
        }
      });

      // CRITICAL v1.5.40-alpha.17 EMERGENCY FIX: Replace problematic upsert with explicit create/update
      // This prevents foreign key constraint violations during venue payment setup
      console.log('🚨 EMERGENCY FIX v1.5.40-alpha.17: Using explicit create/update for venue payment settings instead of problematic upsert');
      
      const existingSettings = await prisma.venuePaymentSettings.findUnique({
        where: { venueId }
      });
      
      if (existingSettings) {
        // Update existing venue payment settings
        await prisma.venuePaymentSettings.update({
          where: { venueId },
          data: {
            stripeConnectAccountId: account.id,
            stripeAccountStatus: StripeAccountStatus.PENDING,
          }
        });
      } else {
        // Create new venue payment settings only if venue exists
        const venueExists = await prisma.venue.findUnique({
          where: { id: venueId }
        });
        
        if (venueExists) {
          await prisma.venuePaymentSettings.create({
            data: {
              venueId,
              stripeConnectAccountId: account.id,
              stripeAccountStatus: StripeAccountStatus.PENDING,
              revenuePercentage: stripeConfig.revenueSharing.defaultVenuePercentage,
              minimumPayoutAmount: stripeConfig.revenueSharing.minimumPayoutAmount,
              payoutSchedule: PayoutSchedule.WEEKLY,
            }
          });
        } else {
          console.error('🚨 CONNECT SERVICE ERROR: Venue not found for payment settings setup:', venueId);
          throw new Error('Venue not found for payment settings setup');
        }
      }

      return account;
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  }

  // Generate onboarding link
  async createOnboardingLink(venueId: string) {
    try {
      const paymentSettings = await prisma.venuePaymentSettings.findUnique({
        where: { venueId }
      });

      if (!paymentSettings?.stripeConnectAccountId) {
        throw new Error('No Stripe Connect account found for venue');
      }

      const accountLink = await stripe.accountLinks.create({
        account: paymentSettings.stripeConnectAccountId,
        refresh_url: stripeConfig.connect.refreshUrl,
        return_url: stripeConfig.connect.returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw error;
    }
  }

  // Check account status
  async checkAccountStatus(venueId: string) {
    try {
      const paymentSettings = await prisma.venuePaymentSettings.findUnique({
        where: { venueId }
      });

      if (!paymentSettings?.stripeConnectAccountId) {
        return { status: 'not_created', requirements: [] };
      }

      const account = await stripe.accounts.retrieve(paymentSettings.stripeConnectAccountId);
      
      // Update database with current status
      const status = this.mapStripeAccountStatus(account);
      await prisma.venuePaymentSettings.update({
        where: { venueId },
        data: {
          stripeAccountStatus: status,
          stripeOnboardingComplete: account.details_submitted && account.charges_enabled,
          stripeRequirements: account.requirements as any,
          taxIdProvided: account.requirements?.currently_due?.includes('business_tax_id') === false,
          businessVerified: account.business_profile?.support_email ? true : false,
          identityVerified: account.individual?.verification?.status === 'verified',
        }
      });

      return {
        status: account.charges_enabled ? 'enabled' : 'pending',
        requirements: account.requirements,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      throw error;
    }
  }

  // Create revenue sharing transfer
  async createRevenueTransfer(venueId: string, totalAmount: number, description: string) {
    try {
      const paymentSettings = await prisma.venuePaymentSettings.findUnique({
        where: { venueId }
      });

      if (!paymentSettings?.stripeConnectAccountId) {
        throw new Error('Venue does not have Stripe Connect account');
      }

      if (paymentSettings.stripeAccountStatus !== StripeAccountStatus.ENABLED) {
        throw new Error('Venue Stripe account is not enabled for transfers');
      }

      // Calculate amounts
      const venuePercentage = paymentSettings.revenuePercentage.toNumber();
      const venueAmount = Math.floor(totalAmount * (venuePercentage / 100));
      const safeplayAmount = totalAmount - venueAmount;

      // Create transfer to venue
      const transfer = await stripe.transfers.create({
        amount: venueAmount,
        currency: 'usd',
        destination: paymentSettings.stripeConnectAccountId,
        description,
        metadata: {
          venueId,
          totalAmount: totalAmount.toString(),
          venuePercentage: venuePercentage.toString(),
        }
      });

      // Record revenue transaction
      await prisma.revenueTransaction.create({
        data: {
          venueId,
          parentTransactionId: description, // This should be the actual transaction ID
          type: 'SUBSCRIPTION_REVENUE',
          status: 'COMPLETED',
          totalAmount,
          safeplayAmount,
          venueAmount,
          revenuePercentage: venuePercentage,
          stripeTransferId: transfer.id,
          description,
          processedAt: new Date(),
          transferredAt: new Date(),
        }
      });

      return transfer;
    } catch (error) {
      console.error('Error creating revenue transfer:', error);
      throw error;
    }
  }

  // Get venue earnings summary
  async getVenueEarnings(venueId: string, periodStart?: Date, periodEnd?: Date) {
    try {
      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const transactions = await prisma.revenueTransaction.findMany({
        where: {
          venueId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const summary = transactions.reduce((acc, transaction) => {
        acc.totalRevenue += transaction.totalAmount.toNumber();
        acc.venueEarnings += transaction.venueAmount.toNumber();
        acc.safeplayEarnings += transaction.safeplayAmount.toNumber();
        acc.transactionCount += 1;
        return acc;
      }, {
        totalRevenue: 0,
        venueEarnings: 0,
        safeplayEarnings: 0,
        transactionCount: 0,
      });

      // Get pending payouts
      const pendingPayouts = await prisma.payoutHistory.findMany({
        where: {
          venueId,
          status: 'PENDING',
        }
      });

      return {
        ...summary,
        pendingPayouts: pendingPayouts.reduce((sum, payout) => sum + payout.amount.toNumber(), 0),
        transactions,
      };
    } catch (error) {
      console.error('Error getting venue earnings:', error);
      throw error;
    }
  }

  // Update revenue sharing percentage (admin only)
  async updateRevenuePercentage(venueId: string, newPercentage: number) {
    try {
      if (newPercentage < 0 || newPercentage > 100) {
        throw new Error('Revenue percentage must be between 0 and 100');
      }

      await prisma.venuePaymentSettings.update({
        where: { venueId },
        data: {
          revenuePercentage: newPercentage,
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating revenue percentage:', error);
      throw error;
    }
  }

  private mapStripeAccountStatus(account: any): StripeAccountStatus {
    if (account.charges_enabled && account.payouts_enabled) {
      return StripeAccountStatus.ENABLED;
    } else if (account.requirements?.disabled_reason) {
      return StripeAccountStatus.DISABLED;
    } else if (account.requirements?.currently_due?.length > 0) {
      return StripeAccountStatus.RESTRICTED;
    } else {
      return StripeAccountStatus.PENDING;
    }
  }
}

export const connectService = new ConnectService();
