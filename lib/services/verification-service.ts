
import { prisma } from '@/lib/db';
import { smsService } from './sms-service';
import { 
  PhoneVerificationStatus, 
  IdentityVerificationStatus, 
  VerificationLevel,
  TwoFactorMethod,
  TwoFactorStatus
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class VerificationService {
  
  async initiatePhoneVerification(
    userId: string, 
    phoneNumber: string
  ): Promise<{
    success: boolean;
    verificationId?: string;
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

      // Check if there's already a pending verification
      const existingVerification = await prisma.phoneVerification.findFirst({
        where: {
          userId,
          status: 'PENDING',
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (existingVerification) {
        return {
          success: false,
          error: 'A verification code was already sent. Please wait before requesting a new one.'
        };
      }

      // Generate verification code
      const code = smsService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create verification record
      const verification = await prisma.phoneVerification.create({
        data: {
          userId,
          phoneNumber: validation.formatted!,
          verificationCode: await bcrypt.hash(code, 10),
          status: 'PENDING',
          expiresAt,
          metadata: {
            country: validation.country,
            originalInput: phoneNumber
          }
        }
      });

      // Send SMS
      const smsResult = await smsService.sendVerificationCode(validation.formatted!, code);
      
      if (!smsResult.success) {
        // Update verification status to failed
        await prisma.phoneVerification.update({
          where: { id: verification.id },
          data: { status: 'FAILED' }
        });

        return {
          success: false,
          error: smsResult.error || 'Failed to send verification code'
        };
      }

      // Update verification status to sent
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { 
          status: 'SENT',
          metadata: {
            ...verification.metadata as any,
            messageId: smsResult.messageId
          }
        }
      });

      return {
        success: true,
        verificationId: verification.id
      };
    } catch (error) {
      console.error('Phone verification initiation error:', error);
      return {
        success: false,
        error: 'Failed to initiate phone verification'
      };
    }
  }

  async verifyPhoneCode(
    userId: string,
    code: string
  ): Promise<{
    success: boolean;
    verificationLevel?: VerificationLevel;
    error?: string;
  }> {
    try {
      // Find pending verification
      const verification = await prisma.phoneVerification.findFirst({
        where: {
          userId,
          status: 'SENT',
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!verification) {
        return {
          success: false,
          error: 'No valid verification code found or code has expired'
        };
      }

      // Check attempts
      if (verification.attempts >= verification.maxAttempts) {
        await prisma.phoneVerification.update({
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
      await prisma.phoneVerification.update({
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
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { 
          status: 'VERIFIED',
          verifiedAt: new Date()
        }
      });

      // Update user verification status
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          phone: verification.phoneNumber,
          phoneVerified: true,
          phoneVerifiedAt: new Date()
        }
      });

      // Determine new verification level
      const newLevel = this.calculateVerificationLevel(
        true, // phone verified
        user.identityVerified,
        user.twoFactorEnabled
      );

      // Update user verification level
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { verificationLevel: newLevel }
      });

      // Create verification history record
      await this.createVerificationHistoryRecord(
        userId,
        user.verificationLevel,
        newLevel,
        'Phone verification completed successfully'
      );

      return {
        success: true,
        verificationLevel: newLevel
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        error: 'Failed to verify phone code'
      };
    }
  }

  async getUserVerificationStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneVerified: true,
        phoneVerifiedAt: true,
        identityVerified: true,
        identityVerifiedAt: true,
        twoFactorEnabled: true,
        verificationLevel: true,
        verificationNotes: true,
        phone: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get latest verification attempts
    const latestPhoneVerification = await prisma.phoneVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const latestIdentityVerification = await prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      ...user,
      latestPhoneVerification,
      latestIdentityVerification,
      nextSteps: this.getNextVerificationSteps(user)
    };
  }

  private calculateVerificationLevel(
    phoneVerified: boolean,
    identityVerified: boolean,
    twoFactorEnabled: boolean
  ): VerificationLevel {
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
    previousLevel: VerificationLevel,
    newLevel: VerificationLevel,
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

  private getNextVerificationSteps(user: {
    phoneVerified: boolean;
    identityVerified: boolean;
    twoFactorEnabled: boolean;
    verificationLevel: VerificationLevel;
  }) {
    const steps = [];

    if (!user.phoneVerified) {
      steps.push({
        type: 'phone_verification',
        title: 'Verify Your Phone Number',
        description: 'Add and verify your phone number for account security',
        priority: 'high'
      });
    }

    if (!user.identityVerified) {
      steps.push({
        type: 'identity_verification',
        title: 'Verify Your Identity',
        description: 'Upload a government-issued ID to verify your identity',
        priority: user.phoneVerified ? 'high' : 'medium'
      });
    }

    if (!user.twoFactorEnabled && user.phoneVerified) {
      steps.push({
        type: 'two_factor_setup',
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to your account',
        priority: user.identityVerified ? 'medium' : 'low'
      });
    }

    return steps;
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    // Generate 10 backup codes
    const codes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Hash and store the codes
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        userId,
        code: await bcrypt.hash(code, 10)
      }))
    );

    // Clear existing backup codes
    await prisma.twoFactorBackupCode.deleteMany({
      where: { userId }
    });

    // Save new backup codes
    await prisma.twoFactorBackupCode.createMany({
      data: hashedCodes
    });

    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const backupCodes = await prisma.twoFactorBackupCode.findMany({
      where: {
        userId,
        used: false
      }
    });

    for (const backupCode of backupCodes) {
      const isValid = await bcrypt.compare(code, backupCode.code);
      if (isValid) {
        // Mark code as used
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
}

export const verificationService = new VerificationService();
