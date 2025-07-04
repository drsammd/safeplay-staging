// @ts-nocheck


import { prisma } from '@/lib/db';
import { emailAutomationService } from './email-automation-service';
import { emailTemplateService } from './email-template-service';
import { 
  EmailTrigger,
  EmailExecutionStatus,
  EmailPriority,
  UserSegmentType,
  EmailAutomationRule,
  EmailAutomationExecution,
  EmailTemplateType,
  User,
  Child,
  Venue
} from '@prisma/client';

export interface TriggerEvent {
  trigger: EmailTrigger;
  userId: string;
  metadata?: Record<string, any>;
  delayMinutes?: number;
}

export interface AutomationContext {
  user: User;
  children?: Child[];
  venues?: Venue[];
  triggerMetadata?: Record<string, any>;
}

export interface CreateAutomationRuleData {
  name: string;
  description?: string;
  trigger: EmailTrigger;
  triggerConditions: Record<string, any>;
  templateId: string;
  delay?: number;
  isActive?: boolean;
  maxSends?: number;
  sendOnWeekends?: boolean;
  sendTimeStart?: string;
  sendTimeEnd?: string;
  timezone?: string;
  userSegment?: UserSegmentType;
  emailSegmentId?: string;
  segmentFilters?: Record<string, any>;
  priority?: EmailPriority;
  stopConditions?: Record<string, any>;
  createdBy: string;
}

export class EmailAutomationEngine {
  private static instance: EmailAutomationEngine;

  static getInstance(): EmailAutomationEngine {
    if (!EmailAutomationEngine.instance) {
      EmailAutomationEngine.instance = new EmailAutomationEngine();
    }
    return EmailAutomationEngine.instance;
  }

