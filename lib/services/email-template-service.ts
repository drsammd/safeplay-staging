// @ts-nocheck


import { prisma } from '@/lib/db';
import { 
  EmailTemplate, 
  EmailTemplateType, 
  EmailCategory,
  User 
} from '@prisma/client';
// Handlebars temporarily disabled to fix build issues
// TODO: Re-enable handlebars with proper webpack configuration
let Handlebars: any = null;
console.warn('Handlebars disabled during build - email templating will use fallback');

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  example?: any;
}

export interface CreateTemplateData {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateType: EmailTemplateType;
  category: EmailCategory;
  variables?: TemplateVariable[];
  metadata?: Record<string, any>;
  designConfig?: Record<string, any>;
  createdBy: string;
}

export interface UpdateTemplateData {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  templateType?: EmailTemplateType;
  category?: EmailCategory;
  variables?: TemplateVariable[];
  metadata?: Record<string, any>;
  designConfig?: Record<string, any>;
  isActive?: boolean;
  lastModifiedBy: string;
}

export interface TemplatePreviewData {
  variables: Record<string, any>;
}

export class EmailTemplateService {
  private static instance: EmailTemplateService;

  static getInstance(): EmailTemplateService {
    if (!EmailTemplateService.instance) {
      EmailTemplateService.instance = new EmailTemplateService();
    }
    return EmailTemplateService.instance;
  }

