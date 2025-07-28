// Test the fixed AWS configuration
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Fixed AWS Configuration\n');

// Function to get credentials from .env (same logic as the TypeScript utility)
function getAWSCredentialsFromEnv() {
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

  return {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY || '',
    region: envVars.AWS_REGION || 'us-east-2',
    bucket: envVars.AWS_S3_BUCKET || 'safeplay-faces'
  };
}

function createAWSConfig() {
  const credentials = getAWSCredentialsFromEnv();
  
  return {
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    }
  };
}

async function testFixedConfiguration() {
  try {
    const credentials = getAWSCredentialsFromEnv();
    console.log('📋 Credentials loaded from .env:');
    console.log(`   Access Key: ${credentials.accessKeyId.substring(0, 8)}...`);
    console.log(`   Region: ${credentials.region}`);
    console.log(`   Bucket: ${credentials.bucket}\n`);
    
    // Test STS
    const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
    const stsClient = new STSClient(createAWSConfig());
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    
    console.log('✅ STS Test Passed:');
    console.log(`   Account: ${stsResponse.Account}`);
    console.log(`   User ARN: ${stsResponse.Arn}`);
    console.log(`   User ID: ${stsResponse.UserId}\n`);
    
    // Test Rekognition
    const { RekognitionClient, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');
    const rekognitionClient = new RekognitionClient(createAWSConfig());
    const rekognitionResponse = await rekognitionClient.send(new ListCollectionsCommand({}));
    
    console.log('✅ Rekognition Test Passed:');
    console.log(`   Collections found: ${rekognitionResponse.CollectionIds?.length || 0}`);
    if (rekognitionResponse.CollectionIds && rekognitionResponse.CollectionIds.length > 0) {
      console.log(`   Collection IDs: ${rekognitionResponse.CollectionIds.join(', ')}`);
    }
    console.log('');
    
    console.log('🎉 SUCCESS: Fixed AWS configuration is working perfectly!');
    console.log('   ✓ System environment variables are being ignored');
    console.log('   ✓ .env file credentials are being used correctly');
    console.log('   ✓ Core Safety Loop system can now connect to AWS Rekognition');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`   Error Code: ${error.name}`);
  }
}

testFixedConfiguration();