  /**
   * Process a trigger event
   */
  async processTrigger(event: TriggerEvent): Promise<{
    success: boolean;
    scheduledExecutions: number;
    errors: string[];
  }> {
    let scheduledExecutions = 0;
    const errors: string[] = [];

    try {
      // Get all active automation rules for this trigger
      const rules = await prisma.emailAutomationRule.findMany({
        where: {
          trigger: event.trigger,
          isActive: true
        },
        include: {
          template: true
        }
      });

      console.log(`Processing trigger ${event.trigger} for user ${event.userId}, found ${rules.length} rules`);

      for (const rule of rules) {
        try {
          const shouldExecute = await this.evaluateRuleConditions(rule, event);
          
          if (shouldExecute) {
            await this.scheduleRuleExecution(rule, event);
            scheduledExecutions++;
          }
        } catch (error) {
          console.error(`Error processing rule ${rule.id}:`, error);
          errors.push(`Rule ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        scheduledExecutions,
        errors
      };

    } catch (error) {
      console.error('Error processing trigger:', error);
      return {
        success: false,
        scheduledExecutions: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Evaluate if a rule should be executed for a given trigger event
   */
  private async evaluateRuleConditions(
    rule: EmailAutomationRule, 
    event: TriggerEvent
  ): Promise<boolean> {
    try {
      // Get user context
      const context = await this.getUserContext(event.userId, event.metadata);

      // Check user segment
      if (rule.userSegment) {
        const userMatchesSegment = await this.checkUserSegment(context.user, rule.userSegment);
        if (!userMatchesSegment) {
          console.log(`User ${event.userId} doesn't match segment ${rule.userSegment}`);
          return false;
        }
      }

      // Check custom segment
      if (rule.emailSegmentId) {
        const userInSegment = await this.checkCustomSegment(event.userId, rule.emailSegmentId);
        if (!userInSegment) {
          console.log(`User ${event.userId} not in custom segment ${rule.emailSegmentId}`);
          return false;
        }
      }

      // Check email preferences
      const preferences = await prisma.emailPreferences.findUnique({
        where: { userId: event.userId }
      });

      if (!preferences?.emailEnabled) {
        console.log(`User ${event.userId} has emails disabled`);
        return false;
      }

      // Check if rule has already been sent maximum times to this user
      if (rule.maxSends) {
        const sendCount = await prisma.emailAutomationExecution.count({
          where: {
            ruleId: rule.id,
            userId: event.userId,
            status: EmailExecutionStatus.COMPLETED
          }
        });

        if (sendCount >= rule.maxSends) {
          console.log(`User ${event.userId} has reached max sends (${rule.maxSends}) for rule ${rule.id}`);
          return false;
        }
      }

      // Check trigger-specific conditions
      const triggerConditions = rule.triggerConditions as Record<string, any>;
      if (!this.evaluateTriggerConditions(triggerConditions, context, event.metadata)) {
        console.log(`Trigger conditions not met for rule ${rule.id}`);
        return false;
      }

      // Check stop conditions
      if (rule.stopConditions) {
        const stopConditions = rule.stopConditions as Record<string, any>;
        if (this.evaluateStopConditions(stopConditions, context)) {
          console.log(`Stop conditions met for rule ${rule.id}`);
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Error evaluating rule conditions:', error);
      return false;
    }
  }

  /**
   * Schedule a rule execution
   */
  private async scheduleRuleExecution(
    rule: EmailAutomationRule,
    event: TriggerEvent
  ): Promise<void> {
    const delay = event.delayMinutes || rule.delay || 0;
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + delay);

    // Adjust for send time restrictions
    const finalScheduledAt = this.adjustForSendTimeRestrictions(
      scheduledAt,
      rule.sendTimeStart || undefined,
      rule.sendTimeEnd || undefined,
      rule.sendOnWeekends || false,
      rule.timezone || 'UTC'
    );

    await prisma.emailAutomationExecution.create({
      data: {
        ruleId: rule.id,
        userId: event.userId,
        scheduledAt: finalScheduledAt,
        status: EmailExecutionStatus.PENDING,
        metadata: {
          triggerEvent: JSON.parse(JSON.stringify(event)),
          originalScheduledAt: scheduledAt.toISOString(),
          adjustedScheduledAt: finalScheduledAt.toISOString()
        } as any
      }
    });

    console.log(`Scheduled execution for rule ${rule.id}, user ${event.userId} at ${finalScheduledAt}`);
  }

  /**
   * Execute pending automation rules
   */
  async executeScheduledAutomations(limit: number = 100): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // Get pending executions that are due
      const executions = await prisma.emailAutomationExecution.findMany({
        where: {
          status: EmailExecutionStatus.PENDING,
          scheduledAt: { lte: new Date() }
        },
        include: {
          rule: {
            include: {
              template: true
            }
          },
          user: true
        },
        orderBy: [
          { scheduledAt: 'asc' }
        ],
        take: limit
      });

      for (const execution of executions) {
        processed++;

        try {
          // Update status to processing
          await prisma.emailAutomationExecution.update({
            where: { id: execution.id },
            data: { 
              status: EmailExecutionStatus.PROCESSING,
              executedAt: new Date()
            }
          });

          // Check if rule is still active
          if (!execution.rule.isActive) {
            await prisma.emailAutomationExecution.update({
              where: { id: execution.id },
              data: { 
                status: EmailExecutionStatus.SKIPPED,
                errorMessage: 'Rule deactivated'
              }
            });
            continue;
          }

          // Re-evaluate conditions (in case user state changed)
          const shouldStillExecute = await this.evaluateExecutionConditions(execution);
          if (!shouldStillExecute) {
            await prisma.emailAutomationExecution.update({
              where: { id: execution.id },
              data: { 
                status: EmailExecutionStatus.SKIPPED,
                errorMessage: 'Conditions no longer met'
              }
            });
            continue;
          }

          // Prepare email variables
          const variables = await this.prepareEmailVariables(execution);

          // Send email
          const emailResult = await emailAutomationService.sendEmail({
            recipientId: execution.userId,
            recipientEmail: execution.user.email,
            subject: execution.rule.template.subject,
            templateId: execution.rule.templateId,
            automationRuleId: execution.ruleId,
            priority: execution.rule.priority,
            variables,
            metadata: {
              automationExecutionId: execution.id,
              triggerEvent: execution.metadata
            }
          });

          if (emailResult.success) {
            await prisma.emailAutomationExecution.update({
              where: { id: execution.id },
              data: { 
                status: EmailExecutionStatus.COMPLETED,
                emailLogId: emailResult.emailLogId
              }
            });
            succeeded++;
          } else {
            await prisma.emailAutomationExecution.update({
              where: { id: execution.id },
              data: { 
                status: EmailExecutionStatus.FAILED,
                errorMessage: emailResult.error
              }
            });
            failed++;
          }

        } catch (error) {
          console.error(`Error executing automation ${execution.id}:`, error);
          
          await prisma.emailAutomationExecution.update({
            where: { id: execution.id },
            data: { 
              status: EmailExecutionStatus.FAILED,
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          });
          failed++;
        }
      }

    } catch (error) {
      console.error('Error executing scheduled automations:', error);
    }

    return { processed, succeeded, failed };
  }

  /**
   * Create a new automation rule
   */
  async createAutomationRule(data: CreateAutomationRuleData): Promise<EmailAutomationRule> {
    return await prisma.emailAutomationRule.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        triggerConditions: data.triggerConditions,
        templateId: data.templateId,
        delay: data.delay || 0,
        isActive: data.isActive !== false,
        maxSends: data.maxSends,
        sendOnWeekends: data.sendOnWeekends !== false,
        sendTimeStart: data.sendTimeStart,
        sendTimeEnd: data.sendTimeEnd,
        timezone: data.timezone || 'UTC',
        userSegment: data.userSegment,
        emailSegmentId: data.emailSegmentId,
        segmentFilters: data.segmentFilters,
        priority: data.priority || EmailPriority.NORMAL,
        stopConditions: data.stopConditions,
        createdBy: data.createdBy
      }
    });
  }

  /**
   * Get user context for rule evaluation
   */
  private async getUserContext(
    userId: string, 
    metadata?: Record<string, any>
  ): Promise<AutomationContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        children: true,
        managedVenues: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      user,
      children: user.children,
      venues: user.managedVenues,
      triggerMetadata: metadata
    };
  }

  /**
   * Check if user matches a predefined segment
   */
  private async checkUserSegment(user: User, segment: UserSegmentType): Promise<boolean> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (segment) {
      case UserSegmentType.ALL_USERS:
        return true;

      case UserSegmentType.NEW_USERS:
        return user.createdAt >= thirtyDaysAgo;

      case UserSegmentType.PARENTS:
        const childCount = await prisma.child.count({
          where: { parentId: user.id }
        });
        return childCount > 0;

      case UserSegmentType.VENUE_ADMINS:
        return user.role === 'VENUE_ADMIN';

      case UserSegmentType.COMPANY_ADMINS:
        return user.role === 'COMPANY_ADMIN';

      case UserSegmentType.VERIFIED_USERS:
        return user.identityVerified && user.phoneVerified;

      case UserSegmentType.UNVERIFIED_USERS:
        return !user.identityVerified || !user.phoneVerified;

      case UserSegmentType.PREMIUM_USERS:
        const subscription = await prisma.userSubscription.findUnique({
          where: { userId: user.id }
        });
        return subscription?.status === 'ACTIVE' && subscription.planId !== 'FREE';

      case UserSegmentType.FREE_USERS:
        const freeSubscription = await prisma.userSubscription.findUnique({
          where: { userId: user.id }
        });
        return !freeSubscription || freeSubscription.planId === 'FREE';

      default:
        return false;
    }
  }

  /**
   * Check if user is in a custom segment
   */
  private async checkCustomSegment(userId: string, segmentId: string): Promise<boolean> {
    const membership = await prisma.emailSegmentMember.findUnique({
      where: {
        segmentId_userId: {
          segmentId,
          userId
        }
      }
    });

    return membership?.isActive || false;
  }

  /**
   * Evaluate trigger-specific conditions
   */
  private evaluateTriggerConditions(
    conditions: Record<string, any>,
    context: AutomationContext,
    triggerMetadata?: Record<string, any>
  ): boolean {
    // Default implementation - can be extended for specific trigger types
    if (Object.keys(conditions).length === 0) {
      return true; // No conditions means always execute
    }

    // Example condition checks
    if (conditions.userRole && context.user.role !== conditions.userRole) {
      return false;
    }

    if (conditions.hasChildren && (!context.children || context.children.length === 0)) {
      return false;
    }

    if (conditions.minChildren && (!context.children || context.children.length < conditions.minChildren)) {
      return false;
    }

    // Add more condition checks as needed

    return true;
  }

  /**
   * Evaluate stop conditions
   */
  private evaluateStopConditions(
    stopConditions: Record<string, any>,
    context: AutomationContext
  ): boolean {
    // Check if any stop conditions are met
    if (stopConditions.userUnsubscribed) {
      // This would be checked against email preferences
      return false; // Already checked in main evaluation
    }

    // Note: There's no DISABLED role in the current schema, so we skip this check
    // if (stopConditions.accountClosed && context.user.role === 'DISABLED') {
    //   return true;
    // }

    // Add more stop condition checks as needed

    return false;
  }

  /**
   * Re-evaluate conditions at execution time
   */
  private async evaluateExecutionConditions(
    execution: EmailAutomationExecution & {
      rule: EmailAutomationRule;
      user: User;
    }
  ): Promise<boolean> {
    // Check email preferences again
    const preferences = await prisma.emailPreferences.findUnique({
      where: { userId: execution.userId }
    });

    if (!preferences?.emailEnabled) {
      return false;
    }

    // Check if user is still in segment (for dynamic segments)
    if (execution.rule.userSegment) {
      const stillInSegment = await this.checkUserSegment(execution.user, execution.rule.userSegment);
      if (!stillInSegment) {
        return false;
      }
    }

    return true;
  }

  /**
   * Prepare variables for email template
   */
  private async prepareEmailVariables(
    execution: EmailAutomationExecution & {
      rule: EmailAutomationRule;
      user: User;
    }
  ): Promise<Record<string, any>> {
    const context = await this.getUserContext(execution.userId);
    
    const baseVariables = {
      userId: execution.user.id,
      userName: execution.user.name,
      userEmail: execution.user.email,
      userRole: execution.user.role,
      unsubscribeToken: '', // Will be filled by email preferences
      loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`,
      dashboardUrl: this.getDashboardUrl(execution.user.role),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@safeplay.app'
    };

    // Add user preferences for unsubscribe
    const preferences = await prisma.emailPreferences.findUnique({
      where: { userId: execution.userId }
    });
    if (preferences) {
      baseVariables.unsubscribeToken = preferences.unsubscribeToken;
    }

    // Add children data if user is a parent
    if (context.children && context.children.length > 0) {
      Object.assign(baseVariables, {
        children: context.children.map(child => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          fullName: `${child.firstName} ${child.lastName}`
        })),
        childCount: context.children.length,
        firstChildName: context.children[0].firstName
      });
    }

    // Add trigger-specific variables
    const triggerMetadata = execution.metadata as Record<string, any>;
    if (triggerMetadata?.triggerEvent?.metadata) {
      Object.assign(baseVariables, triggerMetadata.triggerEvent.metadata);
    }

    return baseVariables;
  }

  /**
   * Get dashboard URL based on user role
   */
  private getDashboardUrl(role: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://localhost:3000';
    
    switch (role) {
      case 'COMPANY_ADMIN':
        return `${baseUrl}/admin`;
      case 'VENUE_ADMIN':
        return `${baseUrl}/venue-admin`;
      case 'PARENT':
        return `${baseUrl}/parent`;
      default:
        return baseUrl;
    }
  }

  /**
   * Adjust scheduled time for send time restrictions
   */
  private adjustForSendTimeRestrictions(
    scheduledAt: Date,
    sendTimeStart?: string,
    sendTimeEnd?: string,
    sendOnWeekends: boolean = true,
    timezone: string = 'UTC'
  ): Date {
    let adjustedTime = new Date(scheduledAt);

    // Skip weekends if not allowed
    if (!sendOnWeekends) {
      const dayOfWeek = adjustedTime.getDay(); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Move to next Monday
        const daysToAdd = dayOfWeek === 0 ? 1 : 2;
        adjustedTime.setDate(adjustedTime.getDate() + daysToAdd);
        // Reset time to start of send window or 9 AM if no window defined
        const startHour = sendTimeStart ? parseInt(sendTimeStart.split(':')[0]) : 9;
        adjustedTime.setHours(startHour, 0, 0, 0);
      }
    }

    // Adjust for send time window
    if (sendTimeStart && sendTimeEnd) {
      const [startHour, startMinute] = sendTimeStart.split(':').map(Number);
      const [endHour, endMinute] = sendTimeEnd.split(':').map(Number);
      
      const currentHour = adjustedTime.getHours();
      const currentMinute = adjustedTime.getMinutes();
      
      const currentTime = currentHour * 60 + currentMinute;
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      if (currentTime < startTime) {
        // Too early, move to start time
        adjustedTime.setHours(startHour, startMinute, 0, 0);
      } else if (currentTime > endTime) {
        // Too late, move to next day start time
        adjustedTime.setDate(adjustedTime.getDate() + 1);
        adjustedTime.setHours(startHour, startMinute, 0, 0);
        
        // Check weekend again after moving to next day
        if (!sendOnWeekends) {
          const nextDayOfWeek = adjustedTime.getDay();
          if (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
            const daysToAdd = nextDayOfWeek === 0 ? 1 : 2;
            adjustedTime.setDate(adjustedTime.getDate() + daysToAdd);
          }
        }
      }
    }

    return adjustedTime;
  }

  /**
   * Get onboarding sequence templates
   */
  private async getOnboardingTemplates() {
    const templates = await prisma.emailTemplate.findMany({
      where: {
        templateType: 'ONBOARDING',
        name: {
          startsWith: 'Onboarding Day'
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return templates.reduce((acc, template) => {
      const dayMatch = template.name.match(/Day (\d+)/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        acc[day] = template;
      }
      return acc;
    }, {} as Record<number, any>);
  }

  /**
   * Create 7-Day Onboarding Sequence Rules
   */
  private createOnboardingSequenceRules(onboardingTemplates: Record<number, any>) {
    const onboardingRules = [];

    // Days 1-7 with appropriate delays (in minutes)
    const sequenceConfig = [
      { day: 1, delay: 0, name: 'Onboarding Day 1 - Welcome & Getting Started' },
      { day: 2, delay: 1440, name: 'Onboarding Day 2 - Child Profiles' }, // 24 hours
      { day: 3, delay: 2880, name: 'Onboarding Day 3 - Biometric Security' }, // 48 hours  
      { day: 4, delay: 4320, name: 'Onboarding Day 4 - Check-in System' }, // 72 hours
      { day: 5, delay: 5760, name: 'Onboarding Day 5 - Alerts & Notifications' }, // 96 hours
      { day: 6, delay: 7200, name: 'Onboarding Day 6 - Safety Analytics' }, // 120 hours
      { day: 7, delay: 8640, name: 'Onboarding Day 7 - Advanced Features' } // 144 hours
    ];

    for (const config of sequenceConfig) {
      const template = onboardingTemplates[config.day];
      if (template) {
        onboardingRules.push({
          name: `${config.name}`,
          description: `Day ${config.day} of 7-day onboarding sequence - automated educational email`,
          trigger: EmailTrigger.USER_SIGNUP,
          triggerConditions: {},
          templateId: template.id,
          delay: config.delay,
          userSegment: UserSegmentType.ALL_USERS,
          priority: EmailPriority.NORMAL,
          maxSends: 1
        });
      }
    }

    return onboardingRules;
  }

  /**
   * Process onboarding sequence trigger with user context
   */
  async processOnboardingTrigger(userId: string, metadata: Record<string, any> = {}): Promise<{
    success: boolean;
    scheduledEmails: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let scheduledEmails = 0;

    try {
      // Check if user has email preferences that allow welcome sequence
      const userPreferences = await prisma.emailPreferences.findFirst({
        where: { userId }
      });

      if (userPreferences && !userPreferences.welcomeSequence) {
        return {
          success: true,
          scheduledEmails: 0,
          errors: ['User has disabled welcome sequence']
        };
      }

      // Get all onboarding sequence rules
      const onboardingRules = await prisma.emailAutomationRule.findMany({
        where: {
          trigger: EmailTrigger.USER_SIGNUP,
          name: {
            startsWith: 'Onboarding Day'
          },
          isActive: true
        },
        include: {
          template: true
        }
      });

      // Schedule all onboarding emails
      for (const rule of onboardingRules) {
        try {
          const scheduledAt = new Date();
          scheduledAt.setMinutes(scheduledAt.getMinutes() + rule.delay);

          await prisma.emailAutomationExecution.create({
            data: {
              ruleId: rule.id,
              userId,
              scheduledAt,
              status: EmailExecutionStatus.PENDING,
              metadata: {
                ...metadata,
                onboardingSequence: true,
                sequenceType: '7-day-onboarding',
                templateName: rule.template.name
              }
            }
          });

          scheduledEmails++;
        } catch (error) {
          errors.push(`Failed to schedule ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        scheduledEmails,
        errors
      };

    } catch (error) {
      errors.push(`Failed to process onboarding trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        scheduledEmails,
        errors
      };
    }
  }

  /**
   * Get onboarding sequence progress for a user
   */
  async getOnboardingProgress(userId: string): Promise<{
    totalEmails: number;
    scheduledEmails: number;
    sentEmails: number;
    openedEmails: number;
    clickedEmails: number;
    completionRate: number;
    currentDay: number;
    isCompleted: boolean;
    nextEmailDate?: Date;
  }> {
    // Get all onboarding sequence executions for user
    const executions = await prisma.emailAutomationExecution.findMany({
      where: {
        userId,
        rule: {
          name: {
            startsWith: 'Onboarding Day'
          }
        }
      },
      include: {
        rule: {
          include: {
            template: true
          }
        },
        emailLog: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    const totalEmails = 7; // 7-day sequence
    const scheduledEmails = executions.filter(e => e.status !== EmailExecutionStatus.CANCELLED).length;
    const sentEmails = executions.filter(e => e.status === EmailExecutionStatus.COMPLETED && e.emailLog).length;
    const openedEmails = executions.filter(e => e.emailLog?.openedAt).length;
    const clickedEmails = executions.filter(e => e.emailLog?.clickedAt).length;

    const completionRate = totalEmails > 0 ? (sentEmails / totalEmails) * 100 : 0;
    const currentDay = sentEmails + 1;
    const isCompleted = sentEmails >= totalEmails;

    // Find next scheduled email
    const nextExecution = executions.find(e => 
      e.status === EmailExecutionStatus.PENDING && 
      e.scheduledAt > new Date()
    );

    return {
      totalEmails,
      scheduledEmails,
      sentEmails,
      openedEmails,
      clickedEmails,
      completionRate,
      currentDay: Math.min(currentDay, totalEmails),
      isCompleted,
      nextEmailDate: nextExecution?.scheduledAt
    };
  }

  /**
   * Cancel onboarding sequence for a user
   */
  async cancelOnboardingSequence(userId: string, reason: string = 'User request'): Promise<{
    success: boolean;
    cancelledEmails: number;
    message: string;
  }> {
    try {
      // Cancel all pending onboarding sequence executions
      const result = await prisma.emailAutomationExecution.updateMany({
        where: {
          userId,
          status: EmailExecutionStatus.PENDING,
          rule: {
            name: {
              startsWith: 'Onboarding Day'
            }
          }
        },
        data: {
          status: EmailExecutionStatus.CANCELLED,
          metadata: {
            cancelledAt: new Date().toISOString(),
            cancelReason: reason
          }
        }
      });

      return {
        success: true,
        cancelledEmails: result.count,
        message: `Cancelled ${result.count} remaining onboarding emails`
      };

    } catch (error) {
      return {
        success: false,
        cancelledEmails: 0,
        message: `Failed to cancel onboarding sequence: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create default automation rules
   */
  async createDefaultAutomationRules(createdBy: string): Promise<void> {
    // Get default templates
    const welcomeTemplate = await prisma.emailTemplate.findFirst({
      where: { 
        templateType: 'WELCOME',
        name: 'Welcome Email'
      }
    });

    const verificationTemplate = await prisma.emailTemplate.findFirst({
      where: { 
        templateType: 'VERIFICATION',
        name: 'Email Verification'
      }
    });

    const alertTemplate = await prisma.emailTemplate.findFirst({
      where: { 
        templateType: 'ALERT',
        name: 'Child Alert Notification'
      }
    });

    // Get 7-Day Onboarding Templates
    const onboardingTemplates = await this.getOnboardingTemplates();

    // Create default rules
    const defaultRules = [
      {
        name: 'Welcome New Users',
        description: 'Send welcome email to new users immediately after signup',
        trigger: EmailTrigger.USER_SIGNUP,
        triggerConditions: {},
        templateId: welcomeTemplate?.id,
        delay: 0,
        userSegment: UserSegmentType.ALL_USERS,
        priority: EmailPriority.HIGH
      },
      {
        name: 'Verification Follow-up',
        description: 'Send follow-up email if user hasn\'t verified after 24 hours',
        trigger: EmailTrigger.USER_SIGNUP,
        triggerConditions: { verified: false },
        templateId: verificationTemplate?.id,
        delay: 1440, // 24 hours
        userSegment: UserSegmentType.UNVERIFIED_USERS,
        maxSends: 1
      },
      {
        name: 'Alert Notifications',
        description: 'Send email alerts for child safety events',
        trigger: EmailTrigger.ALERT_GENERATED,
        triggerConditions: {},
        templateId: alertTemplate?.id,
        delay: 0,
        userSegment: UserSegmentType.PARENTS,
        priority: EmailPriority.URGENT
      }
    ];

    // Create default rules
    for (const ruleData of defaultRules) {
      if (ruleData.templateId) {
        // Check if rule already exists
        const existing = await prisma.emailAutomationRule.findFirst({
          where: {
            name: ruleData.name,
            trigger: ruleData.trigger
          }
        });

        if (!existing) {
          await this.createAutomationRule({
            ...ruleData,
            templateId: ruleData.templateId, // Ensure templateId is not undefined
            createdBy
          });
        }
      }
    }

    // Create 7-Day Onboarding Sequence Rules separately
    const onboardingRules = this.createOnboardingSequenceRules(onboardingTemplates);
    for (const ruleData of onboardingRules) {
      if (ruleData.templateId) {
        // Check if rule already exists
        const existing = await prisma.emailAutomationRule.findFirst({
          where: {
            name: ruleData.name,
            trigger: ruleData.trigger
          }
        });

        if (!existing) {
          await this.createAutomationRule({
            ...ruleData,
            templateId: ruleData.templateId, // Ensure templateId is not undefined
            createdBy
          });
        }
      }
    }
  }

  /**
   * Create Weekly Safety Tips Campaign Rules
   */
  async createWeeklySafetyTipsCampaign(createdBy: string): Promise<void> {
    const weeklyCampaignRules = await this.getWeeklySafetyTipsCampaignRules();
    
    for (const ruleData of weeklyCampaignRules) {
      if (ruleData.templateId) {
        // Check if rule already exists
        const existing = await prisma.emailAutomationRule.findFirst({
          where: {
            name: ruleData.name,
            trigger: ruleData.trigger
          }
        });

        if (!existing) {
          await this.createAutomationRule({
            ...ruleData,
            templateId: ruleData.templateId,
            createdBy
          });
        }
      }
    }
  }

  /**
   * Get Weekly Safety Tips Campaign Rules Configuration
   */
  private async getWeeklySafetyTipsCampaignRules() {
    // Get the weekly safety tips templates
    const templates = await prisma.emailTemplate.findMany({
      where: {
        name: {
          startsWith: 'Weekly Safety Tips -'
        },
        templateType: EmailTemplateType.NEWSLETTER,
        isActive: true
      }
    });

    const campaignRules = [];

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const weekOffset = i; // Week 0, 1, 2, etc.
      
      campaignRules.push({
        name: `Weekly Safety Tips Campaign - ${template.name.replace('Weekly Safety Tips - ', '')}`,
        description: `Automated weekly safety tips email campaign - ${template.name}`,
        trigger: EmailTrigger.SCHEDULED,
        triggerConditions: {
          scheduleType: 'weekly',
          dayOfWeek: 2, // Tuesday
          hour: 10, // 10 AM
          timezone: 'America/New_York',
          weekOffset: weekOffset,
          campaignType: 'weekly_safety_tips'
        },
        templateId: template.id,
        delay: 0,
        isActive: true,
        maxSends: undefined, // No limit for weekly campaigns
        sendOnWeekends: false,
        sendTimeStart: '08:00',
        sendTimeEnd: '18:00',
        timezone: 'America/New_York',
        userSegment: UserSegmentType.PARENTS,
        priority: EmailPriority.NORMAL,
        stopConditions: {
          unsubscribedFromWeeklyTips: true,
          accountDeactivated: true
        },
        metadata: {
          campaignType: 'weekly_safety_tips',
          weekNumber: weekOffset + 1,
          rotationOrder: i
        }
      });
    }

    return campaignRules;
  }

  /**
   * Process Weekly Campaign Trigger
   */
  async processWeeklyCampaignTrigger(): Promise<{
    success: boolean;
    processedCampaigns: number;
    errors: string[];
  }> {
    try {
      const errors: string[] = [];
      let processedCampaigns = 0;

      // Get active weekly campaign rules
      const weeklyRules = await prisma.emailAutomationRule.findMany({
        where: {
          trigger: EmailTrigger.SCHEDULED,
          isActive: true,
          triggerConditions: {
            path: 'campaignType',
            equals: 'weekly_safety_tips'
          }
        },
        include: {
          template: true
        }
      });

      const now = new Date();
      const currentWeek = this.getWeekNumberFromDate(now);

      for (const rule of weeklyRules) {
        try {
          const triggerConditions = rule.triggerConditions as Record<string, any>;
          const weekOffset = triggerConditions.weekOffset || 0;
          const campaignWeek = (currentWeek + weekOffset) % 8; // Rotate through 8 weeks of content

          // Check if it's time to send this week's email
          if (this.shouldSendWeeklyCampaign(rule, now)) {
            // Get eligible users for this campaign
            const eligibleUsers = await this.getEligibleUsersForWeeklyCampaign(rule);

            for (const user of eligibleUsers) {
              const event: TriggerEvent = {
                trigger: EmailTrigger.SCHEDULED,
                userId: user.id,
                metadata: {
                  campaignType: 'weekly_safety_tips',
                  weekNumber: campaignWeek + 1,
                  ruleId: rule.id
                }
              };
              await this.scheduleRuleExecution(rule, event);
            }

            processedCampaigns++;
          }
        } catch (error) {
          console.error(`Error processing weekly campaign rule ${rule.id}:`, error);
          errors.push(`Rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        processedCampaigns,
        errors
      };

    } catch (error) {
      console.error('Error processing weekly campaign trigger:', error);
      return {
        success: false,
        processedCampaigns: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Check if weekly campaign should be sent
   */
  private shouldSendWeeklyCampaign(rule: EmailAutomationRule, now: Date): boolean {
    const triggerConditions = rule.triggerConditions as Record<string, any>;
    const dayOfWeek = triggerConditions.dayOfWeek || 2; // Tuesday default
    const hour = triggerConditions.hour || 10; // 10 AM default

    // Check if it's the right day of week and hour
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();

    return currentDayOfWeek === dayOfWeek && currentHour === hour;
  }

  /**
   * Get eligible users for weekly campaign
   */
  private async getEligibleUsersForWeeklyCampaign(rule: EmailAutomationRule): Promise<User[]> {
    // Get basic users based on role and email verification
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['PARENT', 'VENUE_ADMIN']
        },
        email: {
          not: ""
        }
      }
    });

    // For now, return all eligible users
    // In the future, we can add more sophisticated filtering based on:
    // - Email preferences
    // - Recent campaign sends
    // - User engagement
    return users;
  }

  /**
   * Get week number from date
   */
  private getWeekNumberFromDate(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  /**
   * Get Weekly Campaign Analytics
   */
  async getWeeklyCampaignAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCampaignsSent: number;
    totalRecipients: number;
    averageOpenRate: number;
    averageClickRate: number;
    topPerformingTemplate: string | null;
    campaignBreakdown: Array<{
      templateName: string;
      sent: number;
      opened: number;
      clicked: number;
      openRate: number;
      clickRate: number;
    }>;
  }> {
    try {
      // Get weekly campaign executions
      const executions = await prisma.emailAutomationExecution.findMany({
        where: {
          scheduledAt: {
            gte: startDate,
            lte: endDate
          },
          rule: {
            triggerConditions: {
              path: 'campaignType',
              equals: 'weekly_safety_tips'
            }
          }
        },
        include: {
          rule: {
            include: {
              template: true
            }
          },
          emailLog: true
        }
      });

      const campaignStats = new Map();
      let totalSent = 0;
      let totalOpened = 0;
      let totalClicked = 0;

      for (const execution of executions) {
        const templateName = `Campaign ${execution.ruleId}`;
        
        if (!campaignStats.has(templateName)) {
          campaignStats.set(templateName, {
            templateName,
            sent: 0,
            opened: 0,
            clicked: 0,
            openRate: 0,
            clickRate: 0
          });
        }

        const stats = campaignStats.get(templateName);
        stats.sent++;
        totalSent++;

        // For now, we'll just count completed executions as "opened"
        // In the future, we can implement proper email tracking
        if (execution.status === EmailExecutionStatus.COMPLETED) {
          stats.opened++;
          totalOpened++;
        }
      }

      // Calculate rates
      const campaignBreakdown = Array.from(campaignStats.values()).map(stats => ({
        ...stats,
        openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
        clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0
      }));

      // Find top performing template
      const topPerformingTemplate = campaignBreakdown.reduce((best, current) => {
        return current.openRate > (best?.openRate || 0) ? current : best;
      }, null as any)?.templateName || null;

      return {
        totalCampaignsSent: executions.length,
        totalRecipients: totalSent,
        averageOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        averageClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        topPerformingTemplate,
        campaignBreakdown
      };

    } catch (error) {
      console.error('Error getting weekly campaign analytics:', error);
      throw new Error('Failed to retrieve weekly campaign analytics');
    }
  }

  /**
   * Update Weekly Campaign User Preferences
   */
  async updateWeeklyCampaignPreferences(
    userId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await prisma.emailPreferences.upsert({
        where: { userId },
        update: {
          weeklyDigest: enabled
        },
        create: {
          userId,
          emailEnabled: true,
          marketingEmails: true,
          weeklyDigest: enabled,
          alertEmails: true
        }
      });
    } catch (error) {
      console.error('Error updating weekly campaign preferences:', error);
      throw new Error('Failed to update weekly campaign preferences');
    }
  }
}

// Export singleton instance
export const emailAutomationEngine = EmailAutomationEngine.getInstance();

