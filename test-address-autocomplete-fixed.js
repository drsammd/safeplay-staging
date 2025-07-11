// Test script to verify address autocomplete fixes
const fetch = require('node-fetch');

async function testAddressAutocompleteFixed() {
  console.log('🔍 Testing Address Autocomplete Fixes...');
  
  // Test cases that should work with the new logic
  const testCases = [
    { input: '123 Main St', shouldReturn: 'multiple suggestions' },
    { input: '1838 Oak Ave', shouldReturn: 'multiple suggestions' },
    { input: '1600 Pennsylvania', shouldReturn: 'multiple suggestions' },
    { input: '1838', shouldReturn: 'no suggestions (too short)' },
    { input: '12', shouldReturn: 'no suggestions (too short)' },
    { input: '123 Main Street New York', shouldReturn: 'multiple suggestions' }
  ];

  console.log('=== Testing Improved Autocomplete Logic ===');
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: "${testCase.input}" (expect: ${testCase.shouldReturn})`);
    
    try {
      const response = await fetch('http://localhost:3000/api/verification/address/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: testCase.input,
          countryRestriction: ['us', 'ca']
        })
      });

      if (response.ok) {
        const data = await response.json();
        const suggestionCount = data.suggestions ? data.suggestions.length : 0;
        
        console.log(`✅ Response: ${suggestionCount} suggestions`);
        
        if (suggestionCount > 0) {
          console.log(`📍 Sample suggestions:`);
          data.suggestions.slice(0, 2).forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.main_text} - ${suggestion.secondary_text}`);
          });
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n=== Testing Address Validation ===');
  
  // Test validation with a known address
  const validationTest = '1838 Jefferson IL';
  console.log(`\n🧪 Testing validation: "${validationTest}"`);
  
  try {
    const response = await fetch('http://localhost:3000/api/verification/address/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: validationTest,
        countryRestriction: ['us', 'ca']
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Validation result:`, {
        isValid: data.validation?.isValid,
        confidence: data.validation?.confidence,
        hasStandardizedAddress: !!data.validation?.standardizedAddress,
        hasSuggestions: data.validation?.suggestions?.length || 0
      });
    } else {
      console.log(`❌ Validation API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Validation request failed: ${error.message}`);
  }
}

testAddressAutocompleteFixed().catch(console.error);
