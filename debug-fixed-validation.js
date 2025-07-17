const { z } = require('zod');

// Test with corrected schema - paymentMethodId should be nullable
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
    console.log('homeAddressValidation preprocessing:', val, typeof val);
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
    console.log('billingAddressValidation preprocessing:', val, typeof val);
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
  // FIX: Make paymentMethodId nullable
  paymentMethodId: z.string().nullable().optional(),
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

console.log('Testing with corrected schema (paymentMethodId nullable):');
const validation = signupSchema.safeParse(testData);
console.log('Validation result:', validation.success ? 'SUCCESS' : 'FAILED');

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

console.log('\nTesting validation behavior for different null inputs:');
const nullTests = [
  { key: 'paymentMethodId', value: null },
  { key: 'paymentMethodId', value: undefined },
  { key: 'billingAddressValidation', value: null },
  { key: 'billingAddressValidation', value: undefined },
  { key: 'homeAddressValidation', value: null },
  { key: 'homeAddressValidation', value: undefined }
];

nullTests.forEach(test => {
  const testObj = { ...testData, [test.key]: test.value };
  const result = signupSchema.safeParse(testObj);
  console.log(`${test.key} = ${test.value}:`, result.success ? 'SUCCESS' : 'FAILED');
  if (!result.success) {
    console.log('  Error:', result.error.issues[0]?.message);
  }
});
