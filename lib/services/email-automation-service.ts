

import { 
  SESClient, 
  SendEmailCommand, 
  SendBulkTemplatedEmailCommand,
  SendTemplatedEmailCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  GetTemplateCommand
} from '@aws-sdk/client-ses';
import { sesClient, AWS_CONFIG } from '@/lib/aws/config';
import { prisma } from '@/lib/db';
import { 
  EmailStatus, 
  EmailPriority, 
  EmailTemplateType, 
  EmailTrigger,
  EmailExecutionStatus,
  EmailQueueStatus,
  User,
  EmailTemplate,
  EmailLog,
  EmailCampaign,
  EmailAutomationRule,
  EmailPreferences
} from '@prisma/client';
import Handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';

export interface EmailData {
  recipientId: string;
  recipientEmail: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  campaignId?: string;
  automationRuleId?: string;
  priority?: EmailPriority;
  scheduledAt?: Date;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface BulkEmailData {
  templateId: string;
  subject?: string;
  recipients: Array<{
    email: string;
    userId: string;
    variables?: Record<string, any>;
  }>;
  campaignId?: string;
  priority?: EmailPriority;
  scheduledAt?: Date;
}

export interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export class EmailAutomationService {
  private static instance: EmailAutomationService;
  private sesClient: SESClient;
  
  constructor() {
    this.sesClient = sesClient;
    this.registerHandlebarsHelpers();
  }

  static getInstance(): EmailAutomationService {
    if (!EmailAutomationService.instance) {
      EmailAutomationService.instance = new EmailAutomationService();
    }
    return EmailAutomationService.instance;
  }

  /**
   * Register Handlebars helpers for email templates
   */
  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string = 'MMMM DD, YYYY') => {
      if (!date) return '';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(date));
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Capitalize helper
    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Unsubscribe URL helper
    Handlebars.registerHelper('unsubscribeUrl', (userId: string, token: string) => {
      return `${AWS_CONFIG.unsubscribeBaseUrl}/unsubscribe?token=${token}&user=${userId}`;
    });

    // Tracking pixel helper
    Handlebars.registerHelper('trackingPixel', (emailLogId: string) => {
      return new Handlebars.SafeString(
        `<img src="${AWS_CONFIG.trackingDomain}/api/email-tracking/open?id=${emailLogId}" width="1" height="1" style="display:none;" alt="" />`
      );
    });

