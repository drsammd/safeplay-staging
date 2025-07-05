// @ts-nocheck


import { emailTemplateService } from './email-template-service';
import { emailAutomationEngine } from './email-automation-engine';
import { prisma } from '@/lib/db';
import { EmailTrigger } from '@prisma/client';

export interface InitializationResult {
  success: boolean;
  templatesCreated: number;
  rulesCreated: number;
  errors: string[];
}

export class EmailAutomationInitService {
  private static instance: EmailAutomationInitService;

  static getInstance(): EmailAutomationInitService {
    if (!EmailAutomationInitService.instance) {
      EmailAutomationInitService.instance = new EmailAutomationInitService();
    }
    return EmailAutomationInitService.instance;
  }

  /**
   * Initialize the email automation system with default templates and rules
   */
  async initializeEmailAutomation(adminUserId?: string): Promise<InitializationResult> {
    const errors: string[] = [];
    let templatesCreated = 0;
    let rulesCreated = 0;

    try {
      console.log('🚀 Initializing Email Automation System...');

      // Find or create a system admin user for initialization
      let systemAdminId = adminUserId;
      
      if (!systemAdminId) {
        const systemAdmin = await prisma.user.findFirst({
          where: { role: 'COMPANY_ADMIN' }
        });
        
        if (systemAdmin) {
          systemAdminId = systemAdmin.id;
        } else {
          errors.push('No admin user found for initialization');
          return { success: false, templatesCreated: 0, rulesCreated: 0, errors };
        }
      }

      // 1. Create default email templates
      try {
        console.log('📧 Creating default email templates...');
        const existingTemplates = await prisma.emailTemplate.count();
        
        if (existingTemplates === 0) {
          await emailTemplateService.createDefaultTemplates(systemAdminId);
          templatesCreated = await prisma.emailTemplate.count();
          console.log(`✅ Created ${templatesCreated} default email templates`);
        } else {
          console.log('📧 Email templates already exist, skipping creation');
        }
      } catch (error) {
        console.error('❌ Error creating email templates:', error);
        errors.push(`Template creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 2. Create default automation rules
      try {
        console.log('🤖 Creating default automation rules...');
        const existingRules = await prisma.emailAutomationRule.count();
        
        if (existingRules === 0) {
          await emailAutomationEngine.createDefaultAutomationRules(systemAdminId);
          rulesCreated = await prisma.emailAutomationRule.count();
          console.log(`✅ Created ${rulesCreated} default automation rules`);
        } else {
          console.log('🤖 Automation rules already exist, skipping creation');
        }
      } catch (error) {
        console.error('❌ Error creating automation rules:', error);
        errors.push(`Automation rules creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 3. Create weekly safety tips campaigns
      try {
        console.log('📅 Creating weekly safety tips campaigns...');
        const existingWeeklyCampaigns = await prisma.emailAutomationRule.count({
          where: {
            triggerConditions: {
              path: ['campaignType'],
              equals: 'weekly_safety_tips'
            }
          }
        });
        
        if (existingWeeklyCampaigns === 0) {
          await emailAutomationEngine.createWeeklySafetyTipsCampaign(systemAdminId);
          const weeklyCampaignsCreated = await prisma.emailAutomationRule.count({
            where: {
              triggerConditions: {
                path: ['campaignType'],
                equals: 'weekly_safety_tips'
              }
            }
          });
          console.log(`✅ Created ${weeklyCampaignsCreated} weekly safety tips campaigns`);
        } else {
          console.log('📅 Weekly safety tips campaigns already exist, skipping creation');
        }
      } catch (error) {
        console.error('❌ Error creating weekly safety tips campaigns:', error);
        errors.push(`Weekly campaigns creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 4. Create default email preferences for existing users
      try {
        console.log('⚙️ Setting up email preferences for existing users...');
        await this.setupEmailPreferencesForExistingUsers();
        console.log('✅ Email preferences setup completed');
      } catch (error) {
        console.error('❌ Error setting up email preferences:', error);
        errors.push(`Email preferences setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      console.log('🎉 Email Automation System initialization completed!');
      return {
        success: errors.length === 0,
        templatesCreated,
        rulesCreated,
        errors
      };

    } catch (error) {
      console.error('❌ Email automation initialization failed:', error);
      errors.push(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        templatesCreated,
        rulesCreated,
        errors
      };
    }
  }

  /**
   * Setup email preferences for users who don't have them yet
   */
  private async setupEmailPreferencesForExistingUsers(): Promise<void> {
    const usersWithoutPreferences = await prisma.user.findMany({
      where: {
        emailPreferences: null
      },
      select: { id: true }
    });

    for (const user of usersWithoutPreferences) {
      await prisma.emailPreferences.create({
        data: {
          userId: user.id,
          emailEnabled: true,
          marketingEmails: true,
          securityEmails: true,
          alertEmails: true,
          welcomeSequence: true,
          featureUpdates: true,
          eventReminders: true,
          weeklyDigest: false,
          monthlyReport: false,
          frequency: 'IMMEDIATE',
          timeZone: 'UTC',
          language: 'en'
        }
      });
    }

    console.log(`✅ Created email preferences for ${usersWithoutPreferences.length} existing users`);
  }

  /**
   * Check if email automation system is properly initialized
   */
  async checkInitializationStatus(): Promise<{
    isInitialized: boolean;
    templatesCount: number;
    rulesCount: number;
    usersWithPreferences: number;
    issues: string[];
  }> {
    const issues: string[] = [];

    const [
      templatesCount,
      rulesCount,
      usersWithPreferences,
      totalUsers
    ] = await Promise.all([
      prisma.emailTemplate.count(),
      prisma.emailAutomationRule.count(),
      prisma.emailPreferences.count(),
      prisma.user.count()
    ]);

    // Check for potential issues
    if (templatesCount === 0) {
      issues.push('No email templates found');
    }

    if (rulesCount === 0) {
      issues.push('No automation rules found');
    }

    if (usersWithPreferences < totalUsers) {
      issues.push(`${totalUsers - usersWithPreferences} users without email preferences`);
    }

    // Check if welcome template and rule exist
    const welcomeTemplate = await prisma.emailTemplate.findFirst({
      where: { templateType: 'WELCOME' }
    });

    if (!welcomeTemplate) {
      issues.push('Welcome email template not found');
    }

    const welcomeRule = await prisma.emailAutomationRule.findFirst({
      where: { trigger: EmailTrigger.USER_SIGNUP }
    });

    if (!welcomeRule) {
      issues.push('Welcome automation rule not found');
    }

    return {
      isInitialized: issues.length === 0,
      templatesCount,
      rulesCount,
      usersWithPreferences,
      issues
    };
  }

  /**
   * Test email automation system by sending a test email
   */
  async testEmailAutomation(testUserId: string, testTrigger: EmailTrigger = EmailTrigger.USER_SIGNUP): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      console.log(`🧪 Testing email automation with trigger ${testTrigger} for user ${testUserId}`);

      const result = await emailAutomationEngine.processTrigger({
        trigger: testTrigger,
        userId: testUserId,
        metadata: {
          testMode: true,
          testDate: new Date().toISOString()
        }
      });

      if (result.success && result.scheduledExecutions > 0) {
        return {
          success: true,
          message: `Test successful: ${result.scheduledExecutions} email(s) scheduled`
        };
      } else {
        return {
          success: false,
          message: 'Test failed: No emails scheduled',
          error: result.errors.join(', ')
        };
      }

    } catch (error) {
      console.error('❌ Email automation test failed:', error);
      return {
        success: false,
        message: 'Test failed with error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Trigger common email automations for existing features
   */
  async triggerEmailAutomation(
    trigger: EmailTrigger,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await emailAutomationEngine.processTrigger({
        trigger,
        userId,
        metadata
      });
    } catch (error) {
      console.error(`Failed to trigger email automation ${trigger} for user ${userId}:`, error);
    }
  }

  /**
   * Trigger automation for user verification events
   */
  async triggerUserVerificationEmail(userId: string, verificationType: string): Promise<void> {
    await this.triggerEmailAutomation(EmailTrigger.USER_VERIFICATION, userId, {
      verificationType,
      verificationDate: new Date().toISOString()
    });
  }

  /**
   * Trigger automation for child-related events
   */
  async triggerChildAddedEmail(userId: string, childData: { firstName: string; lastName: string }): Promise<void> {
    await this.triggerEmailAutomation(EmailTrigger.CHILD_ADDED, userId, {
      childName: `${childData.firstName} ${childData.lastName}`,
      childFirstName: childData.firstName,
      addedDate: new Date().toISOString()
    });
  }

  /**
   * Trigger automation for venue visit events
   */
  async triggerVenueVisitEmail(userId: string, venueData: { name: string; id: string }): Promise<void> {
    await this.triggerEmailAutomation(EmailTrigger.VENUE_VISIT, userId, {
      venueName: venueData.name,
      venueId: venueData.id,
      visitDate: new Date().toISOString()
    });
  }

  /**
   * Trigger automation for alert events
   */
  async triggerAlertEmail(
    userId: string, 
    alertData: {
      type: string;
      message: string;
      childName?: string;
      venueName?: string;
      severity?: string;
    }
  ): Promise<void> {
    await this.triggerEmailAutomation(EmailTrigger.ALERT_GENERATED, userId, {
      alertType: alertData.type,
      alertMessage: alertData.message,
      childName: alertData.childName,
      venueName: alertData.venueName,
      alertSeverity: alertData.severity,
      alertTime: new Date().toISOString()
    });
  }

  /**
   * Trigger automation for subscription events
   */
  async triggerSubscriptionEmail(
    userId: string, 
    subscriptionData: {
      event: 'created' | 'expired' | 'payment_failed';
      planName?: string;
      expiryDate?: string;
    }
  ): Promise<void> {
    const trigger = subscriptionData.event === 'created' 
      ? EmailTrigger.SUBSCRIPTION_CREATED
      : subscriptionData.event === 'expired'
      ? EmailTrigger.SUBSCRIPTION_EXPIRED
      : EmailTrigger.PAYMENT_FAILED;

    await this.triggerEmailAutomation(trigger, userId, {
      planName: subscriptionData.planName,
      expiryDate: subscriptionData.expiryDate,
      eventDate: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const emailAutomationInit = EmailAutomationInitService.getInstance();

