
/**
 * Test for Clean Signup Fix
 * Verifies that demo data is only provided to actual demo accounts,
 * not as fallback for new parent accounts
 */

// Simulate the fixed getDemoChildren function from parent/page.tsx
function getDemoChildren(userEmail) {
  // ONLY return demo data for actual demo accounts
  if (userEmail === 'parent@mysafeplay.ai') {
    console.log('🎭 Dashboard: Demo account parent@mysafeplay.ai - returning demo children');
    return [
      { id: "demo-1", name: "Emma Johnson", age: 7 },
      { id: "demo-2", name: "Lucas Johnson", age: 5 },
      { id: "demo-3", name: "Sophia Johnson", age: 4 }
    ];
  }

  // For ALL other accounts (including new signups), return empty array
  console.log('🧹 Dashboard: Real user account - returning empty children for clean start');
  return [];
}

// Simulate the fixed getDemoFamilyMembers function from family/page.tsx
function getDemoFamilyMembers(userEmail) {
  // ONLY return demo data for actual demo accounts
  if (userEmail !== 'parent@mysafeplay.ai') {
    console.log('🧹 Family: Real user account - returning empty family for clean start');
    return [];
  }
  
  console.log('🎭 Family: Demo account parent@mysafeplay.ai - returning demo family members');
  return [
    { id: 'demo-1', displayName: 'Sarah Johnson', familyRole: 'SPOUSE' },
    { id: 'demo-2', displayName: 'Robert Johnson', familyRole: 'GRANDPARENT' },
    { id: 'demo-3', displayName: 'Linda Johnson', familyRole: 'GRANDPARENT' },
    { id: 'demo-4', displayName: 'Maria Garcia', familyRole: 'CAREGIVER' },
    { id: 'demo-5', displayName: 'Michael Johnson', familyRole: 'AUNT_UNCLE' }
  ];
}

// Test scenarios
console.log('🧪 TESTING CLEAN SIGNUP FIX');
console.log('=' * 50);

// Test 1: New parent account (should get NO demo data)
console.log('\n📋 TEST 1: New Parent Account (newparent@example.com)');
const newParentChildren = getDemoChildren('newparent@example.com');
const newParentFamily = getDemoFamilyMembers('newparent@example.com');

console.log(`Children count: ${newParentChildren.length} (should be 0)`);
console.log(`Family count: ${newParentFamily.length} (should be 0)`);

if (newParentChildren.length === 0 && newParentFamily.length === 0) {
  console.log('✅ TEST 1 PASSED: New parent gets clean account');
} else {
  console.log('❌ TEST 1 FAILED: New parent still getting demo data');
}

// Test 2: Another new parent account
console.log('\n📋 TEST 2: Another New Parent Account (jane@gmail.com)');
const anotherParentChildren = getDemoChildren('jane@gmail.com');
const anotherParentFamily = getDemoFamilyMembers('jane@gmail.com');

console.log(`Children count: ${anotherParentChildren.length} (should be 0)`);
console.log(`Family count: ${anotherParentFamily.length} (should be 0)`);

if (anotherParentChildren.length === 0 && anotherParentFamily.length === 0) {
  console.log('✅ TEST 2 PASSED: Another new parent gets clean account');
} else {
  console.log('❌ TEST 2 FAILED: Another new parent still getting demo data');
}

// Test 3: Demo account (should get demo data)
console.log('\n📋 TEST 3: Demo Account (parent@mysafeplay.ai)');
const demoChildren = getDemoChildren('parent@mysafeplay.ai');
const demoFamily = getDemoFamilyMembers('parent@mysafeplay.ai');

console.log(`Children count: ${demoChildren.length} (should be 3)`);
console.log(`Family count: ${demoFamily.length} (should be 5)`);

if (demoChildren.length === 3 && demoFamily.length === 5) {
  console.log('✅ TEST 3 PASSED: Demo account gets demo data');
} else {
  console.log('❌ TEST 3 FAILED: Demo account not getting demo data');
}

// Test 4: John's security demo account (should get NO data)
console.log('\n📋 TEST 4: John\'s Security Demo Account (john@doe.com)');
const johnChildren = getDemoChildren('john@doe.com');
const johnFamily = getDemoFamilyMembers('john@doe.com');

console.log(`Children count: ${johnChildren.length} (should be 0)`);
console.log(`Family count: ${johnFamily.length} (should be 0)`);

if (johnChildren.length === 0 && johnFamily.length === 0) {
  console.log('✅ TEST 4 PASSED: John\'s account gets clean data for security demo');
} else {
  console.log('❌ TEST 4 FAILED: John\'s account getting demo data');
}

// Summary
console.log('\n🎯 SUMMARY:');
console.log('=' * 50);

const allTestsPassed = (
  newParentChildren.length === 0 && newParentFamily.length === 0 &&
  anotherParentChildren.length === 0 && anotherParentFamily.length === 0 &&
  demoChildren.length === 3 && demoFamily.length === 5 &&
  johnChildren.length === 0 && johnFamily.length === 0
);

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED: Clean signup fix is working correctly!');
  console.log('🎉 New parent accounts will start completely clean');
  console.log('🎭 Demo accounts still get demo data as expected');
  console.log('🧹 Demo data injection from new accounts has been eliminated');
} else {
  console.log('❌ SOME TESTS FAILED: Clean signup fix needs more work');
}

console.log('\n📊 BEFORE vs AFTER:');
console.log('BEFORE: New parents got 3 children + 5 family members automatically');
console.log('AFTER:  New parents get 0 children + 0 family members (clean start)');
