// @ts-nocheck


import { prisma } from '@/lib/db';
import { EmailVerificationPurpose, EmailVerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

interface EmailVerificationResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

export class EmailVerificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendVerificationCode(
    userId: string,
    email: string,
    purpose: EmailVerificationPurpose = 'TWO_FACTOR'
  ): Promise<EmailVerificationResult> {
    try {
      // Check for existing pending verification
      const existingVerification = await prisma.emailVerification.findFirst({
        where: {
          userId,
          email,
          purpose,
          status: 'PENDING',
          expiresAt: { gt: new Date() }
        }
      });

      if (existingVerification) {
        return {
          success: false,
          error: 'A verification code was already sent. Please wait before requesting a new one.'
        };
      }

      // Generate verification code
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create verification record
      const verification = await prisma.emailVerification.create({
        data: {
          userId,
          email,
          verificationCode: await bcrypt.hash(code, 10),
          purpose,
          status: 'PENDING',
          expiresAt
        }
      });

      // Send email
      const emailResult = await this.sendVerificationEmail(email, code, purpose);
      
      if (!emailResult.success) {
        await prisma.emailVerification.update({
          where: { id: verification.id },
          data: { status: 'FAILED' }
        });

        return {
          success: false,
          error: emailResult.error || 'Failed to send verification email'
        };
      }

      // Update verification status to sent
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { 
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Create audit log
      await prisma.verificationAuditLog.create({
        data: {
          userId,
          verificationType: 'two_factor',
          action: 'email_verification_sent',
          status: 'SENT',
          automated: true,
          metadata: {
            email,
            purpose,
            verificationId: verification.id
          }
        }
      });

      return {
        success: true,
        verificationId: verification.id
      };
    } catch (error) {
      console.error('Email verification send error:', error);
      return {
        success: false,
        error: 'Failed to send verification code'
      };
    }
  }

  async verifyCode(
    userId: string,
    code: string,
    purpose: EmailVerificationPurpose = 'TWO_FACTOR'
  ): Promise<EmailVerificationResult> {
    try {
      // Find pending verification
      const verification = await prisma.emailVerification.findFirst({
        where: {
          userId,
          purpose,
          status: 'SENT',
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!verification) {
        return {
          success: false,
          error: 'No valid verification code found or code has expired'
        };
      }

      // Check attempts
      if (verification.attempts >= verification.maxAttempts) {
        await prisma.emailVerification.update({
          where: { id: verification.id },
          data: { status: 'MAX_ATTEMPTS_REACHED' }
        });

        return {
          success: false,
          error: 'Maximum verification attempts reached'
        };
      }

      // Verify code
      const isCodeValid = await bcrypt.compare(code, verification.verificationCode);
      
      // Update attempts
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: verification.attempts + 1 }
      });

      if (!isCodeValid) {
        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Mark verification as successful
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { 
          status: 'VERIFIED',
          verifiedAt: new Date()
        }
      });

      // Create audit log
      await prisma.verificationAuditLog.create({
        data: {
          userId,
          verificationType: 'two_factor',
          action: 'email_verification_success',
          status: 'SUCCESS',
          automated: false,
          metadata: {
            email: verification.email,
            purpose,
            verificationId: verification.id
          }
        }
      });

      return {
        success: true,
        verificationId: verification.id
      };
    } catch (error) {
      console.error('Email verification verify error:', error);
      return {
        success: false,
        error: 'Failed to verify code'
      };
    }
  }

  private generateVerificationCode(): string {
    // Generate 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendVerificationEmail(
    email: string,
    code: string,
    purpose: EmailVerificationPurpose
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let subject = '';
      let message = '';

      switch (purpose) {
        case 'TWO_FACTOR':
          subject = 'SafePlay - Two-Factor Authentication Code';
          message = `Your SafePlay verification code is: ${code}`;
          break;
        case 'EMAIL_CHANGE':
          subject = 'SafePlay - Email Change Verification';
          message = `Please verify your new email address with this code: ${code}`;
          break;
        case 'ACCOUNT_VERIFICATION':
          subject = 'SafePlay - Account Verification';
          message = `Please verify your SafePlay account with this code: ${code}`;
          break;
        case 'PASSWORD_RESET':
          subject = 'SafePlay - Password Reset Verification';
          message = `Your password reset verification code is: ${code}`;
          break;
      }

      const htmlContent = this.generateEmailTemplate(code, purpose);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@safeplay.com',
        to: email,
        subject,
        text: message,
        html: htmlContent
      });

      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  private generateEmailTemplate(code: string, purpose: EmailVerificationPurpose): string {
    const purposeText = {
      'TWO_FACTOR': 'two-factor authentication',
      'EMAIL_CHANGE': 'email address change',
      'ACCOUNT_VERIFICATION': 'account verification',
      'PASSWORD_RESET': 'password reset'
    }[purpose];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SafePlay Verification Code</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #4F46E5; font-size: 24px; font-weight: bold; }
          .code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 2px; }
          .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SafePlay</div>
          </div>
          
          <h2>Verification Code for ${purposeText}</h2>
          
          <p>Use the following verification code to complete your ${purposeText}:</p>
          
          <div class="code">${code}</div>
          
          <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
          
          <div class="footer">
            <p>SafePlay - Keeping families safe</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async cleanupExpiredVerifications(): Promise<number> {
    const result = await prisma.emailVerification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { in: ['PENDING', 'SENT'] }
      }
    });

    return result.count;
  }

  async getUserEmailVerifications(userId: string, limit = 10) {
    return await prisma.emailVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        purpose: true,
        status: true,
        attempts: true,
        createdAt: true,
        expiresAt: true,
        verifiedAt: true
      }
    });
  }
}

export const emailVerificationService = new EmailVerificationService();