    // Track link helper
    Handlebars.registerHelper('trackLink', (url: string, emailLogId: string) => {
      const trackingUrl = `${AWS_CONFIG.trackingDomain}/api/email-tracking/click?id=${emailLogId}&url=${encodeURIComponent(url)}`;
      return new Handlebars.SafeString(trackingUrl);
    });
  }

  /**
   * Send a single email
   */
  async sendEmail(emailData: EmailData): Promise<{
    success: boolean;
    emailLogId?: string;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Create email log entry
      const emailLog = await prisma.emailLog.create({
        data: {
          recipientId: emailData.recipientId,
          recipientEmail: emailData.recipientEmail,
          subject: emailData.subject,
          htmlContent: emailData.htmlContent,
          textContent: emailData.textContent,
          templateId: emailData.templateId,
          campaignId: emailData.campaignId,
          status: EmailStatus.QUEUED,
          priority: emailData.priority || EmailPriority.NORMAL,
          scheduledAt: emailData.scheduledAt || new Date(),
          metadata: emailData.metadata,
        }
      });

      // Add to queue if scheduled for later
      if (emailData.scheduledAt && emailData.scheduledAt > new Date()) {
        await this.addToQueue(emailLog.id, emailData.scheduledAt, emailData.priority);
        return {
          success: true,
          emailLogId: emailLog.id
        };
      }

      // Send immediately
      const result = await this.sendEmailNow(emailLog);
      return {
        success: result.success,
        emailLogId: emailLog.id,
        messageId: result.messageId,
        error: result.error
      };

    } catch (error) {
      console.error('Error in sendEmail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email immediately
   */
  private async sendEmailNow(emailLog: EmailLog): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Update status to processing
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: EmailStatus.PROCESSING }
      });

      const startTime = Date.now();

      // Prepare email content
      let htmlContent = emailLog.htmlContent;
      let textContent = emailLog.textContent;

      // If using template, render it
      if (emailLog.templateId) {
        const template = await prisma.emailTemplate.findUnique({
          where: { id: emailLog.templateId }
        });

        if (template) {
          const variables = emailLog.metadata as Record<string, any> || {};
          htmlContent = this.renderTemplate(template.htmlContent, variables);
          textContent = template.textContent ? this.renderTemplate(template.textContent, variables) : null;
        }
      }

      // Add tracking pixel to HTML content
      if (htmlContent) {
        const trackingPixel = `<img src="${AWS_CONFIG.trackingDomain}/api/email-tracking/open?id=${emailLog.id}" width="1" height="1" style="display:none;" alt="" />`;
        htmlContent = htmlContent.replace('</body>', `${trackingPixel}</body>`);
      }

      // Prepare SES command
      const command = new SendEmailCommand({
        Source: `${AWS_CONFIG.sesFromName} <${AWS_CONFIG.sesFromEmail}>`,
        Destination: {
          ToAddresses: [emailLog.recipientEmail]
        },
        Message: {
          Subject: {
            Data: emailLog.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: htmlContent ? {
              Data: htmlContent,
              Charset: 'UTF-8'
            } : undefined,
            Text: textContent ? {
              Data: textContent,
              Charset: 'UTF-8'
            } : undefined
          }
        },
        ReplyToAddresses: [AWS_CONFIG.sesReplyToEmail],
        ConfigurationSetName: AWS_CONFIG.sesConfigurationSet
      });

      // Send email via SES
      const response = await this.sesClient.send(command);
      const processingTime = Date.now() - startTime;

      // Update email log with success
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          externalId: response.MessageId,
          processingTime
        }
      });

      return {
        success: true,
        messageId: response.MessageId
      };

    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update email log with failure
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk emails using SES templated email
   */
  async sendBulkEmails(bulkData: BulkEmailData): Promise<{
    success: boolean;
    emailLogIds: string[];
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    const emailLogIds: string[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      // Create email logs for all recipients
      for (const recipient of bulkData.recipients) {
        const emailLog = await prisma.emailLog.create({
          data: {
            recipientId: recipient.userId,
            recipientEmail: recipient.email,
            subject: bulkData.subject || '',
            templateId: bulkData.templateId,
            campaignId: bulkData.campaignId,
            status: EmailStatus.QUEUED,
            priority: bulkData.priority || EmailPriority.NORMAL,
            scheduledAt: bulkData.scheduledAt || new Date(),
            metadata: recipient.variables || {}
          }
        });
        emailLogIds.push(emailLog.id);
      }

      // If scheduled for later, add to queue
      if (bulkData.scheduledAt && bulkData.scheduledAt > new Date()) {
        for (const emailLogId of emailLogIds) {
          await this.addToQueue(emailLogId, bulkData.scheduledAt, bulkData.priority);
        }
        return {
          success: true,
          emailLogIds,
          successCount: emailLogIds.length,
          failureCount: 0,
          errors: []
        };
      }

      // Send emails in batches (SES limit is 50 per bulk send)
      const batchSize = 50;
      for (let i = 0; i < bulkData.recipients.length; i += batchSize) {
        const batch = bulkData.recipients.slice(i, i + batchSize);
        const batchEmailLogIds = emailLogIds.slice(i, i + batchSize);
        
        try {
          await this.sendEmailBatch(batch, batchEmailLogIds, bulkData.templateId);
          successCount += batch.length;
        } catch (error) {
          failureCount += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Update failed email logs
          for (const emailLogId of batchEmailLogIds) {
            await prisma.emailLog.update({
              where: { id: emailLogId },
              data: {
                status: EmailStatus.FAILED,
                failedAt: new Date(),
                failureReason: error instanceof Error ? error.message : 'Batch send failed'
              }
            });
          }
        }
      }

      return {
        success: successCount > 0,
        emailLogIds,
        successCount,
        failureCount,
        errors
      };

    } catch (error) {
      console.error('Error in sendBulkEmails:', error);
      return {
        success: false,
        emailLogIds,
        successCount: 0,
        failureCount: bulkData.recipients.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Send a batch of emails
   */
  private async sendEmailBatch(
    recipients: Array<{ email: string; userId: string; variables?: Record<string, any> }>,
    emailLogIds: string[],
    templateId: string
  ): Promise<void> {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // For now, send individual emails (can be optimized with SES bulk templated email)
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const emailLogId = emailLogIds[i];
      
      try {
        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: { status: EmailStatus.PROCESSING }
        });

        const variables = recipient.variables || {};
        const htmlContent = this.renderTemplate(template.htmlContent, variables);
        const textContent = template.textContent ? this.renderTemplate(template.textContent, variables) : undefined;
        const subject = this.renderTemplate(template.subject, variables);

        // Add tracking pixel
        const finalHtmlContent = htmlContent.replace(
          '</body>', 
          `<img src="${AWS_CONFIG.trackingDomain}/api/email-tracking/open?id=${emailLogId}" width="1" height="1" style="display:none;" alt="" /></body>`
        );

        const command = new SendEmailCommand({
          Source: `${AWS_CONFIG.sesFromName} <${AWS_CONFIG.sesFromEmail}>`,
          Destination: {
            ToAddresses: [recipient.email]
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: finalHtmlContent,
                Charset: 'UTF-8'
              },
              Text: textContent ? {
                Data: textContent,
                Charset: 'UTF-8'
              } : undefined
            }
          },
          ReplyToAddresses: [AWS_CONFIG.sesReplyToEmail],
          ConfigurationSetName: AWS_CONFIG.sesConfigurationSet
        });

        const response = await this.sesClient.send(command);

        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
            externalId: response.MessageId,
            subject: subject
          }
        });

      } catch (error) {
        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: EmailStatus.FAILED,
            failedAt: new Date(),
            failureReason: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        throw error;
      }
    }
  }

  /**
   * Render email template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error) {
      console.error('Error rendering template:', error);
      return template; // Return original template if rendering fails
    }
  }

  /**
   * Add email to queue for later sending
   */
  private async addToQueue(
    emailLogId: string, 
    scheduledAt: Date, 
    priority: EmailPriority = EmailPriority.NORMAL
  ): Promise<void> {
    await prisma.emailQueue.create({
      data: {
        emailLogId,
        priority,
        scheduledAt,
        nextAttemptAt: scheduledAt,
        status: EmailQueueStatus.PENDING
      }
    });
  }

  /**
   * Process email queue
   */
  async processEmailQueue(limit: number = 100): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // Get pending emails from queue
      const queueItems = await prisma.emailQueue.findMany({
        where: {
          status: EmailQueueStatus.PENDING,
          nextAttemptAt: { lte: new Date() }
        },
        include: {
          emailLog: true
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' }
        ],
        take: limit
      });

      for (const queueItem of queueItems) {
        processed++;
        
        try {
          // Update queue status to processing
          await prisma.emailQueue.update({
            where: { id: queueItem.id },
            data: { 
              status: EmailQueueStatus.PROCESSING,
              processingStartedAt: new Date()
            }
          });

          // Send the email
          const result = await this.sendEmailNow(queueItem.emailLog);

          if (result.success) {
            // Mark queue item as completed
            await prisma.emailQueue.update({
              where: { id: queueItem.id },
              data: { 
                status: EmailQueueStatus.COMPLETED,
                processingCompletedAt: new Date()
              }
            });
            succeeded++;
          } else {
            // Handle failure - retry if attempts remaining
            const newAttempts = queueItem.attempts + 1;
            
            if (newAttempts >= queueItem.maxAttempts) {
              // Max attempts reached
              await prisma.emailQueue.update({
                where: { id: queueItem.id },
                data: { 
                  status: EmailQueueStatus.FAILED,
                  attempts: newAttempts,
                  lastAttemptAt: new Date(),
                  errorMessage: result.error
                }
              });
            } else {
              // Schedule retry with exponential backoff
              const nextAttempt = new Date();
              nextAttempt.setMinutes(nextAttempt.getMinutes() + Math.pow(2, newAttempts) * 5);
              
              await prisma.emailQueue.update({
                where: { id: queueItem.id },
                data: { 
                  status: EmailQueueStatus.RETRYING,
                  attempts: newAttempts,
                  lastAttemptAt: new Date(),
                  nextAttemptAt: nextAttempt,
                  errorMessage: result.error
                }
              });
            }
            failed++;
          }
          
        } catch (error) {
          console.error('Error processing queue item:', error);
          
          // Update queue item with error
          await prisma.emailQueue.update({
            where: { id: queueItem.id },
            data: { 
              status: EmailQueueStatus.FAILED,
              attempts: queueItem.attempts + 1,
              lastAttemptAt: new Date(),
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          });
          failed++;
        }
      }

    } catch (error) {
      console.error('Error processing email queue:', error);
    }

    return { processed, succeeded, failed };
  }

  /**
   * Track email open
   */
  async trackEmailOpen(emailLogId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const emailLog = await prisma.emailLog.findUnique({
        where: { id: emailLogId }
      });

      if (!emailLog) return;

      const now = new Date();
      const updates: any = {
        openCount: emailLog.openCount + 1,
        lastOpenedAt: now
      };

      // Set first open time if not already set
      if (!emailLog.firstOpenedAt) {
        updates.firstOpenedAt = now;
        updates.openedAt = now;
        updates.status = EmailStatus.OPENED;
      }

      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: updates
      });

    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }

  /**
   * Track email click
   */
  async trackEmailClick(
    emailLogId: string, 
    url: string, 
    metadata?: { ipAddress?: string; userAgent?: string; location?: any }
  ): Promise<void> {
    try {
      const emailLog = await prisma.emailLog.findUnique({
        where: { id: emailLogId }
      });

      if (!emailLog) return;

      const now = new Date();

      // Create click event
      await prisma.emailClickEvent.create({
        data: {
          emailLogId,
          url,
          clickedAt: now,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          location: metadata?.location,
          metadata: metadata
        }
      });

      // Update email log
      const updates: any = {
        clickCount: emailLog.clickCount + 1,
        lastClickedAt: now
      };

      if (!emailLog.firstClickedAt) {
        updates.firstClickedAt = now;
        updates.clickedAt = now;
        updates.status = EmailStatus.CLICKED;
      }

      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: updates
      });

    } catch (error) {
      console.error('Error tracking email click:', error);
    }
  }

  /**
   * Get email analytics for a campaign
   */
  async getCampaignAnalytics(campaignId: string): Promise<EmailAnalytics> {
    try {
      const stats = await prisma.emailLog.groupBy({
        by: ['status'],
        _count: {
          status: true
        },
        where: {
          campaignId
        }
      });

      const totalSent = stats.reduce((sum, stat) => sum + stat._count.status, 0);
      const delivered = stats.find(s => s.status === 'DELIVERED')?._count.status || 0;
      const opened = stats.find(s => s.status === 'OPENED')?._count.status || 0;
      const clicked = stats.find(s => s.status === 'CLICKED')?._count.status || 0;
      const bounced = stats.find(s => s.status === 'BOUNCED')?._count.status || 0;
      const unsubscribed = stats.find(s => s.status === 'UNSUBSCRIBED')?._count.status || 0;

      return {
        totalSent,
        totalDelivered: delivered,
        totalOpened: opened,
        totalClicked: clicked,
        totalBounced: bounced,
        totalUnsubscribed: unsubscribed,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
        bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0
      };

    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalUnsubscribed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0
      };
    }
  }

  /**
   * Get SES sending quotas and statistics
   */
  async getSESQuota(): Promise<{
    max24HourSend: number;
    maxSendRate: number;
    sentLast24Hours: number;
  }> {
    try {
      const command = new GetSendQuotaCommand({});
      const response = await this.sesClient.send(command);
      
      return {
        max24HourSend: response.Max24HourSend || 0,
        maxSendRate: response.MaxSendRate || 0,
        sentLast24Hours: response.SentLast24Hours || 0
      };
    } catch (error) {
      console.error('Error getting SES quota:', error);
      return {
        max24HourSend: 0,
        maxSendRate: 0,
        sentLast24Hours: 0
      };
    }
  }
}

// Export singleton instance
export const emailAutomationService = EmailAutomationService.getInstance();

