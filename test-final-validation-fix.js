const { z } = require('zod');

// Test the EXACT fixed schema from main signup route
const mainSignupSchema = z.object({
  email: z.preprocess((val) => {
    if (typeof val === "string") return val.trim().toLowerCase();
    return String(val || "").trim().toLowerCase();
  }, z.string().email("Invalid email address")),
  
  password: z.preprocess((val) => {
    return typeof val === "string" ? val : String(val || "");
  }, z.string().min(8, "Password must be at least 8 characters")),
  
  name: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string().min(2, "Name must be at least 2 characters")),
  
  role: z.preprocess((val) => {
    return typeof val === "string" ? val : "PARENT";
  }, z.enum(["PARENT", "VENUE_ADMIN", "SUPER_ADMIN"]).default("PARENT")),
  
  agreeToTerms: z.preprocess((val) => {
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0") return false;
    return Boolean(val);
  }, z.boolean().refine(val => val === true, "You must agree to the Terms of Service")),
  
  agreeToPrivacy: z.preprocess((val) => {
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0") return false;
    return Boolean(val);
  }, z.boolean().refine(val => val === true, "You must agree to the Privacy Policy")),
  
  homeAddress: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string().min(5, "Home address must be at least 5 characters")),
  
  homeAddressValidation: z.preprocess((val) => {
    if (val === null || val === undefined) return {};
    if (typeof val === 'object' && val !== null) return val;
    return {};
  }, z.any().optional()),
  
  useDifferentBillingAddress: z.preprocess((val) => {
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0") return false;
    return false;
  }, z.boolean().default(false)),
  
  // FIXED: Now nullable
  billingAddress: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string().nullable().optional()),
  
  billingAddressValidation: z.preprocess((val) => {
    if (val === null || val === undefined) return {};
    if (typeof val === 'object' && val !== null) return val;
    return {};
  }, z.any().optional()),
  
  selectedPlan: z.object({
    id: z.string(),
    name: z.string(),
    stripePriceId: z.string().nullable(),
    billingInterval: z.enum(["monthly", "yearly", "lifetime", "free"]),
    amount: z.number(),
    planType: z.string(),
  }).nullable().optional(),
  
  subscriptionData: z.any().optional(),
  // FIXED: Now nullable
  paymentMethodId: z.string().nullable().optional(),
  homeAddressFields: z.any().optional(),
  billingAddressFields: z.any().optional(),
  debugMetadata: z.any().optional(),
});

// Test with production-like data that previously failed
const productionTestData = {
  email: "test@example.com",
  password: "testpassword123",
  name: "Test User",
  role: "PARENT",
  agreeToTerms: true,
  agreeToPrivacy: true,
  homeAddress: "123 Test Street, Test City, Test State 12345",
  homeAddressValidation: null,
  useDifferentBillingAddress: false,
  billingAddress: "",
  billingAddressValidation: null,
  selectedPlan: null,
  subscriptionData: null,
  paymentMethodId: null,
  homeAddressFields: null,
  billingAddressFields: null,
  debugMetadata: null
};

console.log('🧪 TESTING FINAL VALIDATION FIXES');
console.log('='.repeat(50));

console.log('\n1. Testing with production-like data:');
const mainResult = mainSignupSchema.safeParse(productionTestData);
console.log('Main signup route validation:', mainResult.success ? '✅ SUCCESS' : '❌ FAILED');

if (!mainResult.success) {
  console.log('❌ Main route validation errors:');
  mainResult.error.issues.forEach((issue, index) => {
    console.log(`   Issue ${index + 1}:`, {
      path: issue.path,
      message: issue.message,
      code: issue.code,
      received: issue.received,
      expected: issue.expected
    });
  });
}

console.log('\n2. Testing edge cases:');
const edgeCases = [
  { name: 'All null optional fields', data: { ...productionTestData, billingAddress: null, paymentMethodId: null } },
  { name: 'All undefined optional fields', data: { ...productionTestData, billingAddress: undefined, paymentMethodId: undefined } },
  { name: 'Mixed null/undefined', data: { ...productionTestData, billingAddress: null, paymentMethodId: undefined } },
  { name: 'Empty strings', data: { ...productionTestData, billingAddress: "", paymentMethodId: "" } },
];

edgeCases.forEach((testCase, index) => {
  const result = mainSignupSchema.safeParse(testCase.data);
  console.log(`   ${index + 1}. ${testCase.name}:`, result.success ? '✅ SUCCESS' : '❌ FAILED');
  if (!result.success) {
    console.log(`      Error: ${result.error.issues[0]?.message}`);
  }
});

console.log('\n3. Testing specific billingAddressValidation scenarios:');
const billingTests = [
  { name: 'billingAddressValidation = null', value: null },
  { name: 'billingAddressValidation = undefined', value: undefined },
  { name: 'billingAddressValidation = {}', value: {} },
  { name: 'billingAddressValidation = {valid: true}', value: {valid: true} },
];

billingTests.forEach((test, index) => {
  const testData = { ...productionTestData, billingAddressValidation: test.value };
  const result = mainSignupSchema.safeParse(testData);
  console.log(`   ${index + 1}. ${test.name}:`, result.success ? '✅ SUCCESS' : '❌ FAILED');
  if (!result.success) {
    console.log(`      Error: ${result.error.issues[0]?.message}`);
  }
});

console.log('\n4. Testing complete end-to-end scenario:');
const completeTestData = {
  email: "john@example.com",
  password: "securepassword123",
  name: "John Doe",
  role: "PARENT",
  agreeToTerms: true,
  agreeToPrivacy: true,
  homeAddress: "456 Main Street, Anytown, NY 12345",
  homeAddressValidation: { isValid: true, confidence: 0.9 },
  useDifferentBillingAddress: true,
  billingAddress: "789 Billing Ave, Billing City, CA 90210",
  billingAddressValidation: { isValid: true, confidence: 0.8 },
  selectedPlan: {
    id: "basic",
    name: "Basic Plan",
    stripePriceId: "price_123",
    billingInterval: "monthly",
    amount: 9.99,
    planType: "BASIC"
  },
  subscriptionData: { trial: true },
  paymentMethodId: "pm_123456789",
  homeAddressFields: { street: "456 Main Street", city: "Anytown", state: "NY", zipCode: "12345" },
  billingAddressFields: { street: "789 Billing Ave", city: "Billing City", state: "CA", zipCode: "90210" },
  debugMetadata: { timestamp: new Date().toISOString() }
};

const completeResult = mainSignupSchema.safeParse(completeTestData);
console.log('Complete scenario validation:', completeResult.success ? '✅ SUCCESS' : '❌ FAILED');

if (!completeResult.success) {
  console.log('❌ Complete scenario errors:');
  completeResult.error.issues.forEach((issue, index) => {
    console.log(`   Issue ${index + 1}:`, {
      path: issue.path,
      message: issue.message,
      code: issue.code
    });
  });
}

console.log('\n' + '='.repeat(50));
console.log('🎯 VALIDATION FIX TESTING COMPLETE');
