const { z } = require('zod');

// Test the exact validation schema from the signup route
const testSchema = z.object({
  billingAddressValidation: z.preprocess((val) => {
    console.log('Preprocessing billingAddressValidation:', val, typeof val);
    if (val === null || val === undefined) return {};
    if (typeof val === 'object' && val !== null) return val;
    return {};
  }, z.any().optional()),
});

// Test cases
const testCases = [
  { billingAddressValidation: null },
  { billingAddressValidation: undefined },
  { billingAddressValidation: {} },
  { billingAddressValidation: { test: 'value' } },
  {} // missing property
];

console.log('Testing validation schema:');
testCases.forEach((testCase, index) => {
  console.log(`\nTest case ${index + 1}:`, testCase);
  try {
    const result = testSchema.safeParse(testCase);
    console.log('Result:', result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) {
      console.log('Errors:', result.error.issues);
    }
  } catch (error) {
    console.log('Exception:', error.message);
  }
});
