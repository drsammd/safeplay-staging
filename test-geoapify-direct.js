// Simple test script to debug Geoapify API directly
const fetch = require('node-fetch');

async function testGeoapifyDirect() {
  console.log('🔍 Testing Geoapify API directly...');
  
  const apiKey = process.env.GEOAPIFY_API_KEY || 'd1052c38439e4091af3f56fb65ddd35a';
  console.log('🔑 API Key:', apiKey ? 'Present' : 'Missing');
  
  // Test autocomplete endpoint
  console.log('\n=== Testing Autocomplete Endpoint ===');
  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=1838&filter=countrycode:us,ca&apiKey=${apiKey}&limit=10&format=json`;
    console.log('📞 Calling URL:', url);
    
    const response = await fetch(url);
    console.log('📊 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Raw API response:', JSON.stringify(data, null, 2));
      
      if (data.results && data.results.length > 0) {
        console.log('📍 Number of results:', data.results.length);
        console.log('🎯 First result:', data.results[0]);
      } else {
        console.log('⚠️ No results found in API response');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
  
  // Test validation endpoint
  console.log('\n=== Testing Search/Validation Endpoint ===');
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=1838&filter=countrycode:us,ca&apiKey=${apiKey}&limit=1`;
    console.log('📞 Calling URL:', url);
    
    const response = await fetch(url);
    console.log('📊 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Raw API response:', JSON.stringify(data, null, 2));
      
      if (data.features && data.features.length > 0) {
        console.log('📍 Number of features:', data.features.length);
        console.log('🎯 First feature:', data.features[0]);
      } else {
        console.log('⚠️ No features found in API response');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testGeoapifyDirect().catch(console.error);
