

import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

interface WebAuthnRegistrationResult {
  success: boolean;
  options?: any;
  error?: string;
}

interface WebAuthnVerificationResult {
  success: boolean;
  credentialId?: string;
  deviceName?: string;
  error?: string;
}

export class WebAuthnService {
  private rpName = 'SafePlay';
  private rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
  private origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

  async generateRegistrationOptions(
    userId: string,
    deviceName?: string
  ): Promise<WebAuthnRegistrationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Get existing credentials for this user
      const existingCredentials = await prisma.webAuthnCredential.findMany({
        where: { userId, isActive: true },
        select: { credentialId: true }
      });

      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: userId,
        userName: user.email,
        userDisplayName: user.name,
        attestationType: 'none',
        excludeCredentials: existingCredentials.map(cred => ({
          id: Buffer.from(cred.credentialId, 'base64url'),
          type: 'public-key',
          transports: ['usb', 'nfc', 'ble', 'internal']
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'cross-platform'
        }
      });

      // Store challenge temporarily
      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationNotes: JSON.stringify({
            webauthnChallenge: options.challenge,
            webauthnDeviceName: deviceName,
            webauthnTimestamp: Date.now()
          })
        }
      });

      return { success: true, options };
    } catch (error) {
      console.error('WebAuthn registration options error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate registration options' 
      };
    }
  }

  async verifyRegistration(
    userId: string,
    response: any
  ): Promise<WebAuthnVerificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { verificationNotes: true }
      });

      if (!user?.verificationNotes) {
        return { success: false, error: 'No registration in progress' };
      }

      const registrationData = JSON.parse(user.verificationNotes);
      const expectedChallenge = registrationData.webauthnChallenge;
      const deviceName = registrationData.webauthnDeviceName;

      if (!expectedChallenge) {
        return { success: false, error: 'No challenge found' };
      }

      // Verify the registration response
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID
      });

      if (!verification.verified || !verification.registrationInfo) {
        return { success: false, error: 'Registration verification failed' };
      }

      const { credentialID, credentialPublicKey, counter, aaguid } = verification.registrationInfo;

      // Save the credential
      const credentialIdBase64 = Buffer.from(credentialID).toString('base64url');
      const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');

      await prisma.webAuthnCredential.create({
        data: {
          userId,
          credentialId: credentialIdBase64,
          publicKey: publicKeyBase64,
          counter: BigInt(counter),
          deviceName: deviceName || 'Security Key',
          aaguid: Buffer.from(aaguid).toString('hex'),
          transports: response.response.transports || [],
          attestationType: 'none',
          isActive: true
        }
      });

      // Clear the challenge
      await prisma.user.update({
        where: { id: userId },
        data: { verificationNotes: null }
      });

      // Create audit log
      await prisma.verificationAuditLog.create({
        data: {
          userId,
          verificationType: 'two_factor',
          action: 'webauthn_credential_registered',
          status: 'SUCCESS',
          automated: false,
          metadata: {
            deviceName: deviceName || 'Security Key',
            credentialId: credentialIdBase64
          }
        }
      });

      return { 
        success: true, 
        credentialId: credentialIdBase64,
        deviceName: deviceName || 'Security Key'
      };
    } catch (error) {
      console.error('WebAuthn registration verification error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration verification failed' 
      };
    }
  }

  async generateAuthenticationOptions(
    userId: string
  ): Promise<WebAuthnRegistrationResult> {
    try {
      // Get user's credentials
      const credentials = await prisma.webAuthnCredential.findMany({
        where: { userId, isActive: true }
      });

      if (credentials.length === 0) {
        return { success: false, error: 'No WebAuthn credentials found' };
      }

      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        allowCredentials: credentials.map(cred => ({
          id: Buffer.from(cred.credentialId, 'base64url'),
          type: 'public-key',
          transports: cred.transports as any[] || ['usb', 'nfc', 'ble', 'internal']
        })),
        userVerification: 'preferred'
      });

      // Store challenge temporarily
      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationNotes: JSON.stringify({
            webauthnAuthChallenge: options.challenge,
            webauthnAuthTimestamp: Date.now()
          })
        }
      });

      return { success: true, options };
    } catch (error) {
      console.error('WebAuthn authentication options error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate authentication options' 
      };
    }
  }

  async verifyAuthentication(
    userId: string,
    response: any
  ): Promise<WebAuthnVerificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { verificationNotes: true }
      });

      if (!user?.verificationNotes) {
        return { success: false, error: 'No authentication in progress' };
      }

      const authData = JSON.parse(user.verificationNotes);
      const expectedChallenge = authData.webauthnAuthChallenge;

      if (!expectedChallenge) {
        return { success: false, error: 'No challenge found' };
      }

      // Find the credential
      const credentialIdBase64 = Buffer.from(response.id, 'base64url').toString('base64url');
      const credential = await prisma.webAuthnCredential.findUnique({
        where: { credentialId: credentialIdBase64 }
      });

      if (!credential || !credential.isActive) {
        return { success: false, error: 'Credential not found' };
      }

      // Verify the authentication response
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: Buffer.from(credential.credentialId, 'base64url'),
          credentialPublicKey: Buffer.from(credential.publicKey, 'base64url'),
          counter: Number(credential.counter)
        }
      });

      if (!verification.verified) {
        return { success: false, error: 'Authentication verification failed' };
      }

      // Update credential counter and last used
      await prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: {
          counter: BigInt(verification.authenticationInfo.newCounter),
          lastUsed: new Date()
        }
      });

      // Clear the challenge
      await prisma.user.update({
        where: { id: userId },
        data: { verificationNotes: null }
      });

      // Create audit log
      await prisma.verificationAuditLog.create({
        data: {
          userId,
          verificationType: 'two_factor',
          action: 'webauthn_authentication_success',
          status: 'SUCCESS',
          automated: false,
          metadata: {
            deviceName: credential.deviceName,
            credentialId: credential.credentialId
          }
        }
      });

      return { 
        success: true, 
        credentialId: credential.credentialId,
        deviceName: credential.deviceName
      };
    } catch (error) {
      console.error('WebAuthn authentication verification error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication verification failed' 
      };
    }
  }

  async removeCredential(
    userId: string,
    credentialId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const credential = await prisma.webAuthnCredential.findFirst({
        where: { 
          userId, 
          credentialId,
          isActive: true 
        }
      });

      if (!credential) {
        return { success: false, error: 'Credential not found' };
      }

      await prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: { isActive: false }
      });

      // Create audit log
      await prisma.verificationAuditLog.create({
        data: {
          userId,
          verificationType: 'two_factor',
          action: 'webauthn_credential_removed',
          status: 'SUCCESS',
          automated: false,
          metadata: {
            deviceName: credential.deviceName,
            credentialId
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('WebAuthn credential removal error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to remove credential' 
      };
    }
  }

  async getUserCredentials(userId: string) {
    return await prisma.webAuthnCredential.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        credentialId: true,
        deviceName: true,
        deviceType: true,
        lastUsed: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const webAuthnService = new WebAuthnService();

