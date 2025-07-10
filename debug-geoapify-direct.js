
const fetch = require('node-fetch');

// Test Geoapify API directly
async function testGeoapifyDirectly() {
  console.log('🔍 Testing Geoapify API directly...\n');
  
  const apiKey = process.env.GEOAPIFY_API_KEY || 'd1052c38439e4091af3f56fb65ddd35a';
  console.log(`🔑 Using API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  const testAddresses = [
    '1000 Market St',
    '123 Main Street',
    'Times Square, New York',
    'Golden Gate Bridge',
    'Central Park'
  ];
  
  for (const address of testAddresses) {
    console.log(`\n📍 Testing: "${address}"`);
    
    try {
      // Test the exact same format our service uses
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&filter=countrycode:us,ca&apiKey=${apiKey}&limit=10&type=address&bias=proximity:-74.0060,40.7128&format=json`;
      
      console.log(`🌐 Request URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(url);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Error Response: ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`📦 Response keys: ${Object.keys(data)}`);
      
      if (data.features) {
        console.log(`✅ Found ${data.features.length} features`);
        data.features.slice(0, 3).forEach((feature, index) => {
          console.log(`  ${index + 1}. ${feature.properties?.formatted || 'No formatted address'}`);
          console.log(`     Place ID: ${feature.properties?.place_id || 'No place ID'}`);
        });
      } else {
        console.log(`❌ No 'features' field in response`);
        console.log(`📄 Full response: ${JSON.stringify(data, null, 2)}`);
      }
      
      // Test with different parameters
      console.log(`\n🔄 Testing simplified request...`);
      const simpleUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;
      const simpleResponse = await fetch(simpleUrl);
      
      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        console.log(`📦 Simple request features: ${simpleData.features?.length || 0}`);
      } else {
        console.log(`❌ Simple request failed: ${simpleResponse.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing "${address}": ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Test our service endpoints
async function testOurServiceEndpoints() {
  console.log('\n\n🔍 Testing our service endpoints...\n');
  
  const testAddress = '1000 Market St, San Francisco';
  
  try {
    console.log(`📍 Testing our autocomplete API with: "${testAddress}"`);
    
    const response = await fetch('http://localhost:3000/api/verification/address/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: testAddress,
        countryRestriction: ['us', 'ca']
      })
    });
    
    console.log(`📊 Our API Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📦 Our API Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ Our API Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Error testing our API: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Geoapify debugging...\n');
  
  // Load environment variables
  require('dotenv').config();
  
  await testGeoapifyDirectly();
  await testOurServiceEndpoints();
  
  console.log('\n✅ Debugging complete!');
}

main().catch(console.error);
