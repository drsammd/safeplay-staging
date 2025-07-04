// @ts-nocheck

import twilio from 'twilio';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export class SMSService {
  private client: twilio.Twilio | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken && accountSid !== 'staging-placeholder') {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
    } else {
      console.warn('Twilio not configured - SMS functionality will be mocked');
      this.isConfigured = false;
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Validate phone number
      if (!isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const formattedNumber = parsePhoneNumber(phoneNumber)?.formatInternational();
      
      if (!formattedNumber) {
        return {
          success: false,
          error: 'Unable to format phone number'
        };
      }

      const message = `Your SafePlay verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;

      if (this.isConfigured && this.client) {
        const result = await this.client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
          to: formattedNumber
        });

        return {
          success: true,
          messageId: result.sid
        };
      } else {
        // Mock mode for staging/development
        console.log(`[MOCK SMS] To: ${formattedNumber}, Code: ${code}`);
        return {
          success: true,
          messageId: `mock_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  async sendTwoFactorCode(phoneNumber: string, code: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const formattedNumber = parsePhoneNumber(phoneNumber)?.formatInternational();
      
      if (!formattedNumber) {
        return {
          success: false,
          error: 'Unable to format phone number'
        };
      }

      const message = `Your SafePlay 2FA code is: ${code}. This code expires in 5 minutes.`;

      if (this.isConfigured && this.client) {
        const result = await this.client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
          to: formattedNumber
        });

        return {
          success: true,
          messageId: result.sid
        };
      } else {
        // Mock mode for staging/development
        console.log(`[MOCK 2FA SMS] To: ${formattedNumber}, Code: ${code}`);
        return {
          success: true,
          messageId: `mock_2fa_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('2FA SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send 2FA SMS'
      };
    }
  }

  validatePhoneNumber(phoneNumber: string): {
    isValid: boolean;
    formatted?: string;
    country?: string;
    error?: string;
  } {
    try {
      if (!isValidPhoneNumber(phoneNumber)) {
        return {
          isValid: false,
          error: 'Invalid phone number format'
        };
      }

      const parsed = parsePhoneNumber(phoneNumber);
      
      if (!parsed) {
        return {
          isValid: false,
          error: 'Unable to parse phone number'
        };
      }

      return {
        isValid: true,
        formatted: parsed.formatInternational(),
        country: parsed.country
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Phone validation error'
      };
    }
  }

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getConfigurationStatus(): boolean {
    return this.isConfigured;
  }
}

export const smsService = new SMSService();
