
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';
import { 
  NotificationChannel, 
  NotificationStatus, 
  NotificationRecipientType,
  EnhancedAlert,
  User 
} from '@prisma/client';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface NotificationData {
  alertId: string;
  recipientId: string;
  recipientType: NotificationRecipientType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  metadata?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
}

export class NotificationService {
  /**
   * Send notification through specified channel
   */
  static async sendNotification(data: NotificationData): Promise<{
    success: boolean;
    notificationId?: string;
    externalId?: string;
    error?: string;
  }> {
    try {
      // Create notification record
      const notification = await prisma.alertNotification.create({
        data: {
          alertId: data.alertId,
          recipientId: data.recipientId,
          recipientType: data.recipientType,
          channel: data.channel,
          subject: data.subject,
          message: data.message,
          metadata: data.metadata,
          scheduledAt: data.scheduledAt || new Date(),
          status: NotificationStatus.PENDING,
        },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          }
        }
      });

      let result: { success: boolean; externalId?: string; error?: string };

      // Send notification based on channel
      switch (data.channel) {
        case NotificationChannel.SMS:
          result = await this.sendSMS(notification);
          break;
        case NotificationChannel.EMAIL:
          result = await this.sendEmail(notification);
          break;
        case NotificationChannel.PUSH_NOTIFICATION:
          result = await this.sendPushNotification(notification);
          break;
        case NotificationChannel.IN_APP:
          result = await this.sendInAppNotification(notification);
          break;
        case NotificationChannel.PHONE_CALL:
          result = await this.makePhoneCall(notification);
          break;
        default:
          result = { success: false, error: 'Unsupported notification channel' };
      }

      // Update notification status
      const updateData: any = {
        status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        sentAt: result.success ? new Date() : null,
        failedAt: result.success ? null : new Date(),
        failureReason: result.error,
        externalId: result.externalId,
      };

      await prisma.alertNotification.update({
        where: { id: notification.id },
        data: updateData
      });

