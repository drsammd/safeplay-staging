// Clear conflicting AWS environment variables and use .env credentials explicitly
delete process.env.AWS_ACCESS_KEY_ID;
delete process.env.AWS_SECRET_ACCESS_KEY;
delete process.env.AWS_SESSION_TOKEN;

// Load .env file
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

console.log('=== Fixed AWS Credentials Test ===\n');
console.log('Using credentials from .env file:');
console.log(`AWS_ACCESS_KEY_ID: ${envVars.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);
console.log(`AWS_SECRET_ACCESS_KEY: ${envVars.AWS_SECRET_ACCESS_KEY?.substring(0, 8)}...`);
console.log(`AWS_REGION: ${envVars.AWS_REGION}`);
console.log(`AWS_S3_BUCKET: ${envVars.AWS_S3_BUCKET}\n`);

async function testSamCredentials() {
  try {
    const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
    
    const stsClient = new STSClient({
      region: envVars.AWS_REGION,
      credentials: {
        accessKeyId: envVars.AWS_ACCESS_KEY_ID,
        secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log('Testing STS with Sam\'s credentials...');
    const stsCommand = new GetCallerIdentityCommand({});
    const stsResponse = await stsClient.send(stsCommand);
    
    console.log('✅ STS Success!');
    console.log(`Account: ${stsResponse.Account}`);
    console.log(`User ARN: ${stsResponse.Arn}`);
    console.log(`User ID: ${stsResponse.UserId}\n`);
    
    console.log('Testing Rekognition with Sam\'s credentials...');
    const { RekognitionClient, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');
    
    const rekognitionClient = new RekognitionClient({
      region: envVars.AWS_REGION,
      credentials: {
        accessKeyId: envVars.AWS_ACCESS_KEY_ID,
        secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const rekognitionCommand = new ListCollectionsCommand({});
    const rekognitionResponse = await rekognitionClient.send(rekognitionCommand);
    
    console.log('✅ Rekognition Success!');
    console.log(`Collections found: ${rekognitionResponse.CollectionIds?.length || 0}`);
    if (rekognitionResponse.CollectionIds && rekognitionResponse.CollectionIds.length > 0) {
      console.log(`Collection IDs: ${rekognitionResponse.CollectionIds.join(', ')}`);
    }
    
    console.log('\n🎉 SUCCESS: Sam\'s AWS credentials are working perfectly!');
    console.log('The issue was that system AWS environment variables were overriding the .env file.');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`Error Code: ${error.name}`);
  }
}

testSamCredentials();
