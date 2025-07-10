
const fetch = require('node-fetch');

// Test Geoapify API with corrected parameters
async function testGeoapifyFixed() {
  console.log('🔍 Testing Geoapify API with CORRECTED parameters...\n');
  
  const apiKey = process.env.GEOAPIFY_API_KEY || 'd1052c38439e4091af3f56fb65ddd35a';
  console.log(`🔑 Using API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  const testAddresses = [
    '1000 Market St',
    '123 Main Street',
    '456 Oak Avenue, Los Angeles',
    'Times Square, New York',
    'Golden Gate Bridge'
  ];
  
  for (const address of testAddresses) {
    console.log(`\n📍 Testing: "${address}"`);
    
    try {
      // FIXED: Remove invalid type=address parameter
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&filter=countrycode:us,ca&apiKey=${apiKey}&limit=10&bias=proximity:-74.0060,40.7128&format=json`;
      
      console.log(`🌐 Fixed Request URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
      
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
        data.features.slice(0, 5).forEach((feature, index) => {
          console.log(`  ${index + 1}. ${feature.properties?.formatted || 'No formatted address'}`);
          console.log(`     Name: ${feature.properties?.name || 'No name'}`);
          console.log(`     Place ID: ${feature.properties?.place_id || 'No place ID'}`);
        });
      } else {
        console.log(`❌ No 'features' field in response`);
        console.log(`📄 Full response: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing "${address}": ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

// Test with different valid type parameters
async function testDifferentTypes() {
  console.log('\n\n🔍 Testing different type parameters...\n');
  
  const apiKey = process.env.GEOAPIFY_API_KEY || 'd1052c38439e4091af3f56fb65ddd35a';
  const address = '123 Main Street';
  const validTypes = ['street', 'locality', undefined]; // undefined means no type parameter
  
  for (const type of validTypes) {
    console.log(`\n📍 Testing "${address}" with type: ${type || 'none'}`);
    
    try {
      let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&filter=countrycode:us,ca&apiKey=${apiKey}&limit=5`;
      
      if (type) {
        url += `&type=${type}`;
      }
      
      const response = await fetch(url);
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Features found: ${data.features?.length || 0}`);
        
        if (data.features && data.features.length > 0) {
          console.log(`  Best match: ${data.features[0].properties?.formatted}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function main() {
  console.log('🚀 Starting FIXED Geoapify debugging...\n');
  
  // Load environment variables
  require('dotenv').config();
  
  await testGeoapifyFixed();
  await testDifferentTypes();
  
  console.log('\n✅ Fixed debugging complete!');
}

main().catch(console.error);
