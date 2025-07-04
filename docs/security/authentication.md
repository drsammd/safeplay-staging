
# Authentication & Identity Verification

## Overview

mySafePlay™(TM) implements a comprehensive authentication and identity verification system designed to ensure maximum security for child safety applications. The system includes multiple verification levels, enhanced 2FA options, and AI-powered document verification.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Identity Verification Levels](#identity-verification-levels)
3. [Two-Factor Authentication](#two-factor-authentication)
4. [Document Verification](#document-verification)
5. [API Endpoints](#api-endpoints)
6. [Implementation Examples](#implementation-examples)
7. [Troubleshooting](#troubleshooting)

## Authentication Flow

### Basic Authentication

```typescript
// User registration with enhanced verification
const registerUser = async (userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  return response.json();
};
```

### Authentication States

| State | Description | Access Level |
|-------|-------------|--------------|
| `UNVERIFIED` | Basic account creation | Limited access |
| `EMAIL_VERIFIED` | Email confirmed | Basic features |
| `PHONE_VERIFIED` | Phone number verified | Enhanced features |
| `IDENTITY_VERIFIED` | Document verification complete | Full access |
| `FULLY_VERIFIED` | Identity + 2FA enabled | Maximum security |

## Identity Verification Levels

### Verification Process

1. **Email Verification**
   - Automatic email sent on registration
   - Required for basic account access
   - Expires in 24 hours

2. **Phone Verification**
   - SMS-based verification code
   - Required for enhanced features
   - Supports international numbers

3. **Identity Document Verification**
   - AI-powered document analysis using AWS Rekognition
   - Supports driver's licenses, passports, state IDs
   - Real-time verification with confidence scoring

4. **Biometric Verification** (Optional)
   - Face matching against identity documents
   - Enhanced security for high-risk operations

### Verification Badge System

```typescript
// Verification badge component usage
<VerificationBadge 
  user={user}
  showDetails={true}
  onUpgrade={() => handleVerificationUpgrade()}
/>
```

## Two-Factor Authentication

### Supported 2FA Methods

#### 1. SMS-Based 2FA
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
```

#### 2. Email-Based 2FA
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
```

#### 3. Authenticator Apps
```typescript
// Generate TOTP secret for authenticator apps
const setupTOTP = async () => {
  const response = await fetch('/api/auth/2fa/totp/setup', {
    method: 'POST'
  });
  
  const { secret, qrCode } = await response.json();
  return { secret, qrCode };
};
```

### 2FA Verification Flow

```typescript
// Verify 2FA code
const verify2FA = async (code: string, method: '2fa_sms' | '2fa_email' | '2fa_totp') => {
  const response = await fetch('/api/auth/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, method })
  });
  
  return response.json();
};
```

## Document Verification

### AI-Powered Verification Process

The system uses AWS Rekognition for intelligent document analysis:

1. **Document Upload**
   - Supports multiple image formats (JPEG, PNG, PDF)
   - Automatic image quality validation
   - Secure temporary storage

2. **AI Analysis**
   - Text extraction from documents
   - Document type identification
   - Fraud detection algorithms
   - Confidence scoring (0-100%)

3. **Verification Results**
   - Automatic approval for high-confidence matches
   - Manual review queue for uncertain cases
   - Detailed verification reports

### Document Types Supported

| Document Type | Supported | AI Confidence Required |
|---------------|-----------|----------------------|
| Driver's License |  | 85% |
| Passport |  | 90% |
| State ID |  | 85% |
| Military ID |  | 80% |
| Birth Certificate | * | Manual Review |

### Implementation Example

```typescript
// Document upload and verification
const uploadDocument = async (file: File, documentType: string) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', documentType);
  
  const response = await fetch('/api/verification/document/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// Check verification status
const checkVerificationStatus = async (verificationId: string) => {
  const response = await fetch(`/api/verification/status/${verificationId}`);
  return response.json();
};
```

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/verify-email` | POST | Email verification |
| `/api/auth/verify-phone` | POST | Phone verification |

### 2FA Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/2fa/sms/enable` | POST | Enable SMS 2FA |
| `/api/auth/2fa/email/enable` | POST | Enable Email 2FA |
| `/api/auth/2fa/totp/setup` | POST | Setup TOTP 2FA |
| `/api/auth/2fa/verify` | POST | Verify 2FA code |
| `/api/auth/2fa/disable` | POST | Disable 2FA |

### Verification Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verification/document/upload` | POST | Upload identity document |
| `/api/verification/status/{id}` | GET | Check verification status |
| `/api/verification/retry/{id}` | POST | Retry failed verification |
| `/api/admin/verification/pending` | GET | Admin: Pending verifications |
| `/api/admin/verification/approve/{id}` | POST | Admin: Approve verification |

## Implementation Examples

### Complete Authentication Setup

```typescript
// Enhanced authentication hook
export const useEnhancedAuth = () => {
  const [user, setUser] = useState(null);
  const [verificationLevel, setVerificationLevel] = useState('UNVERIFIED');
  
  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode })
      });
      
      const data = await response.json();
      
      if (data.requires2FA) {
        return { requires2FA: true, methods: data.availableMethods };
      }
      
      setUser(data.user);
      setVerificationLevel(data.user.verificationLevel);
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  };
  
  const upgradeVerification = async (type: 'phone' | 'identity' | '2fa') => {
    // Implementation for verification upgrades
  };
  
  return { user, verificationLevel, login, upgradeVerification };
};
```

### Verification Component

```tsx
// Verification status component
export const VerificationStatus: React.FC<{ user: User }> = ({ user }) => {
  const getVerificationSteps = () => {
    return [
      { 
        name: 'Email Verification', 
        completed: user.emailVerified,
        required: true 
      },
      { 
        name: 'Phone Verification', 
        completed: user.phoneVerified,
        required: true 
      },
      { 
        name: 'Identity Verification', 
        completed: user.identityVerified,
        required: true 
      },
      { 
        name: 'Two-Factor Authentication', 
        completed: user.twoFactorEnabled,
        required: false 
      }
    ];
  };
  
  return (
    <div className="verification-status">
      <h3>Account Verification</h3>
      {getVerificationSteps().map((step, index) => (
        <div key={index} className={`step ${step.completed ? 'completed' : 'pending'}`}>
          <span className="step-name">{step.name}</span>
          <span className="step-status">
            {step.completed ? '' : step.required ? '' : '*'}
          </span>
        </div>
      ))}
    </div>
  );
};
```

## Security Best Practices

### Password Requirements

- Minimum 8 characters
- Must include uppercase, lowercase, number, and special character
- Cannot contain common dictionary words
- Cannot reuse last 5 passwords

### Session Management

- JWT tokens with 24-hour expiration
- Refresh tokens with 30-day expiration
- Automatic logout on suspicious activity
- Device tracking and management

### Rate Limiting

| Action | Limit | Window |
|--------|-------|--------|
| Login attempts | 5 | 15 minutes |
| 2FA attempts | 3 | 5 minutes |
| Password reset | 3 | 1 hour |
| Document upload | 5 | 1 hour |

## Troubleshooting

### Common Issues

#### 1. Email Verification Not Received
```bash
# Check email logs
curl -X GET "/api/admin/email-logs?recipient=user@example.com&type=verification"
```

#### 2. 2FA Code Not Working
- Verify time synchronization on authenticator app
- Check if backup codes are being used
- Ensure SMS delivery is not blocked

#### 3. Document Verification Failed
- Check image quality and lighting
- Ensure document is fully visible
- Verify document type is supported
- Check AWS Rekognition service status

#### 4. Phone Verification Issues
- Verify phone number format (+1234567890)
- Check SMS delivery status
- Ensure carrier supports SMS delivery

### Debug Commands

```bash
# Check user verification status
node scripts/check-verification-status.js --email="user@example.com"

# Reset verification state
node scripts/reset-verification.js --userId="user_id" --level="EMAIL_VERIFIED"

# Test 2FA setup
node scripts/test-2fa.js --userId="user_id" --method="totp"
```

### Monitoring and Alerts

- Failed login attempt monitoring
- Unusual verification patterns
- 2FA bypass attempts
- Document verification fraud detection
- AWS service health monitoring

---

*For additional support, contact the technical team or use the AI support chat system.*
