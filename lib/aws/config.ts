
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import fs from 'fs';
import path from 'path';

// Function to load credentials from .env file explicitly
function loadCredentialsFromEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          envVars[key] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.warn('Could not load .env file, falling back to process.env');
    return {};
  }
}

// Load credentials from .env file to override system environment
const envFileCredentials = loadCredentialsFromEnv();

// AWS Configuration - prioritize .env file over system environment
const region = envFileCredentials.AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const accessKeyId = envFileCredentials.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = envFileCredentials.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';

// Log which credentials are being used (for debugging)
console.log('AWS Config: Using credentials from', 
  envFileCredentials.AWS_ACCESS_KEY_ID ? '.env file' : 'system environment',
  `(${accessKeyId.substring(0, 8)}...)`
);

// Initialize AWS clients
export const rekognitionClient = new RekognitionClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const sesClient = new SESClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Configuration constants
export const AWS_CONFIG = {
  region,
  s3Bucket: process.env.AWS_S3_BUCKET || 'safeplay-faces',
  rekognitionCollectionPrefix: 'safeplay-child-',
  maxFacesPerCollection: 20,
  faceMatchThreshold: 80, // Minimum confidence for face matching
  faceDetectionThreshold: 90, // Minimum confidence for face detection
  supportedImageFormats: ['jpg', 'jpeg', 'png'],
  maxImageSize: 15 * 1024 * 1024, // 15MB
  maxImageDimension: 4096, // Max width or height
  
  // Email (SES) Configuration
  sesFromEmail: process.env.SES_FROM_EMAIL || 'noreply@safeplay.app',
  sesFromName: process.env.SES_FROM_NAME || 'SafePlay',
  sesReplyToEmail: process.env.SES_REPLY_TO_EMAIL || 'support@safeplay.app',
  sesConfigurationSet: process.env.SES_CONFIGURATION_SET,
  emailDomain: process.env.EMAIL_DOMAIN || 'safeplay.app',
  unsubscribeBaseUrl: process.env.NEXTAUTH_URL || 'https://localhost:3000',
  trackingDomain: process.env.EMAIL_TRACKING_DOMAIN || process.env.NEXTAUTH_URL || 'https://localhost:3000',
  maxEmailsPerSecond: parseInt(process.env.SES_MAX_SEND_RATE || '14'), // AWS SES default
  maxEmailsPerDay: parseInt(process.env.SES_MAX_SEND_QUOTA || '200'), // AWS SES sandbox limit
};

// Check if we're in development mode
export function isDevelopmentMode(): boolean {
  const devMode = envFileCredentials.AWS_DEVELOPMENT_MODE || process.env.AWS_DEVELOPMENT_MODE;
  const nodeEnv = process.env.NODE_ENV;
  return devMode === 'true' || nodeEnv === 'development';
}

// Validate AWS configuration
export function validateAWSConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Use credentials from .env file or system environment
  const currentAccessKey = accessKeyId;
  const currentSecretKey = secretAccessKey;
  const currentRegion = region;
  const currentBucket = envFileCredentials.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET;
  
  // In development mode, be more lenient
  if (isDevelopmentMode()) {
    warnings.push('Running in AWS development mode - facial recognition features may have limited functionality');
    
    // Check if credentials look like examples
    if (currentAccessKey === 'AKIAIOSFODNN7EXAMPLE' || 
        currentSecretKey === 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY') {
      warnings.push('Using example AWS credentials - replace with real credentials for full functionality');
    }
    
    // In development mode, we can proceed even with placeholder credentials
    return {
      valid: true,
      errors,
      warnings,
    };
  }
  
  // Production validation is stricter
  if (!currentAccessKey || 
      currentAccessKey === 'your-aws-access-key-id' ||
      currentAccessKey === 'AKIAIOSFODNN7EXAMPLE') {
    errors.push('AWS_ACCESS_KEY_ID is required and must be configured with real credentials');
  }
  
  if (!currentSecretKey || 
      currentSecretKey === 'your-aws-secret-access-key' ||
      currentSecretKey === 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY') {
    errors.push('AWS_SECRET_ACCESS_KEY is required and must be configured with real credentials');
  }
  
  if (!currentBucket) {
    errors.push('AWS_S3_BUCKET is required');
  }
  
  if (!currentRegion) {
    errors.push('AWS_REGION is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Check if AWS is available for use
export function isAWSAvailable(): boolean {
  const validation = validateAWSConfig();
  return validation.valid;
}

// Get AWS configuration status for debugging
export function getAWSConfigStatus() {
  const validation = validateAWSConfig();
  const currentBucket = envFileCredentials.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET;
  
  return {
    region: region || 'not set',
    developmentMode: isDevelopmentMode(),
    accessKeyConfigured: !!(accessKeyId && 
      accessKeyId !== 'your-aws-access-key-id' &&
      accessKeyId !== 'AKIAIOSFODNN7EXAMPLE'),
    secretKeyConfigured: !!(secretAccessKey && 
      secretAccessKey !== 'your-aws-secret-access-key' &&
      secretAccessKey !== 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'),
    s3BucketConfigured: !!currentBucket,
    isAvailable: isAWSAvailable(),
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
  };
}
