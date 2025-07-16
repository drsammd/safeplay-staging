// Test script to validate Stripe price ID environment variables
console.log('=== STRIPE PRICE ID ENVIRONMENT VALIDATION ===');
console.log('Testing all required Stripe price ID environment variables...\n');

// Load environment variables
require('dotenv').config();

const requiredEnvVars = [
  'STRIPE_FREE_PLAN_PRICE_ID',
  'STRIPE_INDIVIDUAL_PHOTO_PRICE_ID', 
  'STRIPE_INDIVIDUAL_VIDEO_PRICE_ID',
  'STRIPE_PACK_1_PRICE_ID',
  'STRIPE_PACK_2_PRICE_ID',
  'STRIPE_PACK_3_PRICE_ID',
  'STRIPE_STARTER_MONTHLY_PRICE_ID',
  'STRIPE_STARTER_YEARLY_PRICE_ID',
  'STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID',
  'STRIPE_PROFESSIONAL_YEARLY_PRICE_ID',
  'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
  'STRIPE_ENTERPRISE_YEARLY_PRICE_ID'
];

let allValid = true;

console.log('🔍 Checking environment variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const isValid = value && value !== 'undefined' && value.trim() !== '';
  console.log(`${isValid ? '✅' : '❌'} ${varName}: ${value || 'MISSING'}`);
  if (!isValid) allValid = false;
});

console.log('\n=== VALIDATION RESULT ===');
if (allValid) {
  console.log('🎉 SUCCESS: All required Stripe price ID environment variables are properly configured!');
  console.log('💳 Subscription system should now work without "Invalid price ID" errors.');
} else {
  console.log('❌ FAILURE: Some environment variables are missing or invalid.');
  console.log('🔧 Please check the .env file configuration.');
}

console.log('\n=== STRIPE CONFIG TEST ===');
try {
  // Test that the config loads properly
  const { stripeConfig, subscriptionPlans } = require('./lib/stripe/config.ts');
  console.log('✅ Stripe configuration loaded successfully');
  console.log('📋 Available subscription plans:', Object.keys(subscriptionPlans));
} catch (error) {
  console.log('❌ Error loading Stripe configuration:', error.message);
}
