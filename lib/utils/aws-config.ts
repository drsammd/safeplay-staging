// AWS Configuration Utility - Forces use of .env credentials
// This prevents system environment variables from overriding .env file

import fs from 'fs';
import path from 'path';

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export function getAWSCredentialsFromEnv(): AWSCredentials {
  // Read .env file directly to avoid environment variable conflicts
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars: Record<string, string> = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });

  return {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY || '',
    region: envVars.AWS_REGION || 'us-east-2',
    bucket: envVars.AWS_S3_BUCKET || 'safeplay-faces'
  };
}

export function createAWSConfig() {
  const credentials = getAWSCredentialsFromEnv();
  
  return {
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    }
  };
}
