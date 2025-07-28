const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing AWS credential conflicts in Core Safety Loop system...\n');

// Read the current .env file to get Sam's credentials
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

// Create a utility file for AWS configuration that explicitly uses .env credentials
const awsConfigUtility = `// AWS Configuration Utility - Forces use of .env credentials
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

  envContent.split('\\n').forEach(line => {
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
`;

// Write the AWS config utility
fs.writeFileSync('lib/utils/aws-config.ts', awsConfigUtility);
console.log('✅ Created lib/utils/aws-config.ts');

// Update the real-time face recognition service to use the new config
const realTimeFaceService = fs.readFileSync('lib/services/real-time-face-recognition-service.ts', 'utf8');
const updatedRealTimeFaceService = realTimeFaceService.replace(
  /import.*RekognitionClient.*from.*@aws-sdk\/client-rekognition.*/,
  `import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { createAWSConfig } from '../utils/aws-config';`
).replace(
  /new RekognitionClient\(\{[^}]*\}\)/g,
  'new RekognitionClient(createAWSConfig())'
);

if (updatedRealTimeFaceService !== realTimeFaceService) {
  fs.writeFileSync('lib/services/real-time-face-recognition-service.ts', updatedRealTimeFaceService);
  console.log('✅ Updated real-time-face-recognition-service.ts');
}

// Update the core safety loop integration service
const coreIntegrationService = fs.readFileSync('lib/services/core-safety-loop-integration-service.ts', 'utf8');
const updatedCoreIntegrationService = coreIntegrationService.replace(
  /import.*RekognitionClient.*from.*@aws-sdk\/client-rekognition.*/,
  `import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { createAWSConfig } from '../utils/aws-config';`
).replace(
  /new RekognitionClient\(\{[^}]*\}\)/g,
  'new RekognitionClient(createAWSConfig())'
);

if (updatedCoreIntegrationService !== coreIntegrationService) {
  fs.writeFileSync('lib/services/core-safety-loop-integration-service.ts', updatedCoreIntegrationService);
  console.log('✅ Updated core-safety-loop-integration-service.ts');
}

// Create a test script that uses the fixed configuration
const testScript = `// Test script using fixed AWS configuration
import { createAWSConfig, getAWSCredentialsFromEnv } from '../lib/utils/aws-config';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { RekognitionClient, ListCollectionsCommand } from '@aws-sdk/client-rekognition';

async function testFixedAWSConfig() {
  console.log('🧪 Testing fixed AWS configuration...\\n');
  
  const credentials = getAWSCredentialsFromEnv();
  console.log('Credentials loaded from .env:');
  console.log(\`Access Key: \${credentials.accessKeyId.substring(0, 8)}...\`);
  console.log(\`Region: \${credentials.region}\`);
  console.log(\`Bucket: \${credentials.bucket}\\n\`);
  
  try {
    // Test STS
    const stsClient = new STSClient(createAWSConfig());
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    
    console.log('✅ STS Test Passed:');
    console.log(\`Account: \${stsResponse.Account}\`);
    console.log(\`User ARN: \${stsResponse.Arn}\\n\`);
    
    // Test Rekognition
    const rekognitionClient = new RekognitionClient(createAWSConfig());
    const rekognitionResponse = await rekognitionClient.send(new ListCollectionsCommand({}));
    
    console.log('✅ Rekognition Test Passed:');
    console.log(\`Collections: \${rekognitionResponse.CollectionIds?.length || 0}\\n\`);
    
    console.log('🎉 All tests passed! AWS credentials are working correctly.');
    
  } catch (error: any) {
    console.log(\`❌ Error: \${error.message}\`);
  }
}

testFixedAWSConfig();
`;

fs.writeFileSync('test-fixed-aws.ts', testScript);
console.log('✅ Created test-fixed-aws.ts');

console.log('\n🎯 AWS credential fix completed!');
console.log('\nWhat was fixed:');
console.log('1. Created lib/utils/aws-config.ts to force use of .env credentials');
console.log('2. Updated services to use the new AWS configuration');
console.log('3. Created test script to verify the fix');
console.log('\nThe system will now ignore conflicting environment variables and use Sam\'s credentials from .env');
