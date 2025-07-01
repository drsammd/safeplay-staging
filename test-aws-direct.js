
// Direct AWS Test with Explicit Credentials
// This bypasses system environment variables and uses .env file directly

const fs = require('fs');
const path = require('path');

// Function to parse .env file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
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
}

async function testAWSWithExplicitCredentials() {
  console.log('\n🔧 SafePlay AWS Direct Credentials Test');
  console.log('=====================================\n');

  try {
    // Load .env file manually
    const envVars = loadEnvFile();
    
    console.log('1. Credentials from .env file:');
    console.log(`   AWS_ACCESS_KEY_ID: ${envVars.AWS_ACCESS_KEY_ID ? `${envVars.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${envVars.AWS_SECRET_ACCESS_KEY ? `${envVars.AWS_SECRET_ACCESS_KEY.substring(0, 8)}...` : 'NOT SET'}`);
    console.log(`   AWS_REGION: ${envVars.AWS_REGION || 'NOT SET'}`);
    console.log(`   AWS_S3_BUCKET: ${envVars.AWS_S3_BUCKET || 'NOT SET'}`);
    console.log(`   AWS_DEVELOPMENT_MODE: ${envVars.AWS_DEVELOPMENT_MODE || 'NOT SET'}\n`);

    console.log('2. System Environment (for comparison):');
    console.log(`   System AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET'}`);
    console.log(`   System AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8)}...` : 'NOT SET'}\n`);

    // Validate that we have the credentials from .env
    if (!envVars.AWS_ACCESS_KEY_ID || !envVars.AWS_SECRET_ACCESS_KEY) {
      console.log('❌ Missing credentials in .env file');
      return;
    }

    // Test AWS services with explicit credentials from .env file
    console.log('3. Testing AWS Rekognition with .env credentials...');
    
    try {
      const { RekognitionClient, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');
      
      const rekognitionClient = new RekognitionClient({
        region: envVars.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: envVars.AWS_ACCESS_KEY_ID,
          secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
        },
      });

      const command = new ListCollectionsCommand({});
      const response = await rekognitionClient.send(command);
      
      console.log(`   ✅ Rekognition connection successful!`);
      console.log(`   Collections found: ${response.CollectionIds ? response.CollectionIds.length : 0}`);
      
      if (response.CollectionIds && response.CollectionIds.length > 0) {
        console.log(`   Collection names: ${response.CollectionIds.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Rekognition connection failed: ${error.message}`);
      console.log(`   Error code: ${error.name}`);
    }

    console.log('\n4. Testing AWS S3 with .env credentials...');
    
    try {
      const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
      
      const s3Client = new S3Client({
        region: envVars.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: envVars.AWS_ACCESS_KEY_ID,
          secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
        },
      });

      // Test with ListBuckets
      const listCommand = new ListBucketsCommand({});
      const listResponse = await s3Client.send(listCommand);
      
      console.log(`   ✅ S3 connection successful!`);
      console.log(`   Accessible buckets: ${listResponse.Buckets ? listResponse.Buckets.length : 0}`);
      
      // Check if our specific bucket exists
      const bucketExists = listResponse.Buckets?.some(bucket => bucket.Name === envVars.AWS_S3_BUCKET);
      console.log(`   Target bucket '${envVars.AWS_S3_BUCKET}' ${bucketExists ? 'exists ✅' : 'not found ⚠️'}`);
      
      // If bucket doesn't exist in list, try to access it directly
      if (!bucketExists && envVars.AWS_S3_BUCKET) {
        try {
          const headCommand = new HeadBucketCommand({ Bucket: envVars.AWS_S3_BUCKET });
          await s3Client.send(headCommand);
          console.log(`   Direct bucket access: ✅ Bucket is accessible`);
        } catch (bucketError) {
          console.log(`   Direct bucket access: ❌ ${bucketError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ S3 connection failed: ${error.message}`);
      console.log(`   Error code: ${error.name}`);
    }

    console.log('\n5. Credential Type Analysis:');
    const accessKeyPrefix = envVars.AWS_ACCESS_KEY_ID.substring(0, 4);
    if (accessKeyPrefix === 'AKIA') {
      console.log('   ✅ Permanent IAM user credentials detected');
    } else if (accessKeyPrefix === 'ASIA') {
      console.log('   ⚠️  Temporary credentials detected');
    } else {
      console.log('   ❓ Unknown credential type');
    }

    console.log('\n🎯 Direct AWS Test Complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAWSWithExplicitCredentials();
