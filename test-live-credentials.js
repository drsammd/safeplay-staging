
#!/usr/bin/env node

// Test script to verify demo credentials work on live deployment
const https = require('https');

const LIVE_URL = 'https://mysafeplay.ai';
const TEST_CREDENTIALS = [
  { email: 'admin@mysafeplay.ai', password: 'password123', role: 'Company Admin' },
  { email: 'venue@mysafeplay.ai', password: 'password123', role: 'Venue Admin' },
  { email: 'parent@mysafeplay.ai', password: 'password123', role: 'Parent' },
  { email: 'john@mysafeplay.ai', password: 'johndoe123', role: 'Demo Parent' }
];

async function testCredentials() {
  console.log('🧪 Testing Demo Credentials on Live Deployment');
  console.log('=' .repeat(60));
  console.log(`Target: ${LIVE_URL}`);
  console.log('');

  for (const cred of TEST_CREDENTIALS) {
    try {
      console.log(`Testing ${cred.role}: ${cred.email}`);
      
      // Test if the seeding API is available
      const seedingResponse = await fetch(`${LIVE_URL}/api/admin/deployment-seed?token=SafePlay-Deploy-2024`);
      
      if (seedingResponse.status === 200) {
        const seedingData = await seedingResponse.json();
        console.log(`✅ Seeding API available, success: ${seedingData.success}`);
        
        if (seedingData.credentials) {
          console.log('📋 Available credentials from API:');
          Object.entries(seedingData.credentials).forEach(([role, creds]) => {
            console.log(`   ${role}: ${creds}`);
          });
        }
        break; // Only need to test seeding API once
      } else {
        console.log(`⚠️  Seeding API returned status: ${seedingResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${cred.email}: ${error.message}`);
    }
  }
}

// Run test
testCredentials().catch(console.error);
