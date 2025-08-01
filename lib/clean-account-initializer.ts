
/**
 * SafePlay Clean Account Initializer
 * Ensures new accounts are created with clean, empty state
 * 
 * FEATURES:
 * - Validates new accounts are clean
 * - Prevents demo data injection during signup
 * - Ensures proper initialization for different account types
 * - Monitoring and validation for account cleanliness
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from './db';
import { demoAccountProtection } from './demo-account-protection';

export interface CleanAccountConfig {
  userId: string;
  email: string;
  name: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  prismaInstance?: any; // Transaction context or prisma instance
  // CRITICAL v1.5.19 FIX: Add payment and plan information for proper account creation
  selectedPlan?: {
    id?: string;
    name?: string;
    stripePriceId?: string | null;
    billingInterval?: "monthly" | "yearly" | "lifetime" | "free";
    amount?: number;
    planType?: string;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionMetadata?: any;
  // CRITICAL v1.5.31 FIX: Add existing customer ID to prevent duplicate creation
  existingStripeCustomerId?: string;
}

export interface AccountInitializationResult {
  success: boolean;
  accountId: string;
  email: string;
  isClean: boolean;
  errors: string[];
  warnings: string[];
}

export class CleanAccountInitializer {
  private static instance: CleanAccountInitializer;

  public static getInstance(): CleanAccountInitializer {
    if (!CleanAccountInitializer.instance) {
      CleanAccountInitializer.instance = new CleanAccountInitializer();
    }
    return CleanAccountInitializer.instance;
  }

  /**
   * CRITICAL: Initialize a completely clean account for new users
   */
  public async initializeCleanAccount(config: CleanAccountConfig): Promise<AccountInitializationResult> {
    const initId = `init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🧹 CLEAN INIT [${initId}]: Initializing clean account for: ${config.email}`);
    
    const result: AccountInitializationResult = {
      success: false,
      accountId: config.userId,
      email: config.email,
      isClean: false,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Handle demo accounts specially but still create essential structures
      const isDemoAccount = demoAccountProtection.isDemoAccount(config.email);
      
      if (isDemoAccount) {
        console.log(`🎭 CLEAN INIT [${initId}]: Demo account detected - creating essential structures only`);
        
        // CRITICAL FIX v1.5.32: Demo accounts still need subscriptions and legal agreements
        const currentTime = new Date();
        
        // Create legal agreements for demo accounts
        await this.createLegalAgreements(config, currentTime);
        
        // Create subscription for demo accounts (they still need subscriptions to function)
        await this.createCleanSubscription(config, currentTime);
        
        result.warnings.push('Demo account detected - created essential structures only');
        result.success = true;
        result.isClean = true;
        return result;
      }

      // Step 2: Ensure account has no existing demo data
      const hasNoContamination = await demoAccountProtection.validateNoContamination(
        config.userId, 
        config.email
      );
      
      if (!hasNoContamination) {
        result.errors.push('Account has existing demo data contamination');
        return result;
      }

      // Step 3: Validate account type and create appropriate clean structure
      await this.createCleanAccountStructure(config, result);

      // Step 4: Final validation - ensure account is clean
      const isClean = await demoAccountProtection.ensureCleanAccount(
        config.userId,
        config.email
      );
      
      if (!isClean) {
        result.errors.push('Account failed final cleanliness validation');
        return result;
      }

      result.success = true;
      result.isClean = true;
      
      console.log(`✅ CLEAN INIT [${initId}]: Clean account initialization successful`);
      return result;

    } catch (error) {
      console.error(`❌ CLEAN INIT [${initId}]: Initialization error:`, error);
      result.errors.push(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * CRITICAL: Create clean account structure based on role
   */
  private async createCleanAccountStructure(
    config: CleanAccountConfig, 
    result: AccountInitializationResult
  ): Promise<void> {
    const structureId = `structure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🏗️ CLEAN STRUCTURE [${structureId}]: Creating clean structure for: ${config.role}`);
    
    try {
      const currentTime = new Date();
      
      // Create legal agreements (required for all accounts)
      await this.createLegalAgreements(config, currentTime);
      
      // Create clean subscription (required for all accounts)
      await this.createCleanSubscription(config, currentTime);
      
      // Create role-specific clean structures
      switch (config.role) {
        case 'PARENT':
          await this.createCleanParentStructure(config);
          break;
        case 'VENUE_ADMIN':
          await this.createCleanVenueAdminStructure(config);
          break;
        case 'SUPER_ADMIN':
          await this.createCleanSuperAdminStructure(config);
          break;
        default:
          result.warnings.push(`Unknown role: ${config.role} - using default structure`);
      }
      
      console.log(`✅ CLEAN STRUCTURE [${structureId}]: Clean structure created`);
      
    } catch (error) {
      console.error(`❌ CLEAN STRUCTURE [${structureId}]: Structure creation error:`, error);
      throw error;
    }
  }

  /**
   * Create legal agreements for new account
   */
  private async createLegalAgreements(config: CleanAccountConfig, currentTime: Date): Promise<void> {
    const agreementVersion = "1.0";
    const dbInstance = config.prismaInstance || prisma; // Use transaction context if provided
    
    const agreements = [
      {
        agreementType: "TERMS_OF_SERVICE",
        content: "Terms of Service Agreement"
      },
      {
        agreementType: "PRIVACY_POLICY", 
        content: "Privacy Policy Agreement"
      }
    ];

    // Add parental consent for parent accounts
    if (config.role === "PARENT") {
      agreements.push({
        agreementType: "PARENTAL_CONSENT",
        content: "Parental Consent Agreement"
      });
    }

    for (const agreement of agreements) {
      await dbInstance.legalAgreement.create({
        data: {
          userId: config.userId,
          agreementType: agreement.agreementType as any,
          version: agreementVersion,
          agreedAt: currentTime,
          ipAddress: config.ipAddress,
          userAgent: config.userAgent,
          content: agreement.content
        },
      });
    }
  }

  /**
   * Create clean subscription for new account
   * CRITICAL v1.5.50-alpha.2 FIX: Use proper SubscriptionStatus enum values
   */
  private async createCleanSubscription(config: CleanAccountConfig, currentTime: Date): Promise<void> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`💳 CLEAN SUBSCRIPTION [${subscriptionId}]: Starting subscription creation for: ${config.email}`);
    
    const dbInstance = config.prismaInstance || prisma; // Use transaction context if provided
    
    // Determine plan type and subscription settings based on selected plan
    let planType = "FREE";
    let cancelAtPeriodEnd = false;
    let subscriptionStatus = "ACTIVE"; // Will be converted to enum value
    let currentPeriodEnd = new Date(currentTime.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year for free
    
    // CRITICAL FIX: Use selected plan information if provided
    if (config.selectedPlan) {
      console.log(`💳 CLEAN SUBSCRIPTION [${subscriptionId}]: Processing selected plan:`, {
        planName: config.selectedPlan.name || 'Unknown',
        planType: config.selectedPlan.planType || 'FREE',
        billingInterval: config.selectedPlan.billingInterval || 'free',
        amount: config.selectedPlan.amount || 0,
        stripePriceId: config.selectedPlan.stripePriceId || null
      });
      
      // Map plan type from selected plan (with safe access)
      const selectedPlanType = config.selectedPlan.planType?.toUpperCase() || "FREE";
      if (selectedPlanType === "BASIC") {
        planType = "BASIC";
      } else if (selectedPlanType === "PREMIUM") {
        planType = "PREMIUM";
      } else if (selectedPlanType === "FAMILY") {
        planType = "FAMILY";
      } else {
        planType = "FREE";
      }
      
      // Set subscription settings for paid plans (with safe access)
      const planAmount = config.selectedPlan.amount || 0;
      if (planAmount > 0) {
        subscriptionStatus = "TRIALING"; // Start with trial for paid plans (will be converted to enum)
        
        // Calculate trial end date (7 days)
        currentPeriodEnd = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        console.log(`✅ CLEAN SUBSCRIPTION [${subscriptionId}]: Setting up PAID plan:`, {
          planType,
          subscriptionStatus,
          trialEndDate: currentPeriodEnd
        });
      } else {
        console.log(`✅ CLEAN SUBSCRIPTION [${subscriptionId}]: Setting up FREE plan:`, {
          planType,
          subscriptionStatus
        });
      }
    }
    
    // CRITICAL v1.5.50-alpha.2 FIX: Map status string to proper SubscriptionStatus enum value
    const mapToSubscriptionStatus = (status: string): string => {
      const statusUpper = status.toUpperCase();
      // Ensure we only use valid enum values
      const validStatuses = ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE', 'UNPAID', 'TRIALING'];
      return validStatuses.includes(statusUpper) ? statusUpper : 'ACTIVE';
    };
    
    // CRITICAL v1.5.50-alpha.2 FIX: Enhanced Stripe subscription data handling for paid plans
    // CRITICAL v1.5.60 HOTFIX: Use correct database field names and types
    let subscriptionData: any = {
      userId: config.userId,
      status: mapToSubscriptionStatus(subscriptionStatus),
      planType: planType, // Using string since database uses text type
      cancelAtPeriodEnd: cancelAtPeriodEnd,
      currentPeriodStart: currentTime,
      currentPeriodEnd: currentPeriodEnd,
      metadata: {},
      // Add Stripe information if available
      ...(config.stripeCustomerId && { stripeCustomerId: config.stripeCustomerId }),
      ...(config.stripeSubscriptionId && { stripeSubscriptionId: config.stripeSubscriptionId }),
    };
    
    // CRITICAL v1.5.50-alpha.2 FIX: Use detailed Stripe subscription metadata for paid plans with proper status mapping
    if (config.subscriptionMetadata && config.selectedPlan && config.selectedPlan.amount > 0) {
      console.log(`💳 CLEAN SUBSCRIPTION [${subscriptionId}]: Using detailed Stripe subscription metadata for paid plan`);
      console.log(`💳 CLEAN SUBSCRIPTION [${subscriptionId}]: Subscription metadata:`, config.subscriptionMetadata);
      
      // Get the Stripe status and properly map it to enum value
      const stripeStatus = config.subscriptionMetadata.stripeSubscriptionStatus || subscriptionStatus;
      const mappedStatus = mapToSubscriptionStatus(stripeStatus);
      
      console.log(`💳 CLEAN SUBSCRIPTION [${subscriptionId}]: Status mapping - Original: "${stripeStatus}" -> Mapped: "${mappedStatus}"`);
      
      // Override with detailed Stripe subscription information
      subscriptionData = {
        ...subscriptionData,
        stripeCustomerId: config.subscriptionMetadata.stripeCustomerId || config.stripeCustomerId,
        stripeSubscriptionId: config.subscriptionMetadata.stripeSubscriptionId || config.stripeSubscriptionId,
        status: mappedStatus,
        // Use trial end date from Stripe if available
        ...(config.subscriptionMetadata.trialEnd && { 
          currentPeriodEnd: config.subscriptionMetadata.trialEnd,
          trialEnd: config.subscriptionMetadata.trialEnd
        }),
      };
      
      console.log(`✅ CLEAN SUBSCRIPTION [${subscriptionId}]: Enhanced subscription data with Stripe metadata and proper status mapping`);
    }
    
    console.log(`💾 CLEAN SUBSCRIPTION [${subscriptionId}]: Creating subscription with data:`, subscriptionData);
    
    try {
      // CRITICAL v1.5.33 FIX: Enhanced subscription creation with error handling
      const createdSubscription = await dbInstance.userSubscription.create({
        data: subscriptionData,
      });
      
      console.log(`✅ CLEAN SUBSCRIPTION [${subscriptionId}]: Subscription created successfully:`, {
        subscriptionId: createdSubscription.id,
        planType: createdSubscription.planType,
        status: createdSubscription.status,
        userId: createdSubscription.userId
      });
      
      // CRITICAL v1.5.33 FIX: Immediate verification that subscription was created
      const verifySubscription = await dbInstance.userSubscription.findUnique({
        where: { id: createdSubscription.id }
      });
      
      if (!verifySubscription) {
        throw new Error(`Subscription verification failed - subscription not found after creation`);
      }
      
      console.log(`✅ CLEAN SUBSCRIPTION [${subscriptionId}]: Subscription verified successfully`);
      
    } catch (error) {
      console.error(`🚨 CLEAN SUBSCRIPTION [${subscriptionId}]: Subscription creation failed:`, error);
      console.error(`🚨 CLEAN SUBSCRIPTION [${subscriptionId}]: Attempted data:`, subscriptionData);
      throw new Error(`Subscription creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create clean parent account structure (NO children, NO family members)
   * CRITICAL v1.5.33 FIX: Enhanced protection against demo data contamination
   */
  private async createCleanParentStructure(config: CleanAccountConfig): Promise<void> {
    const structureId = `parent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`👨‍👩‍👧‍👦 PARENT STRUCTURE [${structureId}]: Creating clean parent structure for: ${config.email}`);
    
    const dbInstance = config.prismaInstance || prisma; // Use transaction context if provided
    
    // CRITICAL v1.5.33 FIX: Explicit validation to prevent demo data contamination
    const isDemoAccount = demoAccountProtection.isDemoAccount(config.email);
    
    if (!isDemoAccount) {
      console.log(`🛡️ PARENT STRUCTURE [${structureId}]: NON-DEMO ACCOUNT - Ensuring absolutely NO demo data`);
      
      // For non-demo parent accounts, we create NO children and NO family members
      // This ensures a completely clean start with zero demo data
      
      // CRITICAL: Double-check that no demo data exists before proceeding
      const existingChildren = await dbInstance.child.count({
        where: { parentId: config.userId }
      });
      
      const existingFamilyMembers = await dbInstance.familyMember.count({
        where: { familyId: config.userId }
      });
      
      if (existingChildren > 0 || existingFamilyMembers > 0) {
        console.error(`🚨 PARENT STRUCTURE [${structureId}]: CRITICAL - Demo data contamination detected!`);
        console.error(`🚨 PARENT STRUCTURE [${structureId}]: Children: ${existingChildren}, Family: ${existingFamilyMembers}`);
        throw new Error(`Demo data contamination detected for non-demo account: ${config.email}`);
      }
      
      console.log(`✅ PARENT STRUCTURE [${structureId}]: Verified no demo data contamination`);
    }
    
    // Create email preferences (only safe, non-demo data)
    await dbInstance.emailPreferences.create({
      data: {
        userId: config.userId,
        marketingEmails: true,
        securityAlerts: true,
        productUpdates: true,
        frequency: "DAILY"
      }
    });
    
    console.log(`✅ PARENT STRUCTURE [${structureId}]: Clean parent structure created (no children, no family, no demo data)`);
  }

  /**
   * Create clean venue admin structure (NO venues)
   */
  private async createCleanVenueAdminStructure(config: CleanAccountConfig): Promise<void> {
    console.log(`🏢 VENUE STRUCTURE: Creating clean venue admin structure for: ${config.email}`);
    const dbInstance = config.prismaInstance || prisma; // Use transaction context if provided
    
    // For venue admin accounts, we create NO venues
    // This ensures a completely clean start
    
    // Create email preferences
    await dbInstance.emailPreferences.create({
      data: {
        userId: config.userId,
        marketingEmails: true,
        securityAlerts: true,
        productUpdates: true,
        frequency: "DAILY"
      }
    });
    
    console.log(`✅ VENUE STRUCTURE: Clean venue admin structure created (no venues)`);
  }

  /**
   * Create clean super admin structure
   */
  private async createCleanSuperAdminStructure(config: CleanAccountConfig): Promise<void> {
    console.log(`👑 ADMIN STRUCTURE: Creating clean super admin structure for: ${config.email}`);
    const dbInstance = config.prismaInstance || prisma; // Use transaction context if provided
    
    // For super admin accounts, we create minimal structure
    
    // Create email preferences
    await dbInstance.emailPreferences.create({
      data: {
        userId: config.userId,
        marketingEmails: false,
        securityAlerts: true,
        productUpdates: true,
        frequency: "IMMEDIATE"
      }
    });
    
    console.log(`✅ ADMIN STRUCTURE: Clean super admin structure created`);
  }

  /**
   * CRITICAL: Validate account cleanliness after initialization
   */
  public async validateAccountCleanliness(userId: string, email: string): Promise<{
    isClean: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const validationId = `validate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔍 CLEAN VALIDATION [${validationId}]: Validating account cleanliness for: ${email}`);
    
    const result = {
      isClean: true,
      issues: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Skip validation for demo accounts
      if (demoAccountProtection.isDemoAccount(email)) {
        result.warnings.push('Demo account - skipping cleanliness validation');
        return result;
      }

      // Check for demo data contamination
      const hasNoContamination = await demoAccountProtection.validateNoContamination(userId, email);
      
      if (!hasNoContamination) {
        result.isClean = false;
        result.issues.push('Account has demo data contamination');
      }

      // Check for proper initialization
      const subscription = await prisma.userSubscription.findFirst({
        where: { userId }
      });
      
      if (!subscription) {
        result.isClean = false;
        result.issues.push('Account missing subscription');
      }

      const legalAgreements = await prisma.legalAgreement.count({
        where: { userId }
      });
      
      if (legalAgreements === 0) {
        result.isClean = false;
        result.issues.push('Account missing legal agreements');
      }

      if (result.isClean) {
        console.log(`✅ CLEAN VALIDATION [${validationId}]: Account is clean`);
      } else {
        console.error(`❌ CLEAN VALIDATION [${validationId}]: Account has issues:`, result.issues);
      }

      return result;

    } catch (error) {
      console.error(`❌ CLEAN VALIDATION [${validationId}]: Validation error:`, error);
      result.isClean = false;
      result.issues.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
}

// Export singleton instance
export const cleanAccountInitializer = CleanAccountInitializer.getInstance();
