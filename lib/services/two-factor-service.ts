
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { smsService } from './sms-service';
import { TwoFactorMethod, TwoFactorStatus, TwoFactorPurpose } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class TwoFactorService {
  
  async setupAuthenticatorApp(userId: string): Promise<{
    success: boolean;
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: user.email,
        issuer: 'SafePlay',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Save secret to user (temporarily, until confirmed)
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret.base32
        }
      });

      // Generate backup codes
      const backupCodes = await this.generateBackupCodes(userId);

      return {
        success: true,
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      return {
        success: false,
        error: 'Failed to setup authenticator app'
      };
    }
  }

  async verifyAuthenticatorSetup(
    userId: string,
    token: string
  ): Promise<{
    success: boolean;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true }
      });

      if (!user?.twoFactorSecret) {
        return {
          success: false,
          error: 'No 2FA setup in progress'
        };
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        token,
        window: 2,
        encoding: 'base32'
      });

      if (!verified) {
        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

      // Enable 2FA for user
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true
        }
      });

      // Update verification level
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { phoneVerified: true, identityVerified: true, twoFactorEnabled: true, verificationLevel: true }
      });

      if (updatedUser) {
        const newLevel = this.calculateVerificationLevel(
          updatedUser.phoneVerified,
          updatedUser.identityVerified,
          true
        );

        await prisma.user.update({
          where: { id: userId },
          data: { verificationLevel: newLevel }
        });

        // Create history record
        await this.createVerificationHistoryRecord(
          userId,
          updatedUser.verificationLevel,
          newLevel,
          'Two-factor authentication enabled'
        );
      }

      // Get backup codes
      const backupCodes = await this.getBackupCodes(userId);

      return {
        success: true,
        backupCodes
      };
    } catch (error) {
      console.error('2FA verification error:', error);
      return {
        success: false,
        error: 'Failed to verify 2FA setup'
      };
    }
  }

  async setupSMS2FA(
    userId: string,
    phoneNumber: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate phone number
      const validation = smsService.validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid phone number'
        };
      }

      // Update user's 2FA phone number
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorPhone: validation.formatted!,
          twoFactorEnabled: true
        }
      });

      // Update verification level
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phoneVerified: true, identityVerified: true, verificationLevel: true }
      });

      if (user) {
        const newLevel = this.calculateVerificationLevel(
          user.phoneVerified,
          user.identityVerified,
          true
        );

        await prisma.user.update({
          where: { id: userId },
          data: { verificationLevel: newLevel }
        });

        // Create history record
        await this.createVerificationHistoryRecord(
          userId,
          user.verificationLevel,
          newLevel,
          'SMS two-factor authentication enabled'
        );
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('SMS 2FA setup error:', error);
      return {
        success: false,
        error: 'Failed to setup SMS 2FA'
      };
    }
  }

  async sendSMS2FACode(
    userId: string,
    purpose: TwoFactorPurpose = 'LOGIN'
  ): Promise<{
    success: boolean;
    attemptId?: string;
    error?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorPhone: true, twoFactorEnabled: true }
      });

      if (!user?.twoFactorEnabled || !user.twoFactorPhone) {
        return {
          success: false,
          error: '2FA not enabled or phone number not set'
        };
      }

      // Generate code
      const code = smsService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Create attempt record
      const attempt = await prisma.twoFactorAttempt.create({
        data: {
          userId,
          method: 'SMS',
          code: await bcrypt.hash(code, 10),
          purpose,
          expiresAt
        }
      });

      // Send SMS
      const smsResult = await smsService.sendTwoFactorCode(user.twoFactorPhone, code);
      
      if (!smsResult.success) {
        await prisma.twoFactorAttempt.update({
          where: { id: attempt.id },
          data: { 
            status: 'FAILED',
            failureReason: smsResult.error
          }
        });

        return {
          success: false,
          error: smsResult.error || 'Failed to send 2FA code'
        };
      }

      return {
        success: true,
        attemptId: attempt.id
      };
    } catch (error) {
      console.error('SMS 2FA send error:', error);
      return {
        success: false,
        error: 'Failed to send 2FA code'
      };
    }
  }

  async verify2FACode(
    userId: string,
    code: string,
    method: TwoFactorMethod,
    purpose: TwoFactorPurpose = 'LOGIN'
  ): Promise<{
    success: boolean;
    isBackupCode?: boolean;
    error?: string;
  }> {
    try {
      if (method === 'BACKUP_CODE') {
        const isValid = await this.verifyBackupCode(userId, code);
        return {
          success: isValid,
          isBackupCode: true,
          error: isValid ? undefined : 'Invalid backup code'
        };
      }

      if (method === 'SMS') {
        return await this.verifySMS2FA(userId, code, purpose);
      }

      if (method === 'AUTHENTICATOR_APP') {
        return await this.verifyAuthenticatorCode(userId, code, purpose);
      }

      return {
        success: false,
        error: 'Unsupported 2FA method'
      };
    } catch (error) {
      console.error('2FA verification error:', error);
      return {
        success: false,
        error: 'Failed to verify 2FA code'
      };
    }
  }

  private async verifySMS2FA(
    userId: string,
    code: string,
    purpose: TwoFactorPurpose
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Find recent SMS attempt
    const attempt = await prisma.twoFactorAttempt.findFirst({
      where: {
        userId,
        method: 'SMS',
        purpose,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!attempt) {
      return {
        success: false,
        error: 'No valid 2FA attempt found or code has expired'
      };
    }

    // Verify code
    const isValid = await bcrypt.compare(code, attempt.code!);
    
    if (isValid) {
      await prisma.twoFactorAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'SUCCESS',
          successAt: new Date()
        }
      });

      return { success: true };
    } else {
      await prisma.twoFactorAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          failureReason: 'Invalid code'
        }
      });

      return {
        success: false,
        error: 'Invalid 2FA code'
      };
    }
  }

  private async verifyAuthenticatorCode(
    userId: string,
    token: string,
    purpose: TwoFactorPurpose
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true }
    });

    if (!user?.twoFactorSecret) {
      return {
        success: false,
        error: 'Authenticator app not set up'
      };
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      token,
      window: 2,
      encoding: 'base32'
    });

    // Create attempt record
    await prisma.twoFactorAttempt.create({
      data: {
        userId,
        method: 'AUTHENTICATOR_APP',
        purpose,
        status: verified ? 'SUCCESS' : 'FAILED',
        successAt: verified ? new Date() : undefined,
        failureReason: verified ? undefined : 'Invalid token',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    return {
      success: verified,
      error: verified ? undefined : 'Invalid authenticator code'
    };
  }

  async disable2FA(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phoneVerified: true, identityVerified: true, verificationLevel: true }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorPhone: null
        }
      });

      // Clear backup codes
      await prisma.twoFactorBackupCode.deleteMany({
        where: { userId }
      });

      // Update verification level
      const newLevel = this.calculateVerificationLevel(
        user.phoneVerified,
        user.identityVerified,
        false
      );

      await prisma.user.update({
        where: { id: userId },
        data: { verificationLevel: newLevel }
      });

      // Create history record
      await this.createVerificationHistoryRecord(
        userId,
        user.verificationLevel,
        newLevel,
        'Two-factor authentication disabled'
      );

      return { success: true };
    } catch (error) {
      console.error('2FA disable error:', error);
      return {
        success: false,
        error: 'Failed to disable 2FA'
      };
    }
  }

  private async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );

    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        userId,
        code: await bcrypt.hash(code, 10)
      }))
    );

    await prisma.twoFactorBackupCode.deleteMany({
      where: { userId }
    });

    await prisma.twoFactorBackupCode.createMany({
      data: hashedCodes
    });

    return codes;
  }

  private async getBackupCodes(userId: string): Promise<string[]> {
    // This would typically return the plaintext codes generated during setup
    // For security, we should only show them once during setup
    return [];
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const backupCodes = await prisma.twoFactorBackupCode.findMany({
      where: {
        userId,
        used: false
      }
    });

    for (const backupCode of backupCodes) {
      const isValid = await bcrypt.compare(code, backupCode.code);
      if (isValid) {
        await prisma.twoFactorBackupCode.update({
          where: { id: backupCode.id },
          data: {
            used: true,
            usedAt: new Date()
          }
        });
        return true;
      }
    }

    return false;
  }

  private calculateVerificationLevel(
    phoneVerified: boolean,
    identityVerified: boolean,
    twoFactorEnabled: boolean
  ) {
    if (phoneVerified && identityVerified && twoFactorEnabled) {
      return 'FULL_VERIFIED';
    } else if (phoneVerified && identityVerified) {
      return 'IDENTITY_VERIFIED';
    } else if (phoneVerified) {
      return 'PHONE_VERIFIED';
    } else {
      return 'UNVERIFIED';
    }
  }

  private async createVerificationHistoryRecord(
    userId: string,
    previousLevel: any,
    newLevel: any,
    reason: string,
    changedBy?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true, identityVerified: true, twoFactorEnabled: true }
    });

    await prisma.verificationStatusHistory.create({
      data: {
        userId,
        previousLevel,
        newLevel,
        changeReason: reason,
        changedBy,
        phoneVerified: user?.phoneVerified || false,
        identityVerified: user?.identityVerified || false,
        twoFactorEnabled: user?.twoFactorEnabled || false
      }
    });
  }
}

export const twoFactorService = new TwoFactorService();
