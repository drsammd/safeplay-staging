
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
      // Step 1: Validate this is not a demo account (demo accounts are handled separately)
      const isDemoAccount = demoAccountProtection.isDemoAccount(config.email);
      
      if (isDemoAccount) {
        result.warnings.push('Demo account detected - skipping clean initialization');
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
      await prisma.legalAgreement.create({
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
   */
  private async createCleanSubscription(config: CleanAccountConfig, currentTime: Date): Promise<void> {
    await prisma.userSubscription.create({
      data: {
        userId: config.userId,
        status: "ACTIVE",
        planType: "FREE",
        autoRenew: false,
        cancelAtPeriodEnd: false,
        currentPeriodStart: currentTime,
        currentPeriodEnd: new Date(currentTime.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });
  }

  /**
   * Create clean parent account structure (NO children, NO family members)
   */
  private async createCleanParentStructure(config: CleanAccountConfig): Promise<void> {
    console.log(`👨‍👩‍👧‍👦 PARENT STRUCTURE: Creating clean parent structure for: ${config.email}`);
    
    // For parent accounts, we create NO children and NO family members
    // This ensures a completely clean start
    
    // Create email preferences
    await prisma.emailPreferences.create({
      data: {
        userId: config.userId,
        receivePromotional: true,
        receiveAlerts: true,
        receiveUpdates: true,
        emailFrequency: "DAILY"
      }
    });
    
    console.log(`✅ PARENT STRUCTURE: Clean parent structure created (no children, no family)`);
  }

  /**
   * Create clean venue admin structure (NO venues)
   */
  private async createCleanVenueAdminStructure(config: CleanAccountConfig): Promise<void> {
    console.log(`🏢 VENUE STRUCTURE: Creating clean venue admin structure for: ${config.email}`);
    
    // For venue admin accounts, we create NO venues
    // This ensures a completely clean start
    
    // Create email preferences
    await prisma.emailPreferences.create({
      data: {
        userId: config.userId,
        receivePromotional: true,
        receiveAlerts: true,
        receiveUpdates: true,
        emailFrequency: "DAILY"
      }
    });
    
    console.log(`✅ VENUE STRUCTURE: Clean venue admin structure created (no venues)`);
  }

  /**
   * Create clean super admin structure
   */
  private async createCleanSuperAdminStructure(config: CleanAccountConfig): Promise<void> {
    console.log(`👑 ADMIN STRUCTURE: Creating clean super admin structure for: ${config.email}`);
    
    // For super admin accounts, we create minimal structure
    
    // Create email preferences
    await prisma.emailPreferences.create({
      data: {
        userId: config.userId,
        receivePromotional: false,
        receiveAlerts: true,
        receiveUpdates: true,
        emailFrequency: "IMMEDIATE"
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
