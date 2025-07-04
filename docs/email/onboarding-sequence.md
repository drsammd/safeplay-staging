
# 7-Day Onboarding Email Sequence

## Overview

mySafePlay™(TM)'s automated 7-day onboarding email sequence guides new users through the platform setup, safety features, and best practices. The sequence is designed to maximize user engagement and ensure proper platform adoption.

## Table of Contents

1. [Sequence Overview](#sequence-overview)
2. [Email Templates](#email-templates)
3. [Automation Logic](#automation-logic)
4. [Personalization](#personalization)
5. [Analytics & Optimization](#analytics--optimization)
6. [Configuration](#configuration)

## Sequence Overview

### Email Schedule

| Day | Email Type | Subject | Trigger | Open Rate Target |
|-----|------------|---------|---------|------------------|
| 0 | Welcome | "Welcome to mySafePlay™(TM)!" | User registration | 85% |
| 1 | Setup Guide | "Complete Your mySafePlay™(TM) Setup" | 24 hours after registration | 70% |
| 2 | Safety Tips | "Essential Child Safety Tips" | 48 hours after registration | 65% |
| 3 | Feature Tour | "Discover mySafePlay™(TM) Features" | 72 hours after registration | 60% |
| 5 | Community | "Join the mySafePlay™(TM) Community" | 120 hours after registration | 55% |
| 7 | Feedback | "How's Your mySafePlay™(TM) Experience?" | 168 hours after registration | 50% |

### Sequence Goals

- **User Activation**: Guide users through essential setup steps
- **Feature Adoption**: Introduce key platform features
- **Safety Education**: Provide valuable child safety information
- **Community Building**: Connect users with the mySafePlay™(TM) community
- **Feedback Collection**: Gather user experience insights

## Email Templates

### Day 0: Welcome Email

```handlebars
<!-- templates/onboarding/welcome.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to mySafePlay™(TM)</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{{baseUrl}}/images/safeplay-logo.png" alt="mySafePlay™(TM)" style="height: 60px;">
        </div>
        
        <h1 style="color: #2563eb; text-align: center;">Welcome to mySafePlay™(TM), {{user.name}}!</h1>
        
        <p>Hi {{user.name}},</p>
        
        <p>Thank you for joining mySafePlay™(TM)! We're excited to help you keep your children safe and give you peace of mind.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Complete your profile setup</li>
                <li>Add your children's information</li>
                <li>Explore our safety features</li>
                <li>Connect with your venue</li>
            </ul>
        </div>
        
        {{#if user.children}}
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">Your Children</h3>
            <p>We see you've already added:</p>
            <ul style="margin: 0; padding-left: 20px;">
            {{#each user.children}}
                <li>{{this.firstName}} {{this.lastName}} ({{this.age}} years old)</li>
            {{/each}}
            </ul>
        </div>
        {{/if}}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{baseUrl}}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Get Started
            </a>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
                <strong>Need Help?</strong> Our support team is here for you 24/7. 
                <a href="{{baseUrl}}/support">Contact Support</a>
            </p>
        </div>
        
        <p>Best regards,<br>The mySafePlay™(TM) Team</p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6b7280;">
            <p>You're receiving this email because you signed up for mySafePlay™(TM). 
               <a href="{{unsubscribeUrl}}">Unsubscribe</a> | 
               <a href="{{baseUrl}}/privacy">Privacy Policy</a></p>
        </div>
    </div>
    
    <!-- Tracking pixel -->
    <img src="{{trackingPixelUrl}}" width="1" height="1" style="display: none;">
</body>
</html>
```

### Day 1: Setup Guide

```handlebars
<!-- templates/onboarding/setup-guide.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Your mySafePlay™(TM) Setup</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{{baseUrl}}/images/safeplay-logo.png" alt="mySafePlay™(TM)" style="height: 60px;">
        </div>
        
        <h1 style="color: #2563eb;">Complete Your mySafePlay™(TM) Setup</h1>
        
        <p>Hi {{user.name}},</p>
        
        <p>Let's get your mySafePlay™(TM) account fully set up! Here's your personalized checklist:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Setup Checklist</h3>
            
            {{#each setupSteps}}
            <div style="display: flex; align-items: center; margin: 10px 0; padding: 10px; background: white; border-radius: 6px;">
                {{#if this.completed}}
                    <span style="color: #059669; margin-right: 10px;"></span>
                {{else}}
                    <span style="color: #dc2626; margin-right: 10px;"></span>
                {{/if}}
                <div style="flex: 1;">
                    <strong>{{this.title}}</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">{{this.description}}</p>
                </div>
                {{#unless this.completed}}
                <a href="{{../baseUrl}}{{this.actionUrl}}" 
                   style="background: #2563eb; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px;">
                    {{this.actionText}}
                </a>
                {{/unless}}
            </div>
            {{/each}}
        </div>
        
        {{#unless user.phoneVerified}}
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">* Verify Your Phone Number</h4>
            <p style="margin: 0; font-size: 14px;">
                Phone verification helps us send you important safety alerts and enables two-factor authentication.
            </p>
            <div style="margin-top: 10px;">
                <a href="{{baseUrl}}/verify-phone" 
                   style="background: #f59e0b; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                    Verify Phone
                </a>
            </div>
        </div>
        {{/unless}}
        
        {{#unless user.identityVerified}}
        <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #991b1b;">* Complete Identity Verification</h4>
            <p style="margin: 0; font-size: 14px;">
                Identity verification ensures the highest level of security for your family's safety.
            </p>
            <div style="margin-top: 10px;">
                <a href="{{baseUrl}}/verify-identity" 
                   style="background: #dc2626; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                    Start Verification
                </a>
            </div>
        </div>
        {{/unless}}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{baseUrl}}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Continue Setup
            </a>
        </div>
        
        <p>Questions? Our support team is here to help!</p>
        
        <p>Best regards,<br>The mySafePlay™(TM) Team</p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6b7280;">
            <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{baseUrl}}/privacy">Privacy Policy</a></p>
        </div>
    </div>
    
    <img src="{{trackingPixelUrl}}" width="1" height="1" style="display: none;">
</body>
</html>
```

### Day 2: Safety Tips

```handlebars
<!-- templates/onboarding/safety-tips.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Essential Child Safety Tips</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{{baseUrl}}/images/safeplay-logo.png" alt="mySafePlay™(TM)" style="height: 60px;">
        </div>
        
        <h1 style="color: #2563eb;">Essential Child Safety Tips</h1>
        
        <p>Hi {{user.name}},</p>
        
        <p>Child safety is our top priority. Here are some essential tips to keep your children safe:</p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">* Digital Safety</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Monitor Online Activity:</strong> Keep track of your child's internet usage and social media interactions</li>
                <li><strong>Use Parental Controls:</strong> Set up appropriate filters and time limits on devices</li>
                <li><strong>Teach Digital Citizenship:</strong> Help children understand online etiquette and safety</li>
            </ul>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;"> Home Safety</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Secure Hazardous Items:</strong> Lock away cleaning supplies, medications, and sharp objects</li>
                <li><strong>Install Safety Devices:</strong> Use outlet covers, cabinet locks, and stair gates</li>
                <li><strong>Create Emergency Plans:</strong> Teach children what to do in case of fire or other emergencies</li>
            </ul>
        </div>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1d4ed8;"> Transportation Safety</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Proper Car Seats:</strong> Use age-appropriate car seats and boosters</li>
                <li><strong>Helmet Use:</strong> Always wear helmets when biking, skating, or scootering</li>
                <li><strong>Stranger Danger:</strong> Teach children about safe interactions with strangers</li>
            </ul>
        </div>
        
        {{#if user.children}}
        <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #7c3aed;"> Age-Specific Tips</h3>
            {{#each user.children}}
            <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px;">
                <strong>{{this.firstName}} ({{this.age}} years old):</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">
                    {{#if (lt this.age 3)}}
                    Focus on constant supervision, baby-proofing, and safe sleep practices.
                    {{else if (lt this.age 6)}}
                    Teach basic safety rules, practice emergency contacts, and supervise play.
                    {{else if (lt this.age 12)}}
                    Discuss stranger safety, internet rules, and emergency procedures.
                    {{else}}
                    Focus on digital citizenship, peer pressure, and independence with safety.
                    {{/if}}
                </p>
            </div>
            {{/each}}
        </div>
        {{/if}}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{baseUrl}}/safety-resources" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                More Safety Resources
            </a>
        </div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
                <strong>* Pro Tip:</strong> Create a family safety plan and practice it regularly. 
                Make safety discussions a normal part of your routine!
            </p>
        </div>
        
        <p>Stay safe,<br>The mySafePlay™(TM) Team</p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6b7280;">
            <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{baseUrl}}/privacy">Privacy Policy</a></p>
        </div>
    </div>
    
    <img src="{{trackingPixelUrl}}" width="1" height="1" style="display: none;">
</body>
</html>
```

## Automation Logic

### Onboarding Automation Rules

```typescript
// lib/email/onboarding-automation.ts
export class OnboardingAutomation {
  private readonly ONBOARDING_SEQUENCE = [
    {
      day: 0,
      templateId: 'onboarding-welcome',
      delay: 0,
      trigger: 'USER_REGISTRATION'
    },
    {
      day: 1,
      templateId: 'onboarding-setup-guide',
      delay: 24 * 60, // 24 hours in minutes
      conditions: { emailVerified: true }
    },
    {
      day: 2,
      templateId: 'onboarding-safety-tips',
      delay: 48 * 60, // 48 hours in minutes
      conditions: { accountActive: true }
    },
    {
      day: 3,
      templateId: 'onboarding-feature-tour',
      delay: 72 * 60, // 72 hours in minutes
      conditions: { hasLoggedIn: true }
    },
    {
      day: 5,
      templateId: 'onboarding-community',
      delay: 120 * 60, // 120 hours in minutes
      conditions: { profileComplete: 50 } // 50% profile completion
    },
    {
      day: 7,
      templateId: 'onboarding-feedback',
      delay: 168 * 60, // 168 hours in minutes
      conditions: { hasUsedFeatures: true }
    }
  ];
  
  async setupOnboardingSequence(userId: string): Promise<void> {
    const user = await this.getUserDetails(userId);
    
    for (const email of this.ONBOARDING_SEQUENCE) {
      await this.createAutomationRule({
        name: `Onboarding Day ${email.day} - ${user.email}`,
        trigger: email.trigger || 'SCHEDULED',
        templateId: email.templateId,
        userId,
        delay: email.delay,
        conditions: {
          ...email.conditions,
          onboardingSequence: true,
          sequenceDay: email.day
        },
        maxSends: 1, // Only send once
        isActive: true
      });
    }
  }
  
  async checkOnboardingConditions(userId: string, sequenceDay: number): Promise<boolean> {
    const user = await this.getUserWithProgress(userId);
    const email = this.ONBOARDING_SEQUENCE.find(e => e.day === sequenceDay);
    
    if (!email?.conditions) return true;
    
    // Check each condition
    for (const [condition, value] of Object.entries(email.conditions)) {
      switch (condition) {
        case 'emailVerified':
          if (value && !user.emailVerified) return false;
          break;
        case 'accountActive':
          if (value && !this.isAccountActive(user)) return false;
          break;
        case 'hasLoggedIn':
          if (value && !user.lastLoginAt) return false;
          break;
        case 'profileComplete':
          if (this.getProfileCompletionPercentage(user) < value) return false;
          break;
        case 'hasUsedFeatures':
          if (value && !this.hasUsedAnyFeatures(user)) return false;
          break;
      }
    }
    
    return true;
  }
  
  async pauseOnboardingSequence(userId: string, reason: string): Promise<void> {
    await this.updateAutomationRules({
      userId,
      onboardingSequence: true,
      isActive: false,
      pausedReason: reason,
      pausedAt: new Date()
    });
  }
  
  async resumeOnboardingSequence(userId: string): Promise<void> {
    const pausedRules = await this.getAutomationRules({
      userId,
      onboardingSequence: true,
      isActive: false
    });
    
    for (const rule of pausedRules) {
      // Recalculate delay based on current time
      const newDelay = this.calculateAdjustedDelay(rule);
      
      await this.updateAutomationRule(rule.id, {
        isActive: true,
        delay: newDelay,
        pausedReason: null,
        resumedAt: new Date()
      });
    }
  }
  
  private getProfileCompletionPercentage(user: any): number {
    const requiredFields = [
      'name', 'email', 'phone', 'children', 
      'emergencyContacts', 'preferences'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = user[field];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });
    
    return (completedFields.length / requiredFields.length) * 100;
  }
  
  private hasUsedAnyFeatures(user: any): boolean {
    return !!(
      user.lastDashboardVisit ||
      user.alertsViewed > 0 ||
      user.childrenAdded > 0 ||
      user.venuesConnected > 0
    );
  }
}
```

### Smart Timing Logic

```typescript
// lib/email/smart-timing.ts
export class SmartEmailTiming {
  async getOptimalSendTime(userId: string): Promise<Date> {
    const user = await this.getUserWithTimezone(userId);
    const userTimezone = user.timezone || 'America/New_York';
    
    // Get user's historical email engagement patterns
    const engagementData = await this.getUserEngagementPatterns(userId);
    
    // Default optimal times by timezone
    const defaultOptimalHours = {
      morning: 9,   // 9 AM
      afternoon: 14, // 2 PM
      evening: 19   // 7 PM
    };
    
    // Determine best time based on user patterns or defaults
    const optimalHour = engagementData.bestHour || defaultOptimalHours.morning;
    
    // Calculate next optimal send time
    const now = new Date();
    const userNow = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
    
    let sendTime = new Date(userNow);
    sendTime.setHours(optimalHour, 0, 0, 0);
    
    // If optimal time has passed today, schedule for tomorrow
    if (sendTime <= userNow) {
      sendTime.setDate(sendTime.getDate() + 1);
    }
    
    // Avoid weekends for business-related emails
    if (this.isWeekend(sendTime)) {
      sendTime = this.getNextWeekday(sendTime);
      sendTime.setHours(optimalHour, 0, 0, 0);
    }
    
    return sendTime;
  }
  
  async trackEmailEngagement(userId: string, emailId: string, action: 'open' | 'click'): Promise<void> {
    const email = await this.getEmailLog(emailId);
    const sendTime = new Date(email.sentAt);
    const actionTime = new Date();
    
    await this.updateUserEngagementPatterns(userId, {
      hour: sendTime.getHours(),
      dayOfWeek: sendTime.getDay(),
      action,
      responseTime: actionTime.getTime() - sendTime.getTime()
    });
  }
  
  private async getUserEngagementPatterns(userId: string): Promise<EngagementPatterns> {
    const patterns = await this.engagementRepository.findByUserId(userId);
    
    if (!patterns) {
      return { bestHour: null, bestDayOfWeek: null, avgResponseTime: null };
    }
    
    return patterns;
  }
}
```

## Personalization

### Dynamic Content Generation

```typescript
// lib/email/personalization.ts
export class OnboardingPersonalization {
  async generatePersonalizedContent(userId: string, templateId: string): Promise<PersonalizedContent> {
    const user = await this.getUserWithRelations(userId);
    const template = await this.getTemplate(templateId);
    
    // Generate personalized data based on user profile
    const personalizedData = {
      user: this.sanitizeUserData(user),
      setupSteps: await this.generateSetupSteps(user),
      safetyTips: await this.generatePersonalizedSafetyTips(user),
      features: await this.getRelevantFeatures(user),
      community: await this.getCommunityRecommendations(user),
      baseUrl: process.env.NEXTAUTH_URL,
      unsubscribeUrl: this.generateUnsubscribeUrl(userId),
      trackingPixelUrl: this.generateTrackingPixelUrl(userId, templateId)
    };
    
    return {
      htmlContent: this.renderTemplate(template.htmlContent, personalizedData),
      textContent: this.renderTemplate(template.textContent || '', personalizedData),
      subject: this.renderTemplate(template.subject, personalizedData),
      personalizedData
    };
  }
  
  private async generateSetupSteps(user: any): Promise<SetupStep[]> {
    const steps = [
      {
        title: 'Complete Profile',
        description: 'Add your personal information and preferences',
        completed: this.isProfileComplete(user),
        actionUrl: '/profile',
        actionText: 'Complete Profile'
      },
      {
        title: 'Add Children',
        description: 'Add your children\'s information for safety monitoring',
        completed: user.children && user.children.length > 0,
        actionUrl: '/children/add',
        actionText: 'Add Children'
      },
      {
        title: 'Verify Phone',
        description: 'Verify your phone number for security and alerts',
        completed: user.phoneVerified,
        actionUrl: '/verify-phone',
        actionText: 'Verify Phone'
      },
      {
        title: 'Connect Venue',
        description: 'Connect with your child\'s daycare or school',
        completed: user.connectedVenues && user.connectedVenues.length > 0,
        actionUrl: '/venues/connect',
        actionText: 'Connect Venue'
      },
      {
        title: 'Enable 2FA',
        description: 'Enable two-factor authentication for maximum security',
        completed: user.twoFactorEnabled,
        actionUrl: '/security/2fa',
        actionText: 'Enable 2FA'
      }
    ];
    
    return steps;
  }
  
  private async generatePersonalizedSafetyTips(user: any): Promise<SafetyTip[]> {
    const tips = [];
    
    if (user.children) {
      for (const child of user.children) {
        const ageTips = await this.getAgeSpecificTips(child.age);
        tips.push(...ageTips);
      }
    }
    
    // Add general tips based on user preferences
    if (user.preferences?.interests?.includes('digital_safety')) {
      tips.push(...await this.getDigitalSafetyTips());
    }
    
    if (user.preferences?.interests?.includes('home_safety')) {
      tips.push(...await this.getHomeSafetyTips());
    }
    
    return tips.slice(0, 5); // Limit to 5 tips per email
  }
  
  private async getRelevantFeatures(user: any): Promise<Feature[]> {
    const allFeatures = await this.getAllFeatures();
    
    // Filter features based on user's role and setup progress
    return allFeatures.filter(feature => {
      if (feature.requiresChildren && (!user.children || user.children.length === 0)) {
        return false;
      }
      
      if (feature.requiresVenue && (!user.connectedVenues || user.connectedVenues.length === 0)) {
        return false;
      }
      
      if (feature.userRoles && !feature.userRoles.includes(user.role)) {
        return false;
      }
      
      return true;
    });
  }
}
```

## Analytics & Optimization

### Onboarding Metrics Tracking

```typescript
// lib/email/onboarding-analytics.ts
export class OnboardingAnalytics {
  async trackOnboardingMetrics(): Promise<OnboardingMetrics> {
    const dateRange = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date()
    };
    
    const metrics = {
      totalUsers: await this.getTotalNewUsers(dateRange),
      sequenceCompletion: await this.getSequenceCompletionRates(dateRange),
      emailPerformance: await this.getEmailPerformanceByDay(dateRange),
      userActivation: await this.getUserActivationRates(dateRange),
      dropoffPoints: await this.getDropoffAnalysis(dateRange)
    };
    
    return metrics;
  }
  
  async getSequenceCompletionRates(dateRange: DateRange): Promise<SequenceCompletionRates> {
    const users = await this.getUsersInDateRange(dateRange);
    const completionRates = {};
    
    for (let day = 0; day <= 7; day++) {
      const usersWhoReachedDay = users.filter(user => 
        this.hasUserReachedSequenceDay(user, day)
      );
      
      const usersWhoCompletedDay = usersWhoReachedDay.filter(user =>
        this.hasUserCompletedSequenceDay(user, day)
      );
      
      completionRates[`day${day}`] = {
        reached: usersWhoReachedDay.length,
        completed: usersWhoCompletedDay.length,
        rate: usersWhoReachedDay.length > 0 
          ? (usersWhoCompletedDay.length / usersWhoReachedDay.length) * 100 
          : 0
      };
    }
    
    return completionRates;
  }
  
  async getEmailPerformanceByDay(dateRange: DateRange): Promise<EmailPerformanceByDay> {
    const performance = {};
    
    for (let day = 0; day <= 7; day++) {
      const emails = await this.getOnboardingEmailsByDay(day, dateRange);
      
      performance[`day${day}`] = {
        sent: emails.length,
        delivered: emails.filter(e => e.status === 'DELIVERED').length,
        opened: emails.filter(e => e.openedAt).length,
        clicked: emails.filter(e => e.clickedAt).length,
        unsubscribed: emails.filter(e => e.unsubscribedAt).length,
        
        // Calculate rates
        deliveryRate: this.calculateRate(emails, 'DELIVERED'),
        openRate: this.calculateRate(emails, 'openedAt'),
        clickRate: this.calculateRate(emails, 'clickedAt'),
        unsubscribeRate: this.calculateRate(emails, 'unsubscribedAt')
      };
    }
    
    return performance;
  }
  
  async optimizeOnboardingSequence(): Promise<OptimizationRecommendations> {
    const metrics = await this.trackOnboardingMetrics();
    const recommendations = [];
    
    // Analyze drop-off points
    for (const [day, data] of Object.entries(metrics.sequenceCompletion)) {
      if (data.rate < 70) { // Less than 70% completion
        recommendations.push({
          type: 'IMPROVE_EMAIL',
          day: parseInt(day.replace('day', '')),
          issue: 'Low completion rate',
          suggestion: 'Review email content and timing',
          priority: 'HIGH'
        });
      }
    }
    
    // Analyze email performance
    for (const [day, data] of Object.entries(metrics.emailPerformance)) {
      if (data.openRate < 50) {
        recommendations.push({
          type: 'IMPROVE_SUBJECT',
          day: parseInt(day.replace('day', '')),
          issue: 'Low open rate',
          suggestion: 'A/B test subject lines',
          priority: 'MEDIUM'
        });
      }
      
      if (data.clickRate < 10) {
        recommendations.push({
          type: 'IMPROVE_CTA',
          day: parseInt(day.replace('day', '')),
          issue: 'Low click rate',
          suggestion: 'Optimize call-to-action buttons',
          priority: 'MEDIUM'
        });
      }
    }
    
    return {
      recommendations,
      overallScore: this.calculateOverallScore(metrics),
      nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
  }
  
  private calculateRate(emails: any[], field: string): number {
    if (emails.length === 0) return 0;
    
    const count = field === 'DELIVERED' 
      ? emails.filter(e => e.status === field).length
      : emails.filter(e => e[field]).length;
    
    return (count / emails.length) * 100;
  }
}
```

## Configuration

### Onboarding Configuration

```typescript
// config/onboarding.ts
export const onboardingConfig = {
  sequence: {
    enabled: true,
    maxDuration: 14, // days
    allowSkipping: false,
    pauseOnUnsubscribe: true
  },
  
  timing: {
    respectTimezones: true,
    avoidWeekends: false,
    optimalHours: [9, 14, 19], // 9 AM, 2 PM, 7 PM
    minDelayBetweenEmails: 12 // hours
  },
  
  personalization: {
    enabled: true,
    useAI: true,
    dynamicContent: true,
    ageSpecificTips: true
  },
  
  analytics: {
    trackOpens: true,
    trackClicks: true,
    trackConversions: true,
    generateReports: true
  },
  
  optimization: {
    abTestSubjects: true,
    abTestContent: false,
    autoOptimize: true,
    reviewInterval: 7 // days
  }
};

// Environment-specific overrides
export const getOnboardingConfig = () => {
  const config = { ...onboardingConfig };
  
  if (process.env.NODE_ENV === 'development') {
    config.timing.minDelayBetweenEmails = 0.1; // 6 minutes for testing
  }
  
  if (process.env.ONBOARDING_DISABLED === 'true') {
    config.sequence.enabled = false;
  }
  
  return config;
};
```

---

*For additional configuration options and advanced personalization features, refer to the main email automation documentation.*
