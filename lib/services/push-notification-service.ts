// @ts-nocheck


import { prisma } from '@/lib/db';
import { PushNotificationPlatform } from '@prisma/client';
import admin from 'firebase-admin';

interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface TwoFactorPushResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export class PushNotificationService {
  private firebaseApp: admin.app.App | null = null;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccount) {
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        }
      } else {
        this.firebaseApp = admin.apps[0];
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  async registerDevice(
    userId: string,
    deviceToken: string,
    platform: PushNotificationPlatform,
    deviceInfo?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if device already exists
      const existingDevice = await prisma.pushNotificationDevice.findUnique({
        where: { deviceToken }
      });

      if (existingDevice) {
        // Update existing device
        await prisma.pushNotificationDevice.update({
          where: { deviceToken },
          data: {
            userId,
            platform,
            deviceInfo,
            isActive: true,
            registeredAt: new Date()
          }
        });
      } else {
        // Create new device
        await prisma.pushNotificationDevice.create({
          data: {
            userId,
            deviceToken,
            platform,
            deviceInfo,
            isActive: true,
            registeredAt: new Date()
          }
        });
      }

      // Create audit log
      await prisma.verificationAuditLog.create({
        data: {
          userId,
          verificationType: 'two_factor',
          action: 'push_device_registered',
          status: 'SUCCESS',
          automated: false,
          metadata: {
            platform,
            deviceInfo
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Device registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to register device' 
      };
    }
  }

  async sendTwoFactorNotification(
    userId: string,
    purpose: string = 'Login verification'
  ): Promise<TwoFactorPushResult> {
    try {
      if (!this.firebaseApp) {
        return { success: false, error: 'Firebase not initialized' };
      }

      // Get user's active devices
      const devices = await prisma.pushNotificationDevice.findMany({
        where: { userId, isActive: true }
      });

      if (devices.length === 0) {
        return { success: false, error: 'No registered devices found' };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Generate notification ID
      const notificationId = `2fa_${userId}_${Date.now()}`;

      // Prepare notification payload
      const payload = {
        notification: {
          title: 'SafePlay - Two-Factor Authentication',
          body: `${purpose} - Tap to approve`,
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png'
        },
        data: {
          type: 'two_factor_auth',
          notificationId,
          userId,
          purpose,
          timestamp: Date.now().toString()
        }
      };

      // Send to all devices
      const deviceTokens = devices.map(device => device.deviceToken);
      const messaging = admin.messaging();

      const response = await messaging.sendMulticast({
        tokens: deviceTokens,
        ...payload
      });

      // Update device last used timestamps for successful sends
      const successfulTokens = response.responses
        .map((resp, index) => resp.success ? deviceTokens[index] : null)
        .filter(Boolean) as string[];

      if (successfulTokens.length > 0) {
        await prisma.pushNotificationDevice.updateMany({
          where: { deviceToken: { in: successfulTokens } },
          data: { lastUsed: new Date() }
        });
      }

      // Remove invalid tokens
      const failedTokens = response.responses
        .map((resp, index) => !resp.success ? deviceTokens[index] : null)
        .filter(Boolean) as string[];

      if (failedTokens.length > 0) {
        await prisma.pushNotificationDevice.updateMany({
          where: { deviceToken: { in: failedTokens } },
          data: { isActive: false }
        });
      }

      // Create audit log
      await prisma.verificationAuditLog.create({
        data: {
          userId,
          verificationType: 'two_factor',
          action: 'push_notification_sent',
          status: response.successCount > 0 ? 'SUCCESS' : 'FAILED',
          automated: true,
          metadata: {
            notificationId,
            successCount: response.successCount,
            failureCount: response.failureCount,
            purpose
          }
        }
      });

      if (response.successCount === 0) {
        return { success: false, error: 'Failed to send to any device' };
      }

      return { 
        success: true, 
        notificationId 
      };
    } catch (error) {
      console.error('Push notification send error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send notification' 
      };
    }
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<PushNotificationResult> {
    try {
      if (!this.firebaseApp) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const devices = await prisma.pushNotificationDevice.findMany({
        where: { userId, isActive: true }
      });

      if (devices.length === 0) {
        return { success: false, error: 'No registered devices found' };
      }

      const payload = {
        notification: { title, body },
        data: data || {}
      };

      const deviceTokens = devices.map(device => device.deviceToken);
      const messaging = admin.messaging();

      const response = await messaging.sendMulticast({
        tokens: deviceTokens,
        ...payload
      });

      // Update successful devices
      const successfulTokens = response.responses
        .map((resp, index) => resp.success ? deviceTokens[index] : null)
        .filter(Boolean) as string[];

      if (successfulTokens.length > 0) {
        await prisma.pushNotificationDevice.updateMany({
          where: { deviceToken: { in: successfulTokens } },
          data: { lastUsed: new Date() }
        });
      }

      // Remove invalid tokens
      const failedTokens = response.responses
        .map((resp, index) => !resp.success ? deviceTokens[index] : null)
        .filter(Boolean) as string[];

      if (failedTokens.length > 0) {
        await prisma.pushNotificationDevice.updateMany({
          where: { deviceToken: { in: failedTokens } },
          data: { isActive: false }
        });
      }

      return { 
        success: response.successCount > 0,
        messageId: response.responses[0]?.messageId,
        error: response.successCount === 0 ? 'Failed to send to any device' : undefined
      };
    } catch (error) {
      console.error('Push notification error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send notification' 
      };
    }
  }

  async removeDevice(deviceToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.pushNotificationDevice.update({
        where: { deviceToken },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      console.error('Device removal error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove device' 
      };
    }
  }

  async getUserDevices(userId: string) {
    return await prisma.pushNotificationDevice.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        platform: true,
        deviceInfo: true,
        lastUsed: true,
        registeredAt: true
      },
      orderBy: { registeredAt: 'desc' }
    });
  }

  async cleanupInactiveDevices(daysSinceLastUse = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysSinceLastUse * 24 * 60 * 60 * 1000);
    
    const result = await prisma.pushNotificationDevice.updateMany({
      where: {
        lastUsed: { lt: cutoffDate },
        isActive: true
      },
      data: { isActive: false }
    });

    return result.count;
  }
}

export const pushNotificationService = new PushNotificationService();

