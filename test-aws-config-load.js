
// Test AWS configuration loading
const { getAWSConfigStatus } = require('./lib/aws/config.ts');

console.log('🔧 Testing AWS Configuration Loading...\n');

try {
  const status = getAWSConfigStatus();
  console.log('AWS Configuration Status:');
  console.log('- Available:', status.isAvailable);
  console.log('- Access Key Configured:', status.accessKeyConfigured);
  console.log('- Secret Key Configured:', status.secretKeyConfigured);
  console.log('- Development Mode:', status.developmentMode);
  console.log('- Region:', status.region);
  
  if (status.validationErrors.length > 0) {
    console.log('\nValidation Errors:');
    status.validationErrors.forEach(error => console.log('- ' + error));
  }
  
  if (status.validationWarnings.length > 0) {
    console.log('\nValidation Warnings:');
    status.validationWarnings.forEach(warning => console.log('- ' + warning));
  }
  
  console.log('\n✅ AWS Configuration Test Complete');
} catch (error) {
  console.error('❌ Error testing AWS configuration:', error.message);
}