      return {
        success: result.success,
        notificationId: notification.id,
        externalId: result.externalId,
        error: result.error
      };

    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(notification: any): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return { success: false, error: 'Twilio credentials not configured' };
      }

      if (!notification.recipient.phone) {
        return { success: false, error: 'Recipient phone number not available' };
      }

      const message = await twilioClient.messages.create({
        body: notification.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.recipient.phone,
      });

      return {
        success: true,
        externalId: message.sid
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      };
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmail(notification: any): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return { success: false, error: 'Email credentials not configured' };
      }

      if (!notification.recipient.email) {
        return { success: false, error: 'Recipient email not available' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: notification.recipient.email,
        subject: notification.subject || 'SafePlay Alert',
        text: notification.message,
        html: this.formatEmailHTML(notification),
      };

      const result = await emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        externalId: result.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed'
      };
    }
  }

  /**
   * Send push notification (placeholder - would integrate with FCM/APNS)
   */
  private static async sendPushNotification(notification: any): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    try {
      // TODO: Implement FCM/APNS integration
      console.log('Push notification would be sent:', notification);
      
      return {
        success: true,
        externalId: `push_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Push notification service not implemented'
      };
    }
  }

  /**
   * Send in-app notification
   */
  private static async sendInAppNotification(notification: any): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    try {
      // For in-app notifications, we just mark as sent
      // The actual delivery happens via WebSocket
      return {
        success: true,
        externalId: `inapp_${notification.id}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'In-app notification failed'
      };
    }
  }

  /**
   * Make phone call (using Twilio Voice)
   */
  private static async makePhoneCall(notification: any): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return { success: false, error: 'Twilio credentials not configured' };
      }

      if (!notification.recipient.phone) {
        return { success: false, error: 'Recipient phone number not available' };
      }

      const call = await twilioClient.calls.create({
        twiml: `<Response><Say>${notification.message}</Say></Response>`,
        from: process.env.TWILIO_PHONE_NUMBER || '',
        to: notification.recipient.phone,
      });

      return {
        success: true,
        externalId: call.sid
      };
    } catch (error) {
      console.error('Error making phone call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Phone call failed'
      };
    }
  }

  /**
   * Format email HTML template
   */
  private static formatEmailHTML(notification: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SafePlay Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF6B6B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .alert-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SafePlay Alert</h1>
            </div>
            <div class="content">
              <div class="alert-info">
                <h2>${notification.subject || 'Safety Alert'}</h2>
                <p>${notification.message}</p>
                
                ${notification.metadata?.alertDetails ? `
                  <hr>
                  <p><strong>Alert Details:</strong></p>
                  <ul>
                    ${notification.metadata.alertDetails.childName ? `<li><strong>Child:</strong> ${notification.metadata.alertDetails.childName}</li>` : ''}
                    ${notification.metadata.alertDetails.venue ? `<li><strong>Venue:</strong> ${notification.metadata.alertDetails.venue}</li>` : ''}
                    ${notification.metadata.alertDetails.location ? `<li><strong>Location:</strong> ${notification.metadata.alertDetails.location}</li>` : ''}
                    ${notification.metadata.alertDetails.time ? `<li><strong>Time:</strong> ${notification.metadata.alertDetails.time}</li>` : ''}
                  </ul>
                ` : ''}
                
                <p style="margin-top: 20px;">
                  <a href="${process.env.NEXTAUTH_URL}/venue-admin" style="background: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View Alert Dashboard
                  </a>
                </p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from SafePlay. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Bulk send notifications for an alert
   */
  static async sendAlertNotifications(
    alertId: string,
    recipients: Array<{
      userId: string;
      recipientType: NotificationRecipientType;
      channels: NotificationChannel[];
    }>,
    customMessage?: string
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Get alert details
    const alert = await prisma.enhancedAlert.findUnique({
      where: { id: alertId },
      include: {
        child: true,
        venue: true,
        camera: true,
        zone: true,
      }
    });

    if (!alert) {
      return {
        success: false,
        sent: 0,
        failed: 1,
        errors: ['Alert not found']
      };
    }

    // Generate message based on alert type
    const message = customMessage || this.generateAlertMessage(alert);
    const subject = this.generateAlertSubject(alert);

    // Send notifications to all recipients
    for (const recipient of recipients) {
      for (const channel of recipient.channels) {
        try {
          const result = await this.sendNotification({
            alertId,
            recipientId: recipient.userId,
            recipientType: recipient.recipientType,
            channel,
            subject,
            message,
            metadata: {
              alertDetails: {
                childName: alert.child ? `${alert.child.firstName} ${alert.child.lastName}` : null,
                venue: alert.venue.name,
                location: alert.zone?.name || 'Unknown location',
                time: alert.createdAt.toLocaleString(),
                severity: alert.severity,
                type: alert.type
              }
            }
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            if (result.error) {
              errors.push(`${channel}: ${result.error}`);
            }
          }
        } catch (error) {
          failed++;
          errors.push(`${channel}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return {
      success: sent > 0,
      sent,
      failed,
      errors
    };
  }

  /**
   * Generate alert message based on alert type
   */
  private static generateAlertMessage(alert: any): string {
    const childName = alert.child ? `${alert.child.firstName} ${alert.child.lastName}` : 'Child';
    const venue = alert.venue.name;
    const location = alert.zone?.name || 'venue';

    switch (alert.type) {
      case 'CHILD_DETECTED':
        return `${childName} has been detected at ${venue} in the ${location}.`;
      
      case 'CHILD_MISSING':
        return `URGENT: ${childName} has not been seen at ${venue} for an extended period. Last seen: ${location}.`;
      
      case 'CHILD_UNAUTHORIZED_EXIT':
        return `ALERT: ${childName} has been detected near an exit at ${venue} without proper checkout.`;
      
      case 'UNAUTHORIZED_PERSON':
        return `Security Alert: An unauthorized person has been detected at ${venue} in the ${location}.`;
      
      case 'STRANGER_DANGER':
        return `Safety Alert: An unrecognized adult has been detected near children at ${venue}.`;
      
      case 'EMERGENCY_BROADCAST':
        return `EMERGENCY: ${alert.description} at ${venue}. Please follow emergency protocols.`;
      
      case 'MEDICAL_EMERGENCY':
        return `Medical Emergency at ${venue}. Immediate assistance required in ${location}.`;
      
      case 'EVACUATION':
        return `EVACUATION ALERT: Please evacuate ${venue} immediately. Follow emergency exit procedures.`;
      
      default:
        return `Alert at ${venue}: ${alert.description}`;
    }
  }

  /**
   * Generate alert subject based on alert type
   */
  private static generateAlertSubject(alert: any): string {
    const venue = alert.venue.name;
    
    switch (alert.severity) {
      case 'EMERGENCY':
      case 'CRITICAL':
        return `🚨 URGENT SafePlay Alert - ${venue}`;
      
      case 'HIGH':
        return `⚠️ High Priority SafePlay Alert - ${venue}`;
      
      case 'MEDIUM':
        return `🔔 SafePlay Alert - ${venue}`;
      
      default:
        return `SafePlay Notification - ${venue}`;
    }
  }
}
