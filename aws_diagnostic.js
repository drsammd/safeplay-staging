const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse .env file manually to avoid dotenv dependency
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key] = value;
    process.env[key] = value;
  }
});

console.log('=== AWS Credentials Diagnostic ===\n');

// Check if AWS credentials are loaded
console.log('1. Environment Variables Check:');
console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'SET (length: ' + process.env.AWS_ACCESS_KEY_ID.length + ')' : 'NOT SET'}`);
console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET (length: ' + process.env.AWS_SECRET_ACCESS_KEY.length + ')' : 'NOT SET'}`);
console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
console.log(`   AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'NOT SET'}\n`);

// Test AWS SDK availability and credentials
async function testAWSCredentials() {
  try {
    console.log('2. Installing AWS SDK...');
    const { execSync } = require('child_process');
    execSync('npm install @aws-sdk/client-sts @aws-sdk/client-rekognition --silent', { stdio: 'pipe' });
    
    console.log('3. Testing AWS STS (Security Token Service)...');
    const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
    
    const stsClient = new STSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const stsCommand = new GetCallerIdentityCommand({});
    const stsResponse = await stsClient.send(stsCommand);
    
    console.log('   ✅ STS Success!');
    console.log(`   Account: ${stsResponse.Account}`);
    console.log(`   User ARN: ${stsResponse.Arn}`);
    console.log(`   User ID: ${stsResponse.UserId}\n`);
    
    console.log('4. Testing AWS Rekognition...');
    const { RekognitionClient, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');
    
    const rekognitionClient = new RekognitionClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const rekognitionCommand = new ListCollectionsCommand({});
    const rekognitionResponse = await rekognitionClient.send(rekognitionCommand);
    
    console.log('   ✅ Rekognition Success!');
    console.log(`   Collections found: ${rekognitionResponse.CollectionIds ? rekognitionResponse.CollectionIds.length : 0}`);
    if (rekognitionResponse.CollectionIds && rekognitionResponse.CollectionIds.length > 0) {
      console.log(`   Collection IDs: ${rekognitionResponse.CollectionIds.join(', ')}`);
    }
    console.log('\n5. Overall Status: ✅ ALL TESTS PASSED - AWS credentials are working correctly!');
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   Error Code: ${error.name}`);
    if (error.$metadata) {
      console.log(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
      console.log(`   Request ID: ${error.$metadata.requestId}`);
    }
    
    console.log('\n5. Diagnostic Analysis:');
    if (error.message.includes('InvalidUserID.NotFound') || error.message.includes('invalid security token')) {
      console.log('   🔍 ISSUE: Invalid or expired access key/secret key');
      console.log('   💡 SOLUTION: Check if the IAM user credentials are correct and active');
    } else if (error.message.includes('UnauthorizedOperation') || error.message.includes('AccessDenied')) {
      console.log('   🔍 ISSUE: Insufficient permissions');
      console.log('   💡 SOLUTION: Ensure the IAM user has the required Rekognition permissions');
    } else if (error.message.includes('InvalidParameterValue') && error.message.includes('region')) {
      console.log('   🔍 ISSUE: Invalid region');
      console.log('   💡 SOLUTION: Check if the AWS_REGION is correct');
    } else {
      console.log(`   🔍 ISSUE: Unexpected error - ${error.message}`);
    }
  }
}

testAWSCredentials();
