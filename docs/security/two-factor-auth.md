
# Two-Factor Authentication (2FA) Implementation

## Overview

mySafePlay™(TM) implements comprehensive two-factor authentication supporting multiple methods including SMS, Email, and Time-based One-Time Passwords (TOTP) through authenticator apps. This document covers the complete 2FA implementation, setup procedures, and security considerations.

## Table of Contents

1. [2FA Methods](#2fa-methods)
2. [Implementation Architecture](#implementation-architecture)
3. [Setup Procedures](#setup-procedures)
4. [Security Features](#security-features)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

## 2FA Methods

### 1. SMS-Based 2FA

SMS 2FA sends verification codes to the user's registered phone number.

```typescript
// Enable SMS 2FA
const enableSMS2FA = async (phoneNumber: string) => {
  const response = await fetch('/api/auth/2fa/sms/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  
  return response.json();
};

// Verify SMS code
const verifySMSCode = async (code: string) => {
  const response = await fetch('/api/auth/2fa/sms/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  return response.json();
};
```

### 2. Email-Based 2FA

Email 2FA sends verification codes to the user's registered email address.

```typescript
// Enable Email 2FA
const enableEmail2FA = async (email: string) => {
  const response = await fetch('/api/auth/2fa/email/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  return response.json();
};

// Request email verification code
const requestEmailCode = async () => {
  const response = await fetch('/api/auth/2fa/email/send', {
    method: 'POST'
  });
  
  return response.json();
};
```

### 3. TOTP Authenticator Apps

TOTP 2FA works with popular authenticator apps like Google Authenticator, Authy, and Microsoft Authenticator.

```typescript
// Setup TOTP 2FA
const setupTOTP = async () => {
  const response = await fetch('/api/auth/2fa/totp/setup', {
    method: 'POST'
  });
  
  const { secret, qrCode, backupCodes } = await response.json();
  
  return {
    secret,        // Secret key for manual entry
    qrCode,        // QR code for easy setup
    backupCodes    // One-time backup codes
  };
};

// Verify TOTP code
const verifyTOTP = async (code: string) => {
  const response = await fetch('/api/auth/2fa/totp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  return response.json();
};
```

## Implementation Architecture

### Database Schema

```prisma
model User {
  // 2FA Configuration
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?   // TOTP secret
  twoFactorPhone    String?   // SMS 2FA phone
  twoFactorEmail    String?   // Email 2FA address
  
  // Relations
  twoFactorAttempts TwoFactorAttempt[]
  backupCodes       TwoFactorBackupCode[]
}

model TwoFactorAttempt {
  id        String           @id @default(cuid())
  userId    String
  method    TwoFactorMethod
  code      String           // Hashed code
  isUsed    Boolean          @default(false)
  expiresAt DateTime
  createdAt DateTime         @default(now())
  
  user      User             @relation(fields: [userId], references: [id])
}

model TwoFactorBackupCode {
  id        String   @id @default(cuid())
  userId    String
  code      String   // Hashed backup code
  isUsed    Boolean  @default(false)
  createdAt DateTime @default(now())
  usedAt    DateTime?
  
  user      User     @relation(fields: [userId], references: [id])
}

enum TwoFactorMethod {
  SMS
  EMAIL
  TOTP
  BACKUP_CODE
}
```

### 2FA Service Implementation

```typescript
// lib/auth/two-factor.ts
import { authenticator } from 'otplib';
import { generateSecret } from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorService {
  // Generate TOTP secret and QR code
  async generateTOTPSecret(userId: string, email: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const secret = authenticator.generateSecret();
    const serviceName = 'mySafePlay™(TM)';
    const accountName = email;
    
    const otpauth = authenticator.keyuri(accountName, serviceName, secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store in database
    await this.storeTOTPSecret(userId, secret, backupCodes);
    
    return { secret, qrCode, backupCodes };
  }
  
  // Verify TOTP code
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const user = await this.getUserTOTPSecret(userId);
    if (!user?.twoFactorSecret) return false;
    
    return authenticator.verify({
      token,
      secret: user.twoFactorSecret,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });
  }
  
  // Send SMS verification code
  async sendSMSCode(phoneNumber: string): Promise<string> {
    const code = this.generateNumericCode(6);
    const hashedCode = await this.hashCode(code);
    
    // Store code in database with expiration
    await this.storeTwoFactorAttempt({
      userId: this.currentUserId,
      method: 'SMS',
      code: hashedCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
    
    // Send SMS via provider
    await this.smsProvider.send(phoneNumber, `Your mySafePlay™(TM) verification code: ${code}`);
    
    return code; // Return for testing purposes only
  }
  
  // Send email verification code
  async sendEmailCode(email: string): Promise<void> {
    const code = this.generateNumericCode(6);
    const hashedCode = await this.hashCode(code);
    
    // Store code in database
    await this.storeTwoFactorAttempt({
      userId: this.currentUserId,
      method: 'EMAIL',
      code: hashedCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    // Send email
    await this.emailService.send({
      to: email,
      subject: 'mySafePlay™(TM) Verification Code',
      template: '2fa-email-code',
      data: { code, expiresIn: '10 minutes' }
    });
  }
  
  // Verify SMS/Email code
  async verifyCode(userId: string, code: string, method: TwoFactorMethod): Promise<boolean> {
    const attempts = await this.getValidAttempts(userId, method);
    
    for (const attempt of attempts) {
      const isValid = await this.verifyHashedCode(code, attempt.code);
      if (isValid && !attempt.isUsed && attempt.expiresAt > new Date()) {
        // Mark as used
        await this.markAttemptAsUsed(attempt.id);
        return true;
      }
    }
    
    return false;
  }
  
  // Generate backup codes
  private generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () => 
      this.generateAlphanumericCode(8).toUpperCase()
    );
  }
  
  // Verify backup code
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const backupCodes = await this.getUserBackupCodes(userId);
    
    for (const backupCode of backupCodes) {
      const isValid = await this.verifyHashedCode(code, backupCode.code);
      if (isValid && !backupCode.isUsed) {
        // Mark backup code as used
        await this.markBackupCodeAsUsed(backupCode.id);
        return true;
      }
    }
    
    return false;
  }
}
```

## Setup Procedures

### User 2FA Setup Flow

```tsx
// components/auth/two-factor-setup.tsx
export const TwoFactorSetup: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email' | 'totp'>('totp');
  const [setupStep, setSetupStep] = useState<'select' | 'configure' | 'verify' | 'complete'>('select');
  const [totpData, setTotpData] = useState<{ secret: string; qrCode: string; backupCodes: string[] }>();
  
  const setupTOTP = async () => {
    try {
      const response = await fetch('/api/auth/2fa/totp/setup', { method: 'POST' });
      const data = await response.json();
      setTotpData(data);
      setSetupStep('configure');
    } catch (error) {
      console.error('TOTP setup failed:', error);
    }
  };
  
  const verifySetup = async (code: string) => {
    try {
      const response = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, method: selectedMethod })
      });
      
      if (response.ok) {
        setSetupStep('complete');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
    }
  };
  
  return (
    <div className="two-factor-setup">
      {setupStep === 'select' && (
        <div className="method-selection">
          <h3>Choose Your 2FA Method</h3>
          <div className="method-options">
            <button
              onClick={() => setSelectedMethod('totp')}
              className={selectedMethod === 'totp' ? 'selected' : ''}
            >
              <Shield className="icon" />
              <div>
                <h4>Authenticator App</h4>
                <p>Most secure option using Google Authenticator, Authy, etc.</p>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedMethod('sms')}
              className={selectedMethod === 'sms' ? 'selected' : ''}
            >
              <Phone className="icon" />
              <div>
                <h4>SMS Text Message</h4>
                <p>Receive codes via text message to your phone</p>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedMethod('email')}
              className={selectedMethod === 'email' ? 'selected' : ''}
            >
              <Mail className="icon" />
              <div>
                <h4>Email</h4>
                <p>Receive codes via email</p>
              </div>
            </button>
          </div>
          
          <button onClick={handleMethodSetup} className="continue-button">
            Continue with {selectedMethod.toUpperCase()}
          </button>
        </div>
      )}
      
      {setupStep === 'configure' && selectedMethod === 'totp' && (
        <TOTPConfiguration
          secret={totpData?.secret}
          qrCode={totpData?.qrCode}
          onVerify={verifySetup}
        />
      )}
      
      {setupStep === 'complete' && (
        <SetupComplete
          method={selectedMethod}
          backupCodes={totpData?.backupCodes}
        />
      )}
    </div>
  );
};
```

### TOTP Configuration Component

```tsx
// components/auth/totp-configuration.tsx
export const TOTPConfiguration: React.FC<{
  secret?: string;
  qrCode?: string;
  onVerify: (code: string) => void;
}> = ({ secret, qrCode, onVerify }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  return (
    <div className="totp-configuration">
      <h3>Set Up Authenticator App</h3>
      
      <div className="setup-instructions">
        <ol>
          <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
          <li>Scan the QR code below or enter the secret key manually</li>
          <li>Enter the 6-digit code from your app to verify setup</li>
        </ol>
      </div>
      
      <div className="qr-code-section">
        {qrCode && !showManualEntry ? (
          <div className="qr-code">
            <img src={qrCode} alt="2FA QR Code" />
            <button
              onClick={() => setShowManualEntry(true)}
              className="manual-entry-link"
            >
              Can't scan? Enter code manually
            </button>
          </div>
        ) : (
          <div className="manual-entry">
            <label>Secret Key:</label>
            <div className="secret-key">
              <code>{secret}</code>
              <button onClick={() => navigator.clipboard.writeText(secret || '')}>
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowManualEntry(false)}
              className="qr-code-link"
            >
              Show QR code instead
            </button>
          </div>
        )}
      </div>
      
      <div className="verification-section">
        <label>Enter verification code from your authenticator app:</label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="000000"
          maxLength={6}
          pattern="[0-9]{6}"
        />
        <button
          onClick={() => onVerify(verificationCode)}
          disabled={verificationCode.length !== 6}
        >
          Verify & Enable 2FA
        </button>
      </div>
    </div>
  );
};
```

## Security Features

### Rate Limiting

```typescript
// lib/auth/rate-limiting.ts
export class TwoFactorRateLimit {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  
  async checkRateLimit(userId: string, method: TwoFactorMethod): Promise<boolean> {
    const key = `${userId}:${method}`;
    const now = Date.now();
    const limit = this.getLimitForMethod(method);
    
    const userAttempts = this.attempts.get(key);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      // Reset or initialize
      this.attempts.set(key, { count: 1, resetTime: now + (15 * 60 * 1000) }); // 15 minutes
      return true;
    }
    
    if (userAttempts.count >= limit.maxAttempts) {
      return false; // Rate limited
    }
    
    userAttempts.count++;
    return true;
  }
  
  private getLimitForMethod(method: TwoFactorMethod) {
    switch (method) {
      case 'SMS':
        return { maxAttempts: 3, windowMs: 15 * 60 * 1000 }; // 3 attempts per 15 minutes
      case 'EMAIL':
        return { maxAttempts: 5, windowMs: 15 * 60 * 1000 }; // 5 attempts per 15 minutes
      case 'TOTP':
        return { maxAttempts: 10, windowMs: 15 * 60 * 1000 }; // 10 attempts per 15 minutes
      default:
        return { maxAttempts: 3, windowMs: 15 * 60 * 1000 };
    }
  }
}
```

### Backup Codes

```typescript
// Backup code management
export class BackupCodeManager {
  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () => 
      this.generateSecureCode(8)
    );
    
    // Hash and store codes
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        userId,
        code: await this.hashCode(code),
        isUsed: false,
        createdAt: new Date()
      }))
    );
    
    await this.storeBackupCodes(hashedCodes);
    
    return codes; // Return unhashed codes for user
  }
  
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const backupCodes = await this.getUserBackupCodes(userId);
    
    for (const backupCode of backupCodes) {
      if (!backupCode.isUsed && await this.verifyCode(code, backupCode.code)) {
        await this.markBackupCodeAsUsed(backupCode.id);
        
        // If this was the last backup code, warn user
        const remainingCodes = await this.getRemainingBackupCodes(userId);
        if (remainingCodes.length <= 2) {
          await this.notifyLowBackupCodes(userId);
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  private generateSecureCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
```

## API Reference

### 2FA Setup Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/2fa/totp/setup` | POST | Generate TOTP secret and QR code |
| `/api/auth/2fa/sms/enable` | POST | Enable SMS 2FA |
| `/api/auth/2fa/email/enable` | POST | Enable Email 2FA |
| `/api/auth/2fa/verify-setup` | POST | Verify 2FA setup |
| `/api/auth/2fa/disable` | POST | Disable 2FA |

### 2FA Verification Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/2fa/verify` | POST | Verify 2FA code during login |
| `/api/auth/2fa/sms/send` | POST | Send SMS verification code |
| `/api/auth/2fa/email/send` | POST | Send email verification code |
| `/api/auth/2fa/backup/verify` | POST | Verify backup code |

### 2FA Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/2fa/status` | GET | Get 2FA status |
| `/api/auth/2fa/backup-codes` | GET | Get backup codes |
| `/api/auth/2fa/backup-codes/regenerate` | POST | Regenerate backup codes |
| `/api/auth/2fa/methods` | GET | List enabled 2FA methods |

## Troubleshooting

### Common Issues

#### 1. TOTP Codes Not Working

**Symptoms**: Authenticator app codes are rejected
**Causes**: 
- Time synchronization issues
- Wrong secret key entered
- Clock drift between server and client

**Solutions**:
```bash
# Check server time
date
timedatectl status

# Sync time if needed
sudo ntpdate -s time.nist.gov

# Allow wider time window in verification
# Increase window parameter in authenticator.verify()
```

#### 2. SMS Codes Not Received

**Symptoms**: SMS verification codes don't arrive
**Causes**:
- Carrier blocking
- Invalid phone number format
- SMS service provider issues

**Solutions**:
```typescript
// Validate phone number format
const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Check SMS service status
const checkSMSServiceHealth = async () => {
  // Implementation depends on SMS provider
};
```

#### 3. Email Codes Delayed

**Symptoms**: Email verification codes arrive late
**Causes**:
- Email service delays
- Spam filtering
- Email queue backlog

**Solutions**:
```typescript
// Monitor email queue
const checkEmailQueue = async () => {
  const queueStatus = await emailService.getQueueStatus();
  if (queueStatus.pending > 100) {
    // Alert administrators
    await alertService.notify('High email queue volume');
  }
};
```

### Debug Commands

```bash
# Check 2FA attempts for user
node scripts/check-2fa-attempts.js --userId="user_id"

# Reset 2FA for user (emergency)
node scripts/reset-2fa.js --userId="user_id"

# Test TOTP generation
node scripts/test-totp.js --secret="user_secret"

# Verify backup codes
node scripts/verify-backup-codes.js --userId="user_id"
```

### Monitoring & Alerts

```typescript
// Monitor 2FA metrics
export const monitor2FAMetrics = async () => {
  const metrics = {
    totalAttempts: await getTotalAttempts(),
    successfulAttempts: await getSuccessfulAttempts(),
    failedAttempts: await getFailedAttempts(),
    rateLimitedAttempts: await getRateLimitedAttempts(),
    backupCodeUsage: await getBackupCodeUsage(),
  };
  
  // Alert on high failure rate
  const failureRate = metrics.failedAttempts / metrics.totalAttempts;
  if (failureRate > 0.3) { // 30% failure rate
    await alertService.notify('High 2FA failure rate detected');
  }
  
  return metrics;
};
```

---

*For additional 2FA configuration and advanced security features, refer to the main authentication documentation.*