  /**
   * Create a new email template
   */
  async createTemplate(data: CreateTemplateData): Promise<EmailTemplate> {
    return await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        templateType: data.templateType,
        category: data.category,
        variables: data.variables as any || [],
        metadata: data.metadata || {},
        designConfig: data.designConfig || {},
        createdBy: data.createdBy,
        lastModifiedBy: data.createdBy,
        version: 1
      }
    });
  }

  /**
   * Update an existing email template
   */
  async updateTemplate(id: string, data: UpdateTemplateData): Promise<EmailTemplate> {
    const currentTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!currentTemplate) {
      throw new Error('Template not found');
    }

    return await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...data,
        variables: data.variables as any,
        version: currentTemplate.version + 1,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    return await prisma.emailTemplate.findUnique({
      where: { id }
    });
  }

  /**
   * Get templates with filtering and pagination
   */
  async getTemplates(params: {
    templateType?: EmailTemplateType;
    category?: EmailCategory;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    templates: EmailTemplate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (params.templateType) {
      where.templateType = params.templateType;
    }
    
    if (params.category) {
      where.category = params.category;
    }
    
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { subject: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailTemplate.count({ where })
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    // Check if template is being used
    const usage = await prisma.emailLog.count({
      where: { templateId: id }
    });

    if (usage > 0) {
      // Don't delete, just deactivate
      await prisma.emailTemplate.update({
        where: { id },
        data: { isActive: false }
      });
    } else {
      // Safe to delete
      await prisma.emailTemplate.delete({
        where: { id }
      });
    }
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(id: string, previewData: TemplatePreviewData): Promise<{
    subject: string;
    htmlContent: string;
    textContent?: string;
  }> {
    const template = await this.getTemplate(id);
    
    if (!template) {
      throw new Error('Template not found');
    }

    return this.renderTemplate(template, previewData.variables);
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: EmailTemplate, variables: Record<string, any>): {
    subject: string;
    htmlContent: string;
    textContent?: string;
  } {
    try {
      const subjectTemplate = Handlebars.compile(template.subject);
      const htmlTemplate = Handlebars.compile(template.htmlContent);
      const textTemplate = template.textContent ? Handlebars.compile(template.textContent) : null;

      return {
        subject: subjectTemplate(variables),
        htmlContent: htmlTemplate(variables),
        textContent: textTemplate ? textTemplate(variables) : undefined
      };
    } catch (error) {
      console.error('Error rendering template:', error);
      throw new Error('Template rendering failed');
    }
  }

  /**
   * Validate template syntax
   */
  validateTemplate(htmlContent: string, textContent?: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      Handlebars.compile(htmlContent);
    } catch (error) {
      errors.push(`HTML template error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (textContent) {
      try {
        Handlebars.compile(textContent);
      } catch (error) {
        errors.push(`Text template error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get template variables from content
   */
  extractVariables(content: string): string[] {
    const variables: string[] = [];
    const regex = /\{\{\s*([^}]+)\s*\}\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim().split('.')[0].split(' ')[0];
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Create default system templates
   */
  async createDefaultTemplates(createdBy: string): Promise<void> {
    const defaultTemplates = [
      {
        name: 'Welcome Email',
        subject: 'Welcome to SafePlay, {{userName}}!',
        templateType: EmailTemplateType.WELCOME,
        category: EmailCategory.SYSTEM,
        htmlContent: this.getWelcomeTemplateHtml(),
        textContent: this.getWelcomeTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s display name' },
          { name: 'userEmail', type: 'string', required: true, description: 'User\'s email address' },
          { name: 'loginUrl', type: 'string', required: true, description: 'Login URL' },
          { name: 'supportEmail', type: 'string', required: false, description: 'Support email address' }
        ]
      },
      {
        name: 'Email Verification',
        subject: 'Verify your SafePlay email address',
        templateType: EmailTemplateType.VERIFICATION,
        category: EmailCategory.SECURITY,
        htmlContent: this.getVerificationTemplateHtml(),
        textContent: this.getVerificationTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s display name' },
          { name: 'verificationCode', type: 'string', required: true, description: 'Verification code' },
          { name: 'expiryTime', type: 'string', required: true, description: 'Code expiry time' }
        ]
      },
      {
        name: 'Child Alert Notification',
        subject: 'SafePlay Alert: {{alertType}}',
        templateType: EmailTemplateType.ALERT,
        category: EmailCategory.NOTIFICATIONS,
        htmlContent: this.getAlertTemplateHtml(),
        textContent: this.getAlertTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'Parent\'s name' },
          { name: 'childName', type: 'string', required: true, description: 'Child\'s name' },
          { name: 'alertType', type: 'string', required: true, description: 'Type of alert' },
          { name: 'alertMessage', type: 'string', required: true, description: 'Alert message' },
          { name: 'venueName', type: 'string', required: true, description: 'Venue name' },
          { name: 'alertTime', type: 'date', required: true, description: 'When alert was triggered' },
          { name: 'dashboardUrl', type: 'string', required: true, description: 'Dashboard URL' }
        ]
      },
      {
        name: 'Monthly Activity Report',
        subject: 'Your SafePlay Monthly Report',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getMonthlyReportTemplateHtml(),
        textContent: this.getMonthlyReportTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s name' },
          { name: 'month', type: 'string', required: true, description: 'Report month' },
          { name: 'totalVisits', type: 'number', required: true, description: 'Total venue visits' },
          { name: 'totalHours', type: 'number', required: true, description: 'Total hours at venues' },
          { name: 'favoriteVenue', type: 'string', required: false, description: 'Most visited venue' },
          { name: 'newFeatures', type: 'object', required: false, description: 'New features array' }
        ]
      }
    ];

    // Create default templates
    for (const templateData of defaultTemplates) {
      // Check if template already exists
      const existing = await prisma.emailTemplate.findFirst({
        where: {
          name: templateData.name,
          templateType: templateData.templateType
        }
      });

      if (!existing) {
        await this.createTemplate({
          ...templateData,
          createdBy,
          variables: templateData.variables as TemplateVariable[]
        });
      }
    }

    // Create 7-Day Onboarding Sequence Templates separately
    const onboardingSequenceTemplates = this.getOnboardingSequenceTemplates();
    for (const templateData of onboardingSequenceTemplates) {
      // Check if template already exists
      const existing = await prisma.emailTemplate.findFirst({
        where: {
          name: templateData.name,
          templateType: templateData.templateType
        }
      });

      if (!existing) {
        await this.createTemplate({
          ...templateData,
          createdBy,
          variables: templateData.variables as TemplateVariable[]
        });
      }
    }

    // Create Weekly Safety Tips Campaign Templates
    const weeklySafetyTipsTemplates = this.getWeeklySafetyTipsTemplates();
    for (const templateData of weeklySafetyTipsTemplates) {
      // Check if template already exists
      const existing = await prisma.emailTemplate.findFirst({
        where: {
          name: templateData.name,
          templateType: templateData.templateType
        }
      });

      if (!existing) {
        await this.createTemplate({
          ...templateData,
          createdBy,
          variables: templateData.variables as TemplateVariable[]
        });
      }
    }
  }

  /**
   * Get 7-Day Onboarding Sequence Templates
   */
  private getOnboardingSequenceTemplates() {
    return [
      {
        name: 'Onboarding Day 1 - Welcome & Getting Started',
        subject: 'Welcome to SafePlay! Let\'s get you started 🎉',
        templateType: EmailTemplateType.ONBOARDING,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getOnboardingDay1Html(),
        textContent: this.getOnboardingDay1Text(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'dashboardUrl', type: 'string', required: true, description: 'Dashboard URL' },
          { name: 'helpCenterUrl', type: 'string', required: true, description: 'Help center URL' },
          { name: 'videoTutorialUrl', type: 'string', required: false, description: 'Getting started video URL' }
        ]
      },
      {
        name: 'Onboarding Day 2 - Setting Up Child Profiles',
        subject: 'Step 2: Add your children to SafePlay 👶',
        templateType: EmailTemplateType.ONBOARDING,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getOnboardingDay2Html(),
        textContent: this.getOnboardingDay2Text(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'childrenUrl', type: 'string', required: true, description: 'Children management URL' },
          { name: 'profileGuideUrl', type: 'string', required: true, description: 'Profile setup guide URL' },
          { name: 'hasChildren', type: 'boolean', required: false, description: 'Whether user has already added children' }
        ]
      },
      {
        name: 'Onboarding Day 3 - Understanding Biometric Features',
        subject: 'Day 3: Secure biometric registration 🔒',
        templateType: EmailTemplateType.ONBOARDING,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getOnboardingDay3Html(),
        textContent: this.getOnboardingDay3Text(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'biometricUrl', type: 'string', required: true, description: 'Biometric registration URL' },
          { name: 'securityGuideUrl', type: 'string', required: true, description: 'Security guide URL' },
          { name: 'hasBiometricData', type: 'boolean', required: false, description: 'Whether user has set up biometrics' }
        ]
      },
      {
        name: 'Onboarding Day 4 - Check-in/Check-out System',
        subject: 'Day 4: Master the check-in process ✅',
        templateType: EmailTemplateType.ONBOARDING,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getOnboardingDay4Html(),
        textContent: this.getOnboardingDay4Text(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'checkInGuideUrl', type: 'string', required: true, description: 'Check-in guide URL' },
          { name: 'mobileAppUrl', type: 'string', required: true, description: 'Mobile app download URL' },
          { name: 'qrCodeGuideUrl', type: 'string', required: true, description: 'QR code guide URL' }
        ]
      },
      {
        name: 'Onboarding Day 5 - Alerts and Notifications',
        subject: 'Day 5: Stay informed with smart alerts 🔔',
        templateType: EmailTemplateType.ONBOARDING,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getOnboardingDay5Html(),
        textContent: this.getOnboardingDay5Text(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'alertSettingsUrl', type: 'string', required: true, description: 'Alert settings URL' },
          { name: 'notificationPrefsUrl', type: 'string', required: true, description: 'Notification preferences URL' },
          { name: 'emergencyGuideUrl', type: 'string', required: true, description: 'Emergency procedures guide URL' }
        ]
      },
      {
        name: 'Onboarding Day 6 - Safety Analytics',
        subject: 'Day 6: Discover powerful safety insights 📊',
        templateType: EmailTemplateType.ONBOARDING,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getOnboardingDay6Html(),
        textContent: this.getOnboardingDay6Text(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'analyticsUrl', type: 'string', required: true, description: 'Analytics dashboard URL' },
          { name: 'reportsGuideUrl', type: 'string', required: true, description: 'Reports guide URL' },
          { name: 'hasAnalyticsData', type: 'boolean', required: false, description: 'Whether user has analytics data' }
        ]
      },
      {
        name: 'Onboarding Day 7 - Advanced Features & Tips',
        subject: 'Day 7: You\'re now a SafePlay expert! 🌟',
        templateType: EmailTemplateType.ONBOARDING,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getOnboardingDay7Html(),
        textContent: this.getOnboardingDay7Text(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'advancedFeaturesUrl', type: 'string', required: true, description: 'Advanced features URL' },
          { name: 'communityUrl', type: 'string', required: true, description: 'Community forum URL' },
          { name: 'supportUrl', type: 'string', required: true, description: 'Support contact URL' },
          { name: 'completionBadgeUrl', type: 'string', required: false, description: 'Onboarding completion badge URL' }
        ]
      }
    ];
  }

  /**
   * Template HTML content generators
   */
  private getWelcomeTemplateHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SafePlay</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .content { padding: 40px 30px; }
    .welcome-section { text-align: center; margin-bottom: 40px; }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
    .feature-item { text-align: center; padding: 20px; background: #f8f9ff; border-radius: 8px; }
    .feature-icon { font-size: 24px; margin-bottom: 10px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SafePlay</div>
      <p>Welcome to the future of family safety</p>
    </div>
    
    <div class="content">
      <div class="welcome-section">
        <h1>Welcome, {{userName}}! 🎉</h1>
        <p>Thank you for joining SafePlay! We're excited to help you keep your family safe and connected.</p>
      </div>

      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-icon">🛡️</div>
          <h3>Real-time Safety</h3>
          <p>Get instant alerts about your children's whereabouts</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📱</div>
          <h3>Mobile Access</h3>
          <p>Stay connected on the go with our mobile app</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤖</div>
          <h3>AI-Powered</h3>
          <p>Advanced recognition technology for better safety</p>
        </div>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <h2>Ready to get started?</h2>
        <p>Complete your profile setup and add your first child to begin using SafePlay.</p>
        <a href="{{loginUrl}}" class="cta-button">Get Started</a>
      </div>

      <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3>Need Help?</h3>
        <p>Our support team is here to help you every step of the way. Don't hesitate to reach out if you have any questions.</p>
        <p><strong>Email:</strong> {{supportEmail}}</p>
      </div>
    </div>

    <div class="footer">
      <p>You're receiving this email because you created an account with SafePlay.</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getWelcomeTemplateText(): string {
    return `
Welcome to SafePlay, {{userName}}!

Thank you for joining SafePlay! We're excited to help you keep your family safe and connected.

SafePlay Features:
🛡️ Real-time Safety - Get instant alerts about your children's whereabouts
📱 Mobile Access - Stay connected on the go with our mobile app  
🤖 AI-Powered - Advanced recognition technology for better safety

Ready to get started?
Complete your profile setup and add your first child to begin using SafePlay.

Get Started: {{loginUrl}}

Need Help?
Our support team is here to help you every step of the way. Don't hesitate to reach out if you have any questions.

Email: {{supportEmail}}

SafePlay - Keeping families safe, everywhere.
`;
  }

  private getVerificationTemplateHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #667eea; color: white; padding: 30px; text-align: center; }
    .content { padding: 40px 30px; text-align: center; }
    .verification-code { background: #f8f9ff; border: 2px dashed #667eea; padding: 20px; margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 3px; color: #667eea; }
    .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SafePlay</h1>
      <p>Email Verification Required</p>
    </div>
    
    <div class="content">
      <h2>Hi {{userName}},</h2>
      <p>Please verify your email address to complete your SafePlay account setup.</p>
      
      <div class="verification-code">
        {{verificationCode}}
      </div>
      
      <p>Enter this code in the verification form to confirm your email address.</p>
      <p><strong>This code expires in {{expiryTime}}.</strong></p>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Security Note:</strong> If you didn't request this verification, please ignore this email.</p>
      </div>
    </div>

    <div class="footer">
      <p>SafePlay - Keeping families safe</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getVerificationTemplateText(): string {
    return `
SafePlay Email Verification

Hi {{userName}},

Please verify your email address to complete your SafePlay account setup.

Verification Code: {{verificationCode}}

Enter this code in the verification form to confirm your email address.
This code expires in {{expiryTime}}.

Security Note: If you didn't request this verification, please ignore this email.

SafePlay - Keeping families safe
`;
  }

  private getAlertTemplateHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafePlay Alert</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #e74c3c; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .alert-box { background: #fff5f5; border-left: 4px solid #e74c3c; padding: 20px; margin: 20px 0; }
    .alert-details { background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 SafePlay Alert</h1>
      <p>{{alertType}}</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h2>Hi {{userName}},</h2>
        <p><strong>{{alertMessage}}</strong></p>
      </div>
      
      <div class="alert-details">
        <h3>Alert Details:</h3>
        <ul>
          <li><strong>Child:</strong> {{childName}}</li>
          <li><strong>Venue:</strong> {{venueName}}</li>
          <li><strong>Time:</strong> {{formatDate alertTime}}</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="cta-button">View Dashboard</a>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>What to do:</strong> Please check your SafePlay dashboard for more details and take appropriate action if needed.</p>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated safety alert from SafePlay.</p>
      <p>SafePlay - Keeping families safe</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getAlertTemplateText(): string {
    return `
SafePlay Alert: {{alertType}}

Hi {{userName}},

{{alertMessage}}

Alert Details:
- Child: {{childName}}
- Venue: {{venueName}}  
- Time: {{alertTime}}

What to do: Please check your SafePlay dashboard for more details and take appropriate action if needed.

View Dashboard: {{dashboardUrl}}

This is an automated safety alert from SafePlay.
SafePlay - Keeping families safe
`;
  }

  private getMonthlyReportTemplateHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafePlay Monthly Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 30px 0; }
    .stat-item { text-align: center; padding: 20px; background: #f8f9ff; border-radius: 8px; }
    .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 14px; color: #666; }
    .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Monthly Report</h1>
      <p>Your SafePlay activity for {{month}}</p>
    </div>
    
    <div class="content">
      <h2>Hi {{userName}},</h2>
      <p>Here's a summary of your family's SafePlay activity this month:</p>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{totalVisits}}</div>
          <div class="stat-label">Venue Visits</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{totalHours}}</div>
          <div class="stat-label">Hours of Fun</div>
        </div>
      </div>
      
      {{#if favoriteVenue}}
      <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🏆 Favorite Venue</h3>
        <p>Your family spent the most time at <strong>{{favoriteVenue}}</strong> this month!</p>
      </div>
      {{/if}}
      
      {{#if newFeatures}}
      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🆕 New Features</h3>
        <p>Check out these new SafePlay features:</p>
        <ul>
          {{#each newFeatures}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>
      {{/if}}
    </div>

    <div class="footer">
      <p>Thanks for using SafePlay to keep your family safe!</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getMonthlyReportTemplateText(): string {
    return `
SafePlay Monthly Report - {{month}}

Hi {{userName}},

Here's a summary of your family's SafePlay activity this month:

📊 Your Statistics:
- Venue Visits: {{totalVisits}}
- Hours of Fun: {{totalHours}}

{{#if favoriteVenue}}
🏆 Favorite Venue: {{favoriteVenue}}
{{/if}}

{{#if newFeatures}}
🆕 New Features:
{{#each newFeatures}}
- {{this}}
{{/each}}
{{/if}}

Thanks for using SafePlay to keep your family safe!
SafePlay - Keeping families safe, everywhere.
`;
  }

  // 7-Day Onboarding Sequence Template Generators

  private getOnboardingDay1Html(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SafePlay!</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .day-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .content { padding: 40px 30px; }
    .welcome-section { text-align: center; margin-bottom: 40px; }
    .hero-text { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 20px; }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
    .feature-item { text-align: center; padding: 20px; background: #f8f9ff; border-radius: 8px; border: 2px solid #e1e8ff; }
    .feature-icon { font-size: 32px; margin-bottom: 15px; }
    .step-item { margin: 25px 0; padding: 20px; background: #fff8f0; border-left: 4px solid #ff8c42; border-radius: 0 8px 8px 0; }
    .step-number { background: #ff8c42; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; transition: background 0.3s; }
    .cta-button:hover { background: #5a6fd8; }
    .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px; }
    .progress-bar { width: 100%; height: 6px; background: #e1e8ff; border-radius: 3px; margin: 20px 0; }
    .progress-fill { width: 14.3%; height: 100%; background: #667eea; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="day-badge">Day 1 of 7</div>
      <div class="logo">SafePlay</div>
      <h1>Welcome to your family's safety journey!</h1>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="content">
      <div class="welcome-section">
        <div class="hero-text">Hi {{userName}}, let's get you started! 🎉</div>
        <p>Welcome to SafePlay - the most advanced child safety platform. Over the next 7 days, we'll guide you through everything you need to know to keep your family safe and connected.</p>
      </div>

      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-icon">🛡️</div>
          <h3>Advanced Safety</h3>
          <p>AI-powered monitoring and real-time alerts</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📱</div>
          <h3>Easy Check-ins</h3>
          <p>Simple QR codes and mobile app integration</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">👨‍👩‍👧‍👦</div>
          <h3>Family Connection</h3>
          <p>Keep your family connected and informed</p>
        </div>
      </div>

      <h2>🚀 Let's Start Your Journey</h2>
      
      <div class="step-item">
        <span class="step-number">1</span>
        <strong>Explore Your Dashboard:</strong> Get familiar with your safety command center where you'll manage your family's safety settings.
      </div>

      <div class="step-item">
        <span class="step-number">2</span>
        <strong>Take the Quick Tour:</strong> We've prepared a 3-minute video showing you the most important features.
      </div>

      <div class="step-item">
        <span class="step-number">3</span>
        <strong>Join the Community:</strong> Connect with other parents and get safety tips from our experts.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}" class="cta-button">Open My Dashboard →</a>
        {{#if videoTutorialUrl}}
        <br><br>
        <a href="{{videoTutorialUrl}}" style="color: #667eea; text-decoration: none;">📹 Watch Getting Started Video (3 min)</a>
        {{/if}}
      </div>

      <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #2196f3;">💡 Pro Tip</h3>
        <p style="margin: 0;">Bookmark your dashboard and enable browser notifications to stay connected with your family's safety updates in real-time!</p>
      </div>

      <p><strong>Tomorrow:</strong> We'll show you how to set up your children's profiles for maximum safety coverage.</p>
    </div>

    <div class="footer">
      <p>Need help? Visit our <a href="{{helpCenterUrl}}" style="color: #667eea;">Help Center</a> or reply to this email.</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getOnboardingDay1Text(): string {
    return `
SafePlay - Day 1: Welcome & Getting Started

Hi {{userName}},

Welcome to SafePlay! 🎉

Over the next 7 days, we'll guide you through everything you need to know to keep your family safe and connected.

🚀 Let's Start Your Journey:

1. Explore Your Dashboard
   Get familiar with your safety command center: {{dashboardUrl}}

2. Take the Quick Tour
   {{#if videoTutorialUrl}}Watch our 3-minute getting started video: {{videoTutorialUrl}}{{/if}}

3. Join the Community
   Connect with other parents and safety experts

💡 Pro Tip: Bookmark your dashboard and enable browser notifications for real-time safety updates!

Tomorrow: We'll show you how to set up your children's profiles for maximum safety coverage.

Need help? Visit our Help Center: {{helpCenterUrl}}

SafePlay - Keeping families safe, everywhere.
`;
  }

  private getOnboardingDay2Html(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 2: Setting Up Child Profiles</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .day-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .step-item { margin: 25px 0; padding: 20px; background: #fff8f0; border-left: 4px solid #ff8c42; border-radius: 0 8px 8px 0; }
    .step-number { background: #ff8c42; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; transition: background 0.3s; }
    .progress-bar { width: 100%; height: 6px; background: #e1e8ff; border-radius: 3px; margin: 20px 0; }
    .progress-fill { width: 28.6%; height: 100%; background: #667eea; border-radius: 3px; }
    .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #f0f8ff; border-radius: 8px; }
    .checklist-icon { margin-right: 15px; font-size: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="day-badge">Day 2 of 7</div>
      <h1>Setting Up Child Profiles 👶</h1>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>Hi {{userName}}, ready to add your children?</h2>
        {{#if hasChildren}}
        <p style="color: #4caf50; font-weight: bold;">✅ Great! We see you've already started adding children to your account.</p>
        {{else}}
        <p>Today we'll set up profiles for your children - this is the foundation of SafePlay's safety features.</p>
        {{/if}}
      </div>

      <h3>📋 Child Profile Setup Checklist</h3>
      
      <div class="checklist-item">
        <div class="checklist-icon">📝</div>
        <div>
          <strong>Basic Information:</strong><br>
          Add names, ages, and emergency contacts for each child
        </div>
      </div>

      <div class="checklist-item">
        <div class="checklist-icon">📸</div>
        <div>
          <strong>Profile Photos:</strong><br>
          Upload clear, recent photos for visual identification
        </div>
      </div>

      <div class="checklist-item">
        <div class="checklist-icon">⚠️</div>
        <div>
          <strong>Medical Information:</strong><br>
          Add allergies, medications, and special needs (optional but recommended)
        </div>
      </div>

      <div class="checklist-item">
        <div class="checklist-icon">🏥</div>
        <div>
          <strong>Emergency Contacts:</strong><br>
          Add trusted family members and healthcare providers
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{childrenUrl}}" class="cta-button">Set Up Child Profiles →</a>
        <br><br>
        <a href="{{profileGuideUrl}}" style="color: #667eea; text-decoration: none;">📖 Read Profile Setup Guide</a>
      </div>

      <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #2196f3;">🛡️ Privacy & Security</h3>
        <p style="margin: 0;">All information is encrypted and stored securely. Only authorized venue staff and emergency responders can access this data when needed for your child's safety.</p>
      </div>

      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #ff8c42;">✨ Why Complete Profiles Matter</h3>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Faster check-ins with QR codes</li>
          <li>Instant alerts if your child needs help</li>
          <li>Emergency responders have vital information</li>
          <li>Venue staff can provide better care</li>
        </ul>
      </div>

      <p><strong>Tomorrow:</strong> We'll explore SafePlay's advanced biometric security features to keep your family data ultra-secure.</p>
    </div>

    <div style="background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px;">
      <p>Questions about child profiles? We're here to help!</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getOnboardingDay2Text(): string {
    return `
SafePlay - Day 2: Setting Up Child Profiles

Hi {{userName}},

Ready to add your children? 👶

{{#if hasChildren}}
✅ Great! We see you've already started adding children to your account.
{{else}}
Today we'll set up profiles for your children - this is the foundation of SafePlay's safety features.
{{/if}}

📋 Child Profile Setup Checklist:

✓ Basic Information: Names, ages, emergency contacts
✓ Profile Photos: Clear, recent photos for identification  
✓ Medical Information: Allergies, medications, special needs
✓ Emergency Contacts: Family members and healthcare providers

Set up profiles: {{childrenUrl}}
Setup guide: {{profileGuideUrl}}

🛡️ Privacy & Security: All information is encrypted and stored securely.

✨ Why Complete Profiles Matter:
- Faster check-ins with QR codes
- Instant alerts if your child needs help
- Emergency responders have vital information
- Venue staff can provide better care

Tomorrow: We'll explore SafePlay's advanced biometric security features.

SafePlay - Keeping families safe, everywhere.
`;
  }

  private getOnboardingDay3Html(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 3: Understanding Biometric Features</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .day-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .progress-bar { width: 100%; height: 6px; background: #e1e8ff; border-radius: 3px; margin: 20px 0; }
    .progress-fill { width: 42.9%; height: 100%; background: #667eea; border-radius: 3px; }
    .security-feature { margin: 20px 0; padding: 20px; background: #f0f8ff; border: 1px solid #e1e8ff; border-radius: 8px; }
    .feature-icon { font-size: 24px; margin-right: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="day-badge">Day 3 of 7</div>
      <h1>Secure Biometric Registration 🔒</h1>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>Hi {{userName}}, let's secure your family's data!</h2>
        {{#if hasBiometricData}}
        <p style="color: #4caf50; font-weight: bold;">✅ Excellent! Your biometric security is already active.</p>
        {{else}}
        <p>Today we'll set up biometric security - the gold standard for protecting your family's information.</p>
        {{/if}}
      </div>

      <h3>🛡️ What Are Biometric Features?</h3>
      <p>Biometric security uses unique physical characteristics to verify identity. SafePlay supports:</p>

      <div class="security-feature">
        <span class="feature-icon">👆</span>
        <strong>Fingerprint Recognition:</strong> Quick and secure access to your account and child information.
      </div>

      <div class="security-feature">
        <span class="feature-icon">📱</span>
        <strong>Face ID / Touch ID:</strong> Use your device's built-in security for seamless authentication.
      </div>

      <div class="security-feature">
        <span class="feature-icon">👁️</span>
        <strong>Facial Recognition:</strong> Advanced AI identifies your children at participating venues.
      </div>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #4caf50;">✅ Benefits of Biometric Security</h3>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Instant, secure access to your account</li>
          <li>Real-time child identification at venues</li>
          <li>Enhanced protection against unauthorized access</li>
          <li>Streamlined check-in processes</li>
          <li>Peace of mind with military-grade security</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{biometricUrl}}" class="cta-button">Set Up Biometric Security →</a>
        <br><br>
        <a href="{{securityGuideUrl}}" style="color: #667eea; text-decoration: none;">🔐 Read Security Guide</a>
      </div>

      <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #ff8c42;">🔒 Privacy First</h3>
        <p style="margin: 0;">Your biometric data is processed locally on your device and encrypted before storage. SafePlay follows GDPR, COPPA, and SOC 2 compliance standards to protect your family's privacy.</p>
      </div>

      <p><strong>Tomorrow:</strong> We'll master the check-in/check-out system and show you how to use QR codes for lightning-fast venue access.</p>
    </div>

    <div style="background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px;">
      <p>Questions about security features? We're here to help!</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getOnboardingDay3Text(): string {
    return `
SafePlay - Day 3: Understanding Biometric Features

Hi {{userName}},

Let's secure your family's data! 🔒

{{#if hasBiometricData}}
✅ Excellent! Your biometric security is already active.
{{else}}
Today we'll set up biometric security - the gold standard for protecting your family's information.
{{/if}}

🛡️ What Are Biometric Features?

SafePlay supports:
👆 Fingerprint Recognition: Quick, secure account access
📱 Face ID / Touch ID: Use your device's built-in security  
👁️ Facial Recognition: AI identifies your children at venues

✅ Benefits:
- Instant, secure access to your account
- Real-time child identification at venues
- Enhanced protection against unauthorized access
- Streamlined check-in processes
- Military-grade security

Set up biometric security: {{biometricUrl}}
Security guide: {{securityGuideUrl}}

🔒 Privacy First: Your biometric data is processed locally and encrypted. SafePlay follows GDPR, COPPA, and SOC 2 compliance.

Tomorrow: We'll master the check-in/check-out system and QR codes.

SafePlay - Keeping families safe, everywhere.
`;
  }

  private getOnboardingDay4Html(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 4: Check-in/Check-out System</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .day-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .progress-bar { width: 100%; height: 6px; background: #e1e8ff; border-radius: 3px; margin: 20px 0; }
    .progress-fill { width: 57.2%; height: 100%; background: #667eea; border-radius: 3px; }
    .method-card { margin: 20px 0; padding: 20px; background: #f8f9ff; border: 1px solid #e1e8ff; border-radius: 8px; }
    .qr-demo { text-align: center; padding: 20px; background: #fff; border: 2px dashed #667eea; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="day-badge">Day 4 of 7</div>
      <h1>Master the Check-in Process ✅</h1>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>Hi {{userName}}, ready for effortless check-ins?</h2>
        <p>Today we'll show you how SafePlay's check-in system makes visiting venues quick, secure, and stress-free!</p>
      </div>

      <h3>🚀 Three Ways to Check In</h3>

      <div class="method-card">
        <h4>📱 1. Mobile App (Recommended)</h4>
        <p>Download the SafePlay mobile app for the fastest check-ins. Features include:</p>
        <ul>
          <li>One-tap check-in with your child's QR code</li>
          <li>Real-time location tracking</li>
          <li>Instant notifications</li>
          <li>Offline capability</li>
        </ul>
      </div>

      <div class="method-card">
        <h4>📊 2. QR Code Scanning</h4>
        <p>Each child gets a unique QR code for lightning-fast identification:</p>
        <ul>
          <li>Scan with any smartphone camera</li>
          <li>Works at kiosks and with staff tablets</li>
          <li>Automatic venue notification</li>
          <li>Backup codes available</li>
        </ul>
      </div>

      <div class="qr-demo">
        <h4>📱 QR Code Demo</h4>
        <div style="font-size: 48px; margin: 20px 0;">📱</div>
        <p><strong>Point your phone camera at your child's QR code</strong><br>
        Instant recognition • No app download required • Works everywhere</p>
      </div>

      <div class="method-card">
        <h4>🏢 3. Venue Kiosks</h4>
        <p>Use SafePlay kiosks at participating venues:</p>
        <ul>
          <li>Touch-screen interface</li>
          <li>Biometric verification</li>
          <li>Print temporary wristbands</li>
          <li>Emergency contact display</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{mobileAppUrl}}" class="cta-button">Download Mobile App →</a>
        <br><br>
        <a href="{{checkInGuideUrl}}" style="color: #667eea; text-decoration: none;">📖 Complete Check-in Guide</a>
        <br>
        <a href="{{qrCodeGuideUrl}}" style="color: #667eea; text-decoration: none;">📊 QR Code Setup Guide</a>
      </div>

      <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #2196f3;">⚡ Pro Tips for Faster Check-ins</h3>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Save QR codes to your phone's photo album</li>
          <li>Enable location services for automatic venue detection</li>
          <li>Set up Apple Wallet / Google Pay shortcuts</li>
          <li>Register multiple emergency contacts</li>
        </ul>
      </div>

      <p><strong>Tomorrow:</strong> We'll configure smart alerts and notifications so you're always informed about your child's safety and activities.</p>
    </div>

    <div style="background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px;">
      <p>Questions about check-ins? We're here to help!</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getOnboardingDay4Text(): string {
    return `
SafePlay - Day 4: Master the Check-in Process

Hi {{userName}},

Ready for effortless check-ins? ✅

Today we'll show you SafePlay's check-in system for quick, secure, stress-free venue visits!

🚀 Three Ways to Check In:

📱 1. Mobile App (Recommended)
- One-tap check-in with QR code
- Real-time location tracking  
- Instant notifications
- Offline capability

📊 2. QR Code Scanning
- Unique QR code per child
- Scan with any smartphone
- Works at kiosks and tablets
- Backup codes available

🏢 3. Venue Kiosks
- Touch-screen interface
- Biometric verification
- Print temporary wristbands
- Emergency contact display

Download app: {{mobileAppUrl}}
Check-in guide: {{checkInGuideUrl}}
QR setup: {{qrCodeGuideUrl}}

⚡ Pro Tips:
- Save QR codes to photo album
- Enable location services
- Set up wallet shortcuts
- Register multiple emergency contacts

Tomorrow: We'll configure smart alerts and notifications.

SafePlay - Keeping families safe, everywhere.
`;
  }

  private getOnboardingDay5Html(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 5: Alerts and Notifications</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .day-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .progress-bar { width: 100%; height: 6px; background: #e1e8ff; border-radius: 3px; margin: 20px 0; }
    .progress-fill { width: 71.5%; height: 100%; background: #667eea; border-radius: 3px; }
    .alert-type { margin: 20px 0; padding: 20px; border-radius: 8px; }
    .alert-safety { background: #fff3e0; border-left: 4px solid #ff8c42; }
    .alert-info { background: #e8f4fd; border-left: 4px solid #2196f3; }
    .alert-emergency { background: #ffebee; border-left: 4px solid #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="day-badge">Day 5 of 7</div>
      <h1>Stay Informed with Smart Alerts 🔔</h1>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>Hi {{userName}}, let's set up your alert system!</h2>
        <p>SafePlay's intelligent alert system keeps you informed without overwhelming you. Let's customize it for your family's needs.</p>
      </div>

      <h3>🔔 Types of Alerts</h3>

      <div class="alert-safety">
        <h4>🛡️ Safety Alerts</h4>
        <p><strong>When:</strong> Child check-ins, unusual activity, or location changes</p>
        <p><strong>Delivery:</strong> Instant push notifications + SMS backup</p>
        <ul>
          <li>"Emma has safely checked in at FunZone"</li>
          <li>"Max has been at the play area for 3 hours"</li>
          <li>"Lily is approaching the exit area"</li>
        </ul>
      </div>

      <div class="alert-info">
        <h4>ℹ️ Information Alerts</h4>
        <p><strong>When:</strong> Daily summaries, activity updates, system notifications</p>
        <p><strong>Delivery:</strong> Email + in-app notifications</p>
        <ul>
          <li>Daily activity summary</li>
          <li>New venue partnerships</li>
          <li>Feature updates and tips</li>
        </ul>
      </div>

      <div class="alert-emergency">
        <h4>🚨 Emergency Alerts</h4>
        <p><strong>When:</strong> Child needs immediate attention or assistance</p>
        <p><strong>Delivery:</strong> Instant calls + SMS + push notifications</p>
        <ul>
          <li>Medical emergencies</li>
          <li>Child separated from group</li>
          <li>Venue emergency situations</li>
        </ul>
      </div>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #4caf50;">🎯 Smart Alert Features</h3>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li><strong>Intelligent Filtering:</strong> Reduces notification fatigue</li>
          <li><strong>Priority Levels:</strong> Critical alerts come through immediately</li>
          <li><strong>Quiet Hours:</strong> Non-urgent alerts wait until morning</li>
          <li><strong>Geofencing:</strong> Location-based automatic triggers</li>
          <li><strong>Family Sharing:</strong> Keep multiple parents informed</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{alertSettingsUrl}}" class="cta-button">Configure Alert Settings →</a>
        <br><br>
        <a href="{{notificationPrefsUrl}}" style="color: #667eea; text-decoration: none;">⚙️ Notification Preferences</a>
        <br>
        <a href="{{emergencyGuideUrl}}" style="color: #667eea; text-decoration: none;">🚨 Emergency Procedures Guide</a>
      </div>

      <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #ff8c42;">📱 Recommended Alert Setup</h3>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li><strong>Push Notifications:</strong> Enable for all safety alerts</li>
          <li><strong>SMS Backup:</strong> For emergencies and critical updates</li>
          <li><strong>Email Summaries:</strong> Daily digest of all activities</li>
          <li><strong>Phone Calls:</strong> Emergency situations only</li>
        </ul>
      </div>

      <p><strong>Tomorrow:</strong> We'll explore SafePlay's powerful safety analytics to help you understand patterns and optimize your family's safety routines.</p>
    </div>

    <div style="background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px;">
      <p>Questions about alerts? We're here to help!</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getOnboardingDay5Text(): string {
    return `
SafePlay - Day 5: Stay Informed with Smart Alerts

Hi {{userName}},

Let's set up your alert system! 🔔

SafePlay's intelligent alerts keep you informed without overwhelming you.

🔔 Types of Alerts:

🛡️ Safety Alerts
- Child check-ins, activity, location changes
- Instant push + SMS backup
- "Emma safely checked in at FunZone"

ℹ️ Information Alerts  
- Daily summaries, updates, notifications
- Email + in-app delivery
- Activity summaries, new features

🚨 Emergency Alerts
- Child needs immediate attention
- Instant calls + SMS + push
- Medical emergencies, separations

🎯 Smart Features:
- Intelligent filtering reduces fatigue
- Priority levels for critical alerts
- Quiet hours for non-urgent items
- Geofencing location triggers
- Family sharing keeps everyone informed

Configure alerts: {{alertSettingsUrl}}
Preferences: {{notificationPrefsUrl}}
Emergency guide: {{emergencyGuideUrl}}

📱 Recommended Setup:
- Push: All safety alerts
- SMS: Emergencies and critical updates
- Email: Daily activity digest
- Calls: Emergency situations only

Tomorrow: We'll explore powerful safety analytics.

SafePlay - Keeping families safe, everywhere.
`;
  }

  private getOnboardingDay6Html(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 6: Safety Analytics</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .day-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .progress-bar { width: 100%; height: 6px; background: #e1e8ff; border-radius: 3px; margin: 20px 0; }
    .progress-fill { width: 85.8%; height: 100%; background: #667eea; border-radius: 3px; }
    .analytics-card { margin: 20px 0; padding: 20px; background: #f8f9ff; border: 1px solid #e1e8ff; border-radius: 8px; }
    .stat-preview { display: flex; justify-content: space-around; text-align: center; margin: 30px 0; }
    .stat-item { padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="day-badge">Day 6 of 7</div>
      <h1>Discover Powerful Safety Insights 📊</h1>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>Hi {{userName}}, ready to unlock safety insights?</h2>
        {{#if hasAnalyticsData}}
        <p style="color: #4caf50; font-weight: bold;">✅ Great! You already have analytics data to explore.</p>
        {{else}}
        <p>SafePlay's analytics turn your family's safety data into actionable insights for better decision-making.</p>
        {{/if}}
      </div>

      <div class="stat-preview">
        <div class="stat-item">
          <div style="font-size: 24px; color: #667eea; font-weight: bold;">📈</div>
          <div style="font-size: 18px; font-weight: bold;">Activity Trends</div>
          <div style="color: #666;">Weekly patterns</div>
        </div>
        <div class="stat-item">
          <div style="font-size: 24px; color: #4caf50; font-weight: bold;">🎯</div>
          <div style="font-size: 18px; font-weight: bold;">Safety Score</div>
          <div style="color: #666;">Real-time rating</div>
        </div>
        <div class="stat-item">
          <div style="font-size: 24px; color: #ff8c42; font-weight: bold;">⏱️</div>
          <div style="font-size: 18px; font-weight: bold;">Time Insights</div>
          <div style="color: #666;">Optimal schedules</div>
        </div>
      </div>

      <h3>📊 Your Analytics Dashboard</h3>

      <div class="analytics-card">
        <h4>🏃 Activity Patterns</h4>
        <p>Understand your child's favorite activities, peak energy times, and social interactions.</p>
        <ul>
          <li>Most visited venues and zones</li>
          <li>Average visit duration</li>
          <li>Social interaction levels</li>
          <li>Energy and mood patterns</li>
        </ul>
      </div>

      <div class="analytics-card">
        <h4>🛡️ Safety Metrics</h4>
        <p>Monitor safety indicators and identify potential concerns before they become issues.</p>
        <ul>
          <li>Real-time safety scores</li>
          <li>Incident-free streaks</li>
          <li>Emergency response times</li>
          <li>Venue safety ratings</li>
        </ul>
      </div>

      <div class="analytics-card">
        <h4>📈 Predictive Insights</h4>
        <p>AI-powered recommendations to optimize your family's safety and fun.</p>
        <ul>
          <li>Best times to visit venues</li>
          <li>Crowding predictions</li>
          <li>Weather-based recommendations</li>
          <li>Personalized safety tips</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{analyticsUrl}}" class="cta-button">Explore Analytics Dashboard →</a>
        <br><br>
        <a href="{{reportsGuideUrl}}" style="color: #667eea; text-decoration: none;">📋 Reports Guide</a>
      </div>

      <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #2196f3;">🧠 AI-Powered Insights</h3>
        <p style="margin: 0;">SafePlay's machine learning analyzes millions of data points to provide personalized recommendations. The more you use SafePlay, the smarter and more accurate your insights become!</p>
      </div>

      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #ff8c42;">📱 Weekly Safety Report</h3>
        <p style="margin: 0;">Every Sunday, receive a comprehensive safety report with insights, achievements, and recommendations for the upcoming week. It's like having a personal safety consultant!</p>
      </div>

      <p><strong>Tomorrow:</strong> We'll explore advanced features and pro tips to make you a SafePlay expert!</p>
    </div>

    <div style="background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px;">
      <p>Questions about analytics? We're here to help!</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getOnboardingDay6Text(): string {
    return `
SafePlay - Day 6: Discover Powerful Safety Insights

Hi {{userName}},

Ready to unlock safety insights? 📊

{{#if hasAnalyticsData}}
✅ Great! You already have analytics data to explore.
{{else}}
SafePlay's analytics turn safety data into actionable insights for better decisions.
{{/if}}

📊 Your Analytics Dashboard:

🏃 Activity Patterns
- Favorite venues and zones
- Average visit duration  
- Social interaction levels
- Energy and mood patterns

🛡️ Safety Metrics
- Real-time safety scores
- Incident-free streaks
- Emergency response times
- Venue safety ratings

📈 Predictive Insights
- Best times to visit venues
- Crowding predictions
- Weather-based recommendations
- Personalized safety tips

Explore dashboard: {{analyticsUrl}}
Reports guide: {{reportsGuideUrl}}

🧠 AI-Powered: Machine learning analyzes millions of data points for personalized recommendations.

📱 Weekly Safety Report: Every Sunday, get comprehensive insights and recommendations.

Tomorrow: Advanced features and pro tips to make you a SafePlay expert!

SafePlay - Keeping families safe, everywhere.
`;
  }

  private getOnboardingDay7Html(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 7: You're Now a SafePlay Expert!</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
    .completion-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .cta-button { display: inline-block; background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .progress-bar { width: 100%; height: 6px; background: #e1e8ff; border-radius: 3px; margin: 20px 0; }
    .progress-fill { width: 100%; height: 100%; background: #4caf50; border-radius: 3px; }
    .achievement-card { margin: 20px 0; padding: 20px; background: #f0f8ff; border: 1px solid #e1e8ff; border-radius: 8px; text-align: center; }
    .feature-highlight { margin: 20px 0; padding: 15px; background: #fff8e1; border-left: 4px solid #ff8c42; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="completion-badge">🎉 Onboarding Complete!</div>
      <h1>You're Now a SafePlay Expert! 🌟</h1>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin: 20px 0;">🏆</div>
        <h2>Congratulations {{userName}}!</h2>
        <p>You've completed the SafePlay onboarding journey! Your family is now equipped with the most advanced child safety platform available.</p>
        {{#if completionBadgeUrl}}
        <img src="{{completionBadgeUrl}}" alt="SafePlay Expert Badge" style="max-width: 150px; margin: 20px 0;">
        {{/if}}
      </div>

      <div class="achievement-card">
        <h3>🎯 What You've Accomplished</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0;">
          <div>✅ Account Setup</div>
          <div>✅ Child Profiles</div>
          <div>✅ Biometric Security</div>
          <div>✅ Check-in System</div>
          <div>✅ Alert Configuration</div>
          <div>✅ Analytics Understanding</div>
          <div>✅ Expert Knowledge</div>
        </div>
      </div>

      <h3>🚀 Advanced Features to Explore</h3>

      <div class="feature-highlight">
        <strong>🤖 AI Safety Assistant:</strong> Get personalized safety recommendations based on your family's activity patterns and preferences.
      </div>

      <div class="feature-highlight">
        <strong>👥 Family Network:</strong> Connect with other SafePlay families, share recommendations, and build a safety community.
      </div>

      <div class="feature-highlight">
        <strong>📅 Smart Scheduling:</strong> AI-powered venue recommendations based on crowd levels, weather, and your child's preferences.
      </div>

      <div class="feature-highlight">
        <strong>🎮 Gamification:</strong> Safety streaks, achievement badges, and family challenges to make safety fun and engaging.
      </div>

      <div class="feature-highlight">
        <strong>🔮 Predictive Safety:</strong> Early warning system for potential safety concerns before they become issues.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{advancedFeaturesUrl}}" class="cta-button">Explore Advanced Features →</a>
        <br><br>
        <a href="{{communityUrl}}" style="color: #4caf50; text-decoration: none;">👥 Join the SafePlay Community</a>
        <br>
        <a href="{{supportUrl}}" style="color: #4caf50; text-decoration: none;">💬 Contact Support</a>
      </div>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #4caf50;">🎓 Pro Tips for Continued Success</h3>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Check your analytics weekly to spot trends</li>
          <li>Update child profiles monthly as they grow</li>
          <li>Review and adjust alert preferences seasonally</li>
          <li>Explore new venues and features regularly</li>
          <li>Share your experience with other parents</li>
        </ul>
      </div>

      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: #ff8c42;">📞 We're Always Here to Help</h3>
        <p style="margin: 0;">Your SafePlay journey doesn't end here! Our support team is available 24/7 for questions, and we're constantly adding new features based on your feedback. Welcome to the SafePlay family! 🎉</p>
      </div>

      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9ff; border-radius: 8px;">
        <h3 style="color: #667eea;">Thank you for choosing SafePlay!</h3>
        <p>Your commitment to your family's safety inspires us every day. Here's to many safe and fun adventures ahead!</p>
      </div>
    </div>

    <div style="background: #f8f9ff; padding: 30px; text-align: center; color: #666; font-size: 14px;">
      <p>Questions or feedback? We'd love to hear from you!</p>
      <p>SafePlay - Keeping families safe, everywhere.</p>
      {{trackingPixel}}
    </div>
  </div>
</body>
</html>`;
  }

  private getOnboardingDay7Text(): string {
    return `
SafePlay - Day 7: You're Now a SafePlay Expert!

🎉 Congratulations {{userName}}!

You've completed the SafePlay onboarding journey! Your family is now equipped with the most advanced child safety platform available.

🎯 What You've Accomplished:
✅ Account Setup
✅ Child Profiles  
✅ Biometric Security
✅ Check-in System
✅ Alert Configuration
✅ Analytics Understanding
✅ Expert Knowledge

🚀 Advanced Features to Explore:

🤖 AI Safety Assistant: Personalized safety recommendations
👥 Family Network: Connect with other SafePlay families
📅 Smart Scheduling: AI-powered venue recommendations  
🎮 Gamification: Safety streaks and achievement badges
🔮 Predictive Safety: Early warning system

Explore advanced features: {{advancedFeaturesUrl}}
Join community: {{communityUrl}}
Contact support: {{supportUrl}}

🎓 Pro Tips:
- Check analytics weekly for trends
- Update child profiles monthly
- Review alert preferences seasonally
- Explore new venues regularly
- Share experience with other parents

📞 We're Always Here: 24/7 support for questions and new features based on your feedback.

Thank you for choosing SafePlay! Here's to many safe and fun adventures ahead!

SafePlay - Keeping families safe, everywhere.
`;
  }

  /**
   * Get Weekly Safety Tips Campaign Templates
   */
  private getWeeklySafetyTipsTemplates() {
    return [
      {
        name: 'Weekly Safety Tips - Playground Safety Fundamentals',
        subject: 'Weekly SafePlay Tips: Essential Playground Safety 🛝',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getPlaygroundSafetyTemplateHtml(),
        textContent: this.getPlaygroundSafetyTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'dashboardUrl', type: 'string', required: true, description: 'Dashboard URL' },
          { name: 'tipOfTheWeek', type: 'string', required: false, description: 'Featured safety tip' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      },
      {
        name: 'Weekly Safety Tips - Feature Spotlight Face Recognition',
        subject: 'Feature Spotlight: How Face Recognition Keeps Your Child Safe 👁️',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getFaceRecognitionFeatureTemplateHtml(),
        textContent: this.getFaceRecognitionFeatureTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'biometricUrl', type: 'string', required: true, description: 'Biometric setup URL' },
          { name: 'hasSetupBiometrics', type: 'boolean', required: false, description: 'Whether user has biometrics set up' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      },
      {
        name: 'Weekly Safety Tips - Summer Safety Essentials',
        subject: 'Summer Safety Tips: Keep Your Child Safe in the Sun ☀️',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getSummerSafetyTemplateHtml(),
        textContent: this.getSummerSafetyTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'localWeather', type: 'string', required: false, description: 'Local weather info' },
          { name: 'emergencyContactsUrl', type: 'string', required: true, description: 'Emergency contacts URL' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      },
      {
        name: 'Weekly Safety Tips - Emergency Preparedness',
        subject: 'Be Prepared: Emergency Response & SafePlay Alerts 🚨',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getEmergencyPreparednessTemplateHtml(),
        textContent: this.getEmergencyPreparednessTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'alertSettingsUrl', type: 'string', required: true, description: 'Alert settings URL' },
          { name: 'emergencyGuideUrl', type: 'string', required: true, description: 'Emergency guide URL' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      },
      {
        name: 'Weekly Safety Tips - Mobile App Mastery',
        subject: 'Pro Tips: Master the SafePlay Mobile App 📱',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getMobileAppTipsTemplateHtml(),
        textContent: this.getMobileAppTipsTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'mobileAppUrl', type: 'string', required: true, description: 'Mobile app download URL' },
          { name: 'qrGuideUrl', type: 'string', required: true, description: 'QR code guide URL' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      },
      {
        name: 'Weekly Safety Tips - Analytics Insights',
        subject: 'Your Safety Data: Weekly Analytics Insights 📊',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getAnalyticsInsightsTemplateHtml(),
        textContent: this.getAnalyticsInsightsTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'analyticsUrl', type: 'string', required: true, description: 'Analytics dashboard URL' },
          { name: 'weeklyStats', type: 'object', required: false, description: 'Weekly statistics object' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      },
      {
        name: 'Weekly Safety Tips - Winter Safety Guide',
        subject: 'Winter Safety: Cold Weather Playground Tips ❄️',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getWinterSafetyTemplateHtml(),
        textContent: this.getWinterSafetyTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'weatherAlertUrl', type: 'string', required: true, description: 'Weather alert setup URL' },
          { name: 'indoorActivitiesUrl', type: 'string', required: false, description: 'Indoor activities guide URL' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      },
      {
        name: 'Weekly Safety Tips - Check-in Best Practices',
        subject: 'Check-in Like a Pro: Advanced Features & Tips ✅',
        templateType: EmailTemplateType.NEWSLETTER,
        category: EmailCategory.EDUCATION,
        htmlContent: this.getCheckInBestPracticesTemplateHtml(),
        textContent: this.getCheckInBestPracticesTemplateText(),
        variables: [
          { name: 'userName', type: 'string', required: true, description: 'User\'s first name' },
          { name: 'weekNumber', type: 'number', required: true, description: 'Week number of campaign' },
          { name: 'checkInGuideUrl', type: 'string', required: true, description: 'Check-in guide URL' },
          { name: 'bulkCheckInUrl', type: 'string', required: true, description: 'Bulk check-in feature URL' },
          { name: 'unsubscribeUrl', type: 'string', required: true, description: 'Unsubscribe URL' }
        ]
      }
    ];
  }

  // Weekly Safety Tips Template HTML Content Methods

  private getPlaygroundSafetyTemplateHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly SafePlay Tips</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: white; }
        .tip-box { background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛝 SafePlay Weekly Tips</h1>
        <p>Week {{weekNumber}}: Playground Safety Fundamentals</p>
    </div>
    
    <div class="content">
        <h2>Hi {{userName}}! 👋</h2>
        
        <p>This week we're focusing on <strong>playground safety fundamentals</strong> - the essential knowledge every parent needs to keep their children safe while playing.</p>
        
        <div class="tip-box">
            <h3>🎯 Featured Safety Tip</h3>
            <p><strong>{{tipOfTheWeek}}</strong></p>
            <p>Always ensure your child is visible and within designated play areas. SafePlay's real-time tracking helps you monitor their location even in busy playgrounds.</p>
        </div>
        
        <h3>Essential Playground Safety Checklist:</h3>
        <ul>
            <li>✅ Check equipment for damage before play</li>
            <li>✅ Ensure age-appropriate equipment usage</li>
            <li>✅ Maintain visual contact with your child</li>
            <li>✅ Set clear boundaries and meeting points</li>
            <li>✅ Keep emergency contact information updated</li>
        </ul>
        
        <h3>How SafePlay Helps:</h3>
        <p>Our advanced monitoring system provides:</p>
        <ul>
            <li>📍 Real-time location tracking</li>
            <li>🚨 Instant alerts if your child leaves designated areas</li>
            <li>👁️ AI-powered behavior monitoring</li>
            <li>📞 Quick access to emergency contacts</li>
        </ul>
        
        <a href="{{dashboardUrl}}" class="cta-button">View Your Safety Dashboard</a>
        
        <p>Stay tuned for next week's tip on <strong>Advanced Feature Spotlight: Face Recognition Technology</strong>!</p>
    </div>
    
    <div class="footer">
        <p>SafePlay - Keeping families safe, everywhere</p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> from weekly tips</p>
    </div>
</body>
</html>
`;
  }

  private getPlaygroundSafetyTemplateText(): string {
    return `
SafePlay Weekly Tips - Week {{weekNumber}}: Playground Safety Fundamentals

Hi {{userName}}!

This week we're focusing on playground safety fundamentals - the essential knowledge every parent needs to keep their children safe while playing.

Featured Safety Tip: {{tipOfTheWeek}}
Always ensure your child is visible and within designated play areas. SafePlay's real-time tracking helps you monitor their location even in busy playgrounds.

Essential Playground Safety Checklist:
- Check equipment for damage before play
- Ensure age-appropriate equipment usage  
- Maintain visual contact with your child
- Set clear boundaries and meeting points
- Keep emergency contact information updated

How SafePlay Helps:
- Real-time location tracking
- Instant alerts if your child leaves designated areas
- AI-powered behavior monitoring
- Quick access to emergency contacts

View Your Safety Dashboard: {{dashboardUrl}}

Stay tuned for next week's tip on Advanced Feature Spotlight: Face Recognition Technology!

SafePlay - Keeping families safe, everywhere
Unsubscribe: {{unsubscribeUrl}}
`;
  }

  private getFaceRecognitionFeatureTemplateHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feature Spotlight: Face Recognition</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: white; }
        .feature-box { background: #e8f4fd; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>👁️ Feature Spotlight</h1>
        <p>Week {{weekNumber}}: Face Recognition Technology</p>
    </div>
    
    <div class="content">
        <h2>Hi {{userName}}! 🔒</h2>
        
        <p>This week, let's explore how SafePlay's <strong>advanced face recognition technology</strong> adds an extra layer of security for your family.</p>
        
        <div class="feature-box">
            <h3>🎯 How It Works</h3>
            <p>Our secure biometric system uses facial recognition to:</p>
            <ul>
                <li>Instantly identify your child at check-in/check-out</li>
                <li>Prevent unauthorized access to your child's information</li>
                <li>Speed up the identification process in busy venues</li>
                <li>Provide accurate location tracking and safety alerts</li>
            </ul>
        </div>
        
        {{#unless hasSetupBiometrics}}
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>⚠️ Setup Recommended</h4>
            <p>You haven't set up biometric registration yet. Take 2 minutes to enhance your family's security!</p>
            <a href="{{biometricUrl}}" class="cta-button">Set Up Face Recognition</a>
        </div>
        {{/unless}}
        
        <h3>Privacy & Security:</h3>
        <ul>
            <li>🔐 All biometric data is encrypted and stored securely</li>
            <li>🚫 Never shared with third parties</li>
            <li>🗑️ Can be deleted at any time from your account</li>
            <li>✅ Compliant with all privacy regulations</li>
        </ul>
        
        <h3>Pro Tips:</h3>
        <ul>
            <li>Register multiple photos in different lighting conditions</li>
            <li>Update photos as your child grows</li>
            <li>Test the system during your first venue visit</li>
            <li>Keep backup identification methods available</li>
        </ul>
        
        <a href="{{biometricUrl}}" class="cta-button">Manage Face Recognition Settings</a>
        
        <p>Next week: <strong>Summer Safety Essentials</strong> - protecting your child in hot weather!</p>
    </div>
    
    <div class="footer">
        <p>SafePlay - Keeping families safe, everywhere</p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> from weekly tips</p>
    </div>
</body>
</html>
`;
  }

  private getFaceRecognitionFeatureTemplateText(): string {
    return `
SafePlay Feature Spotlight - Week {{weekNumber}}: Face Recognition Technology

Hi {{userName}}!

This week, let's explore how SafePlay's advanced face recognition technology adds an extra layer of security for your family.

How It Works:
Our secure biometric system uses facial recognition to:
- Instantly identify your child at check-in/check-out
- Prevent unauthorized access to your child's information  
- Speed up the identification process in busy venues
- Provide accurate location tracking and safety alerts

{{#unless hasSetupBiometrics}}
Setup Recommended: You haven't set up biometric registration yet. Take 2 minutes to enhance your family's security!
Set Up Face Recognition: {{biometricUrl}}
{{/unless}}

Privacy & Security:
- All biometric data is encrypted and stored securely
- Never shared with third parties
- Can be deleted at any time from your account
- Compliant with all privacy regulations

Pro Tips:
- Register multiple photos in different lighting conditions
- Update photos as your child grows
- Test the system during your first venue visit
- Keep backup identification methods available

Manage Face Recognition Settings: {{biometricUrl}}

Next week: Summer Safety Essentials - protecting your child in hot weather!

SafePlay - Keeping families safe, everywhere
Unsubscribe: {{unsubscribeUrl}}
`;
  }

  private getSummerSafetyTemplateHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summer Safety Essentials</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #ff9a56 0%, #ffad56 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: white; }
        .safety-box { background: #fff8e1; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>☀️ Summer Safety Tips</h1>
        <p>Week {{weekNumber}}: Beat the Heat Safely</p>
    </div>
    
    <div class="content">
        <h2>Hi {{userName}}! 🌡️</h2>
        
        <p>Summer brings extra fun but also extra safety considerations. Here's how to keep your child safe during hot weather playground visits.</p>
        
        <div class="safety-box">
            <h3>🌡️ Heat Safety Essentials</h3>
            <ul>
                <li><strong>Check equipment temperature</strong> - Metal slides and climbing structures can cause burns</li>
                <li><strong>Stay hydrated</strong> - Bring water and take frequent breaks</li>
                <li><strong>Seek shade</strong> - Use covered areas during peak sun hours (10am-4pm)</li>
                <li><strong>Apply sunscreen</strong> - Reapply every 2 hours, even on cloudy days</li>
            </ul>
        </div>
        
        {{#if localWeather}}
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>📍 Your Local Weather</h4>
            <p>{{localWeather}}</p>
            <p>SafePlay can send you weather alerts to help plan safer playground visits!</p>
        </div>
        {{/if}}
        
        <h3>SafePlay Summer Features:</h3>
        <ul>
            <li>🌡️ Temperature alerts for unsafe playground conditions</li>
            <li>⏰ Recommended visit times based on weather</li>
            <li>💧 Hydration reminders through the mobile app</li>
            <li>🏃‍♀️ Activity level monitoring to prevent overheating</li>
        </ul>
        
        <h3>Emergency Preparedness:</h3>
        <ul>
            <li>Know signs of heat exhaustion: excessive sweating, fatigue, dizziness</li>
            <li>Keep emergency contacts updated in your SafePlay account</li>
            <li>Plan escape routes to air-conditioned areas</li>
            <li>Have a family emergency plan</li>
        </ul>
        
        <a href="{{emergencyContactsUrl}}" class="cta-button">Update Emergency Contacts</a>
        
        <p>Stay cool and stay safe! Next week: <strong>Emergency Preparedness & Alert Systems</strong></p>
    </div>
    
    <div class="footer">
        <p>SafePlay - Keeping families safe, everywhere</p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> from weekly tips</p>
    </div>
</body>
</html>
`;
  }

  private getSummerSafetyTemplateText(): string {
    return `
SafePlay Summer Safety Tips - Week {{weekNumber}}: Beat the Heat Safely

Hi {{userName}}!

Summer brings extra fun but also extra safety considerations. Here's how to keep your child safe during hot weather playground visits.

Heat Safety Essentials:
- Check equipment temperature - Metal slides and climbing structures can cause burns
- Stay hydrated - Bring water and take frequent breaks  
- Seek shade - Use covered areas during peak sun hours (10am-4pm)
- Apply sunscreen - Reapply every 2 hours, even on cloudy days

{{#if localWeather}}
Your Local Weather: {{localWeather}}
SafePlay can send you weather alerts to help plan safer playground visits!
{{/if}}

SafePlay Summer Features:
- Temperature alerts for unsafe playground conditions
- Recommended visit times based on weather
- Hydration reminders through the mobile app
- Activity level monitoring to prevent overheating

Emergency Preparedness:
- Know signs of heat exhaustion: excessive sweating, fatigue, dizziness
- Keep emergency contacts updated in your SafePlay account
- Plan escape routes to air-conditioned areas
- Have a family emergency plan

Update Emergency Contacts: {{emergencyContactsUrl}}

Stay cool and stay safe! Next week: Emergency Preparedness & Alert Systems

SafePlay - Keeping families safe, everywhere
Unsubscribe: {{unsubscribeUrl}}
`;
  }

  // Additional template methods (abbreviated for brevity)
  private getEmergencyPreparednessTemplateHtml(): string {
    return `<!DOCTYPE html><html><head><title>Emergency Preparedness</title></head><body><h1>🚨 Emergency Preparedness</h1><p>Hi {{userName}}! This week focuses on emergency response and SafePlay's alert systems...</p></body></html>`;
  }

  private getEmergencyPreparednessTemplateText(): string {
    return `Emergency Preparedness - Week {{weekNumber}}\n\nHi {{userName}}! This week focuses on emergency response and SafePlay's alert systems...`;
  }

  private getMobileAppTipsTemplateHtml(): string {
    return `<!DOCTYPE html><html><head><title>Mobile App Tips</title></head><body><h1>📱 Mobile App Mastery</h1><p>Hi {{userName}}! Discover advanced features of the SafePlay mobile app...</p></body></html>`;
  }

  private getMobileAppTipsTemplateText(): string {
    return `Mobile App Tips - Week {{weekNumber}}\n\nHi {{userName}}! Discover advanced features of the SafePlay mobile app...`;
  }

  private getAnalyticsInsightsTemplateHtml(): string {
    return `<!DOCTYPE html><html><head><title>Analytics Insights</title></head><body><h1>📊 Your Safety Data</h1><p>Hi {{userName}}! Learn how to interpret your weekly analytics...</p></body></html>`;
  }

  private getAnalyticsInsightsTemplateText(): string {
    return `Analytics Insights - Week {{weekNumber}}\n\nHi {{userName}}! Learn how to interpret your weekly analytics...`;
  }

  private getWinterSafetyTemplateHtml(): string {
    return `<!DOCTYPE html><html><head><title>Winter Safety</title></head><body><h1>❄️ Winter Safety Guide</h1><p>Hi {{userName}}! Cold weather playground safety tips...</p></body></html>`;
  }

  private getWinterSafetyTemplateText(): string {
    return `Winter Safety - Week {{weekNumber}}\n\nHi {{userName}}! Cold weather playground safety tips...`;
  }

  private getCheckInBestPracticesTemplateHtml(): string {
    return `<!DOCTYPE html><html><head><title>Check-in Best Practices</title></head><body><h1>✅ Check-in Like a Pro</h1><p>Hi {{userName}}! Master the advanced check-in features...</p></body></html>`;
  }

  private getCheckInBestPracticesTemplateText(): string {
    return `Check-in Best Practices - Week {{weekNumber}}\n\nHi {{userName}}! Master the advanced check-in features...`;
  }
}

// Export singleton instance
export const emailTemplateService = EmailTemplateService.getInstance();

