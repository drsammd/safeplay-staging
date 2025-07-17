const { z } = require('zod');

// Exact schema from production
const signupSchema = z.object({
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
  
  billingAddress: z.preprocess((val) => {
    if (typeof val === "string") return val.trim();
    return String(val || "").trim();
  }, z.string().optional()),
  
  billingAddressValidation: z.preprocess((val) => {
    console.log('PRODUCTION TEST: billingAddressValidation preprocessing:', val, typeof val);
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
  paymentMethodId: z.string().optional(),
  homeAddressFields: z.any().optional(),
  billingAddressFields: z.any().optional(),
  debugMetadata: z.any().optional(),
});

// Test with data similar to production failure
const testData = {
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

console.log('Testing with production-like data:');
console.log('Test data:', JSON.stringify(testData, null, 2));

const validation = signupSchema.safeParse(testData);
console.log('\nValidation result:', validation.success ? 'SUCCESS' : 'FAILED');

if (!validation.success) {
  console.log('\nValidation errors:');
  validation.error.issues.forEach((issue, index) => {
    console.log(`Issue ${index + 1}:`, {
      path: issue.path,
      message: issue.message,
      code: issue.code,
      received: issue.received,
      expected: issue.expected
    });
  });
}

console.log('\nTesting just billingAddressValidation:');
const simpleSchema = z.object({
  billingAddressValidation: z.preprocess((val) => {
    console.log('Simple test preprocessing:', val, typeof val);
    if (val === null || val === undefined) return {};
    if (typeof val === 'object' && val !== null) return val;
    return {};
  }, z.any().optional()),
});

const simpleResult = simpleSchema.safeParse({ billingAddressValidation: null });
console.log('Simple validation result:', simpleResult.success ? 'SUCCESS' : 'FAILED');
if (!simpleResult.success) {
  console.log('Simple validation errors:', simpleResult.error.issues);
}
