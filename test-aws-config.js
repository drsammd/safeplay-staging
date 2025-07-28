
// Test AWS configuration and connection
const { RekognitionClient, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');

async function testAWSConfig() {
  console.log('=== AWS Configuration Test ===\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set (' + process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...)' : 'Not set');
  console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set (hidden)' : 'Not set');
  console.log('AWS_SESSION_TOKEN:', process.env.AWS_SESSION_TOKEN ? 'Set (session credentials)' : 'Not set');
  console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set');
  console.log('');

  // Test with environment credentials
  console.log('Testing AWS Rekognition connection...');
  
  const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN
    }
  });

  try {
    const command = new ListCollectionsCommand({});
    const response = await rekognitionClient.send(command);
    
    console.log('✅ AWS Rekognition connection successful!');
    console.log('Collections found:', response.CollectionIds?.length || 0);
    if (response.CollectionIds && response.CollectionIds.length > 0) {
      console.log('Existing collections:', response.CollectionIds);
    }
    console.log('');
    
    return { success: true, collections: response.CollectionIds || [] };
  } catch (error) {
    console.log('❌ AWS Rekognition connection failed:');
    console.log('Error:', error.message);
    console.log('Error code:', error.name);
    console.log('');
    
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  testAWSConfig().then(result => {
    console.log('Test completed:', result.success ? 'SUCCESS' : 'FAILED');
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = testAWSConfig;
