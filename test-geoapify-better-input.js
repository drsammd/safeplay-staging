// Test with better address inputs
const fetch = require('node-fetch');

async function testBetterInputs() {
  console.log('🔍 Testing Geoapify API with better inputs...');
  
  const apiKey = process.env.GEOAPIFY_API_KEY || 'd1052c38439e4091af3f56fb65ddd35a';
  
  const testInputs = [
    '1838 Main',
    '1838 Oak',
    '123 Main St',
    '1600 Pennsylvania',
    '123 Oak Ave'
  ];
  
  for (const input of testInputs) {
    console.log(`\n=== Testing Autocomplete for: "${input}" ===`);
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&filter=countrycode:us,ca&apiKey=${apiKey}&limit=10&format=json`;
      
      const response = await fetch(url);
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📍 Number of results:', data.results?.length || 0);
        
        if (data.results && data.results.length > 0) {
          console.log('✅ Found suggestions:');
          data.results.slice(0, 3).forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.formatted}`);
          });
        } else {
          console.log('⚠️ No suggestions found');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }
}

testBetterInputs().catch(console.error);
