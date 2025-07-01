
// Direct AWS Integration Test
// This script tests AWS connectivity without requiring authentication

require('dotenv').config();

async function testAWSIntegration() {
  console.log('\n🔧 SafePlay AWS Integration Test');
  console.log('================================\n');

  // Import AWS functions
  const { getAWSConfigStatus, validateAWSConfig, isDevelopmentMode } = require('./lib/aws/config.ts');

  try {
    // Test 1: Development Mode Status
    console.log('1. Development Mode Status:');
    const devMode = isDevelopmentMode();
    console.log(`   Development Mode: ${devMode}`);
    console.log(`   AWS_DEVELOPMENT_MODE: ${process.env.AWS_DEVELOPMENT_MODE}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}\n`);

    // Test 2: AWS Configuration Status
    console.log('2. AWS Configuration Status:');
    const configStatus = getAWSConfigStatus();
    console.log(`   Region: ${configStatus.region}`);
    console.log(`   Access Key Configured: ${configStatus.accessKeyConfigured}`);
    console.log(`   Secret Key Configured: ${configStatus.secretKeyConfigured}`);
    console.log(`   S3 Bucket Configured: ${configStatus.s3BucketConfigured}`);
    console.log(`   AWS Available: ${configStatus.isAvailable}\n`);

    // Test 3: Validation Results
    console.log('3. Validation Results:');
    const validation = validateAWSConfig();
    console.log(`   Valid: ${validation.valid}`);
    
    if (validation.errors.length > 0) {
      console.log('   Errors:');
      validation.errors.forEach(error => console.log(`     - ${error}`));
    }
    
    if (validation.warnings && validation.warnings.length > 0) {
      console.log('   Warnings:');
      validation.warnings.forEach(warning => console.log(`     - ${warning}`));
    }

    // Test 4: Environment Variables Check
    console.log('\n4. Environment Variables:');
    console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8)}...` : 'NOT SET'}`);
    console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
    console.log(`   AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'NOT SET'}`);

    // Test 5: Real AWS Service Test
    console.log('\n5. AWS Service Connectivity Test:');
    
    if (configStatus.isAvailable) {
      console.log('   Testing AWS Rekognition connectivity...');
      
      try {
        const { RekognitionClient, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');
        
        const rekognitionClient = new RekognitionClient({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });

        // Test with a simple ListCollections command
        const command = new ListCollectionsCommand({});
        const response = await rekognitionClient.send(command);
        
        console.log(`   ✅ Rekognition connection successful!`);
        console.log(`   Collections found: ${response.CollectionIds ? response.CollectionIds.length : 0}`);
        
      } catch (error) {
        console.log(`   ❌ Rekognition connection failed: ${error.message}`);
      }

      console.log('\n   Testing AWS S3 connectivity...');
      
      try {
        const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
        
        const s3Client = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });

        // Test with a simple ListBuckets command
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        
        console.log(`   ✅ S3 connection successful!`);
        console.log(`   Accessible buckets: ${response.Buckets ? response.Buckets.length : 0}`);
        
        // Check if our specific bucket exists
        const bucketExists = response.Buckets?.some(bucket => bucket.Name === process.env.AWS_S3_BUCKET);
        console.log(`   Target bucket '${process.env.AWS_S3_BUCKET}' ${bucketExists ? 'exists' : 'not found'}`);
        
      } catch (error) {
        console.log(`   ❌ S3 connection failed: ${error.message}`);
      }
    } else {
      console.log('   ⚠️  AWS not available - configuration issues detected');
    }

    console.log('\n🎯 AWS Integration Test Complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAWSIntegration();
