
// Test script to check Stripe price ID environment variables
console.log('🔍 Testing Stripe Price ID Environment Variables...\n');

const requiredPriceIds = [
  'STRIPE_STARTER_MONTHLY_PRICE_ID',
  'STRIPE_STARTER_YEARLY_PRICE_ID', 
  'STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID',
  'STRIPE_PROFESSIONAL_YEARLY_PRICE_ID',
  'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
  'STRIPE_ENTERPRISE_YEARLY_PRICE_ID',
  'STRIPE_BASIC_MONTHLY_PRICE_ID',
  'STRIPE_BASIC_YEARLY_PRICE_ID',
  'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
  'STRIPE_PREMIUM_YEARLY_PRICE_ID',
  'STRIPE_FAMILY_MONTHLY_PRICE_ID',
  'STRIPE_FAMILY_YEARLY_PRICE_ID'
];

console.log('📋 Environment Variables Status:');
requiredPriceIds.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  console.log(`${status} ${varName}: ${value || 'UNDEFINED'}`);
});

console.log('\n🧪 Testing Plans API Structure...');

// Test main plans structure
const plans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    stripePriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  },
  {
    id: 'premium', 
    name: 'Premium Plan',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
  },
  {
    id: 'family',
    name: 'Family Plan', 
    stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
  }
];

console.log('\n📋 Plans with Stripe Price IDs:');
plans.forEach(plan => {
  console.log(`\n${plan.name}:`);
  console.log(`  Monthly Price ID: ${plan.stripePriceId || 'UNDEFINED'}`);
  console.log(`  Yearly Price ID: ${plan.stripeYearlyPriceId || 'UNDEFINED'}`);
  
  if (!plan.stripePriceId) {
    console.log(`  ❌ ERROR: Missing monthly price ID for ${plan.name}`);
  }
  if (!plan.stripeYearlyPriceId) {
    console.log(`  ❌ ERROR: Missing yearly price ID for ${plan.name}`);
  }
});

console.log('\n🎯 SUMMARY:');
const missingVars = requiredPriceIds.filter(varName => !process.env[varName]);
if (missingVars.length === 0) {
  console.log('✅ All Stripe price ID environment variables are set!');
} else {
  console.log(`❌ Missing ${missingVars.length} environment variables:`);
  missingVars.forEach(varName => console.log(`   - ${varName}`));
}
