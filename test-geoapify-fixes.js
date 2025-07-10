
const fetch = require('node-fetch');

// Test the fixed Geoapify service
async function testGeoapifyFixes() {
  console.log('🚀 Testing FIXED Geoapify service...\n');
  
  const testAddresses = [
    '123 Main St',
    '1000 Market Street',
    '456 Oak Avenue',
    '789 Pine Street, Los Angeles',
    'Times Square, New York'
  ];
  
  for (const address of testAddresses) {
    console.log(`📍 Testing: "${address}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/verification/address/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: address,
          countryRestriction: ['us', 'ca']
        })
      });
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error details: ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      const suggestions = data.suggestions || [];
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`✅ Suggestions returned: ${suggestions.length}`);
      
      if (suggestions.length === 0) {
        console.log(`🚨 STILL NO SUGGESTIONS for "${address}"`);
      } else if (suggestions.length === 1) {
        console.log(`⚠️  Only 1 suggestion for "${address}"`);
      } else {
        console.log(`🎉 MULTIPLE SUGGESTIONS (${suggestions.length}) for "${address}"`);
      }
      
      // Display suggestions
      suggestions.slice(0, 3).forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion.main_text}`);
        console.log(`     ${suggestion.secondary_text}`);
        console.log(`     Place ID: ${suggestion.place_id.substring(0, 20)}...`);
      });
      
      if (suggestions.length > 3) {
        console.log(`     ... and ${suggestions.length - 3} more suggestions`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing "${address}": ${error.message}`);
    }
    
    console.log(''); // blank line
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Test address validation as well
async function testAddressValidation() {
  console.log('\n🔍 Testing address validation...\n');
  
  const testAddress = '123 Main Street, New York, NY';
  
  try {
    console.log(`📍 Validating: "${testAddress}"`);
    
    const response = await fetch('http://localhost:3000/api/verification/address/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: testAddress,
        countryRestriction: ['us', 'ca']
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const validation = data.validation;
      
      console.log(`✅ Validation successful`);
      console.log(`   Valid: ${validation.isValid}`);
      console.log(`   Confidence: ${Math.round(validation.confidence * 100)}%`);
      console.log(`   Formatted: ${validation.standardizedAddress?.formatted_address || 'N/A'}`);
      
      if (validation.suggestions) {
        console.log(`   Additional suggestions: ${validation.suggestions.length}`);
      }
    } else {
      console.log(`❌ Validation failed: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Validation error: ${error.message}`);
  }
}

async function main() {
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  await testGeoapifyFixes();
  await testAddressValidation();
  
  console.log('\n✅ Geoapify fix testing complete!');
}

main().catch(console.error);
