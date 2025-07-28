// Test if the application is properly loading Sam's AWS credentials from .env
require('dotenv').config();

console.log('=== Environment Credentials Test ===\n');

console.log('Current AWS Environment Variables:');
console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);

// Test with explicit credentials from .env
async function testWithEnvCredentials() {
  try {
    const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
    
    const stsClient = new STSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const command = new GetCallerIdentityCommand({});
    const response = await stsClient.send(command);
    
    console.log('\n✅ Successfully authenticated with .env credentials:');
    console.log(`Account: ${response.Account}`);
    console.log(`User ARN: ${response.Arn}`);
    console.log(`User ID: ${response.UserId}`);
    
    // Test Rekognition with explicit credentials
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
    
    console.log('\n✅ Rekognition test successful!');
    console.log(`Collections: ${rekognitionResponse.CollectionIds?.length || 0}`);
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  }
}

testWithEnvCredentials();
