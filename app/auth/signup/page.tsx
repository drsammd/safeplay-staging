
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, User, Mail, Lock, Building, ArrowRight, ArrowLeft, CheckCircle, MapPin, Home, AlertCircle } from "lucide-react";
import SubscriptionPlans from "@/components/subscription/subscription-plans";
import PaymentSetup from "@/components/subscription/payment-setup";
import { AddressAutocomplete } from "@/components/verification/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RegistrationStep = 'basic-info' | 'address-collection' | 'plan-selection' | 'payment-setup' | 'account-creation' | 'verification-prompt' | 'complete';

interface SelectedPlan {
  id: string;
  name: string;
  stripePriceId: string;
  billingInterval: 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  planType: string;
}

interface AddressFields {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('basic-info');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "PARENT",
    agreeToTerms: false,
    agreeToPrivacy: false,
    homeAddress: "",
    useDifferentBillingAddress: false,
    billingAddress: ""
  });
  const [homeAddressValidation, setHomeAddressValidation] = useState<any>(null);
  const [billingAddressValidation, setBillingAddressValidation] = useState<any>(null);
  const [homeAddressFields, setHomeAddressFields] = useState<AddressFields>({
    street: '', city: '', state: '', zipCode: '', fullAddress: ''
  });
  const [billingAddressFields, setBillingAddressFields] = useState<AddressFields>({
    street: '', city: '', state: '', zipCode: '', fullAddress: ''
  });
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const steps = [
    { key: 'basic-info', title: 'Basic Information', description: 'Create your account' },
    { key: 'address-collection', title: 'Address Information', description: 'Verify your address' },
    { key: 'plan-selection', title: 'Choose Plan', description: 'Select subscription plan' },
    { key: 'payment-setup', title: 'Payment Setup', description: 'Add payment method' },
    { key: 'account-creation', title: 'Account Creation', description: 'Finalizing your account' },
    { key: 'verification-prompt', title: 'Verification', description: 'Complete your profile' },
    { key: 'complete', title: 'Complete', description: 'Welcome to SafePlay!' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      setError("You must agree to both Terms of Service and Privacy Policy");
      setIsLoading(false);
      return;
    }

    // Check if email already exists
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (data.exists) {
        setError("An account with this email already exists. Please use a different email or sign in instead.");
        setIsLoading(false);
        return;
      }

      // Proceed to address collection
      setCurrentStep('address-collection');
    } catch (error: any) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = () => {
    setError("");

    // Validate home address
    if (!formData.homeAddress.trim()) {
      setError("Home address is required");
      return;
    }

    // More forgiving validation
    if (homeAddressValidation && !homeAddressValidation.isValid && homeAddressValidation.confidence < 0.1) {
      setError("Please enter a more complete address");
      return;
    }

    // Validate billing address if different billing address is used
    if (formData.useDifferentBillingAddress) {
      if (!formData.billingAddress.trim()) {
        setError("Billing address is required when using a different billing address");
        return;
      }

      if (billingAddressValidation && !billingAddressValidation.isValid && billingAddressValidation.confidence < 0.1) {
        setError("Please enter a more complete billing address");
        return;
      }
    }

    // Proceed to plan selection
    setCurrentStep('plan-selection');
  };

  const handlePlanSelect = (stripePriceId: string, billingInterval: 'monthly' | 'yearly' | 'lifetime', planId: string) => {
    // Fetch plan details from the REAL API that SubscriptionPlans component uses
    fetch('/api/stripe/plans')
      .then(res => res.json())
      .then(data => {
        const plan = data.plans?.find((p: any) => p.id === planId);
        if (plan) {
          const amount = billingInterval === 'lifetime' ? plan.lifetimePrice : 
                        billingInterval === 'yearly' ? plan.yearlyPrice : 
                        plan.price;
          
          const planObject = {
            id: planId,
            name: plan.name,
            stripePriceId,
            billingInterval,
            amount,
            planType: plan.planType
          };

          setSelectedPlan(planObject);

          console.log('✅ Plan selected successfully:', {
            planId,
            planName: plan.name,
            billingInterval,
            amount
          });

          // 🔧 CRITICAL FIX v1.5.8: Pass the plan object directly instead of relying on state
          // If free plan, create account directly with the plan object
          if (plan.planType === 'FREE') {
            handleAccountCreation(null, planObject);
          } else {
            setCurrentStep('payment-setup');
          }
        } else {
          console.error('❌ Plan not found in real API:', { planId, availablePlans: data.plans?.map((p: any) => p.id) });
          setError('Selected plan not found. Please refresh and try again.');
        }
      })
      .catch(error => {
        console.error('Error fetching plan details:', error);
        setError('Failed to load plan details. Please try again.');
      });
  };

  const handlePaymentSuccess = (subscriptionData: any) => {
    // Move to account creation with subscription data
    handleAccountCreation(subscriptionData, selectedPlan);
  };

  const handleAccountCreation = async (subscriptionData: any, planObject: SelectedPlan | null = null) => {
    setCurrentStep('account-creation');
    setIsLoading(true);
    setError("");

    try {
      // 🔧 CRITICAL FIX v1.5.7: Pre-submission validation and form state verification
      console.log(`🔧 SIGNUP FIX v1.5.7: === PRE-SUBMISSION VALIDATION ===`);
      
      // Validate form state is fully populated before proceeding
      if (!formData.name?.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.email?.trim()) {
        throw new Error("Email is required");
      }
      if (!formData.password?.trim()) {
        throw new Error("Password is required");
      }
      if (!formData.homeAddress?.trim()) {
        throw new Error("Home address is required");
      }
      if (formData.agreeToTerms !== true) {
        throw new Error("You must agree to the Terms of Service");
      }
      if (formData.agreeToPrivacy !== true) {
        throw new Error("You must agree to the Privacy Policy");
      }
      
      console.log(`✅ SIGNUP FIX v1.5.7: Pre-submission validation passed`);
      
      // 🔍 COMPREHENSIVE DEBUG v1.5.7: Capture attempt information and timing
      const attemptTimestamp = new Date().toISOString();
      const attemptId = `signup_attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine if this is a retry attempt based on error state
      const isRetryAttempt = error && error.includes("Invalid signup data");
      const attemptType = isRetryAttempt ? "RETRY_ATTEMPT" : "FIRST_ATTEMPT";
      
      console.log(`🚀 SIGNUP DEBUG [${attemptId}]: === ${attemptType} STARTED ===`);
      console.log(`🚀 SIGNUP DEBUG [${attemptId}]: Timestamp: ${attemptTimestamp}`);
      console.log(`🚀 SIGNUP DEBUG [${attemptId}]: Previous error state: "${error}"`);
      console.log(`🚀 SIGNUP DEBUG [${attemptId}]: Current step: ${currentStep}`);
      console.log(`🚀 SIGNUP DEBUG [${attemptId}]: Is loading: ${isLoading}`);
      
      // 🔍 FORM STATE DEBUG: Capture exact form state at submission time
      console.log(`📋 SIGNUP DEBUG [${attemptId}]: === FORM STATE ANALYSIS ===`);
      console.log(`📋 SIGNUP DEBUG [${attemptId}]: Complete formData object:`, JSON.stringify(formData, null, 2));
      console.log(`📋 SIGNUP DEBUG [${attemptId}]: Form data types:`, {
        name: typeof formData.name,
        email: typeof formData.email,
        password: typeof formData.password,
        role: typeof formData.role,
        agreeToTerms: typeof formData.agreeToTerms,
        agreeToPrivacy: typeof formData.agreeToPrivacy,
        homeAddress: typeof formData.homeAddress,
        useDifferentBillingAddress: typeof formData.useDifferentBillingAddress,
        billingAddress: typeof formData.billingAddress
      });
      
      // 🔍 FORM FIELD VALUES: Log exact values
      console.log(`📋 SIGNUP DEBUG [${attemptId}]: Form field values:`, {
        name: formData.name,
        email: formData.email,
        passwordLength: formData.password?.length,
        role: formData.role,
        agreeToTerms: formData.agreeToTerms,
        agreeToPrivacy: formData.agreeToPrivacy,
        homeAddress: formData.homeAddress,
        homeAddressLength: formData.homeAddress?.length,
        useDifferentBillingAddress: formData.useDifferentBillingAddress,
        billingAddress: formData.billingAddress,
        billingAddressLength: formData.billingAddress?.length
      });
      
      // 🔍 VALIDATION STATE DEBUG: Capture validation and address state
      console.log(`📍 SIGNUP DEBUG [${attemptId}]: === ADDRESS VALIDATION STATE ===`);
      console.log(`📍 SIGNUP DEBUG [${attemptId}]: homeAddressValidation:`, homeAddressValidation);
      console.log(`📍 SIGNUP DEBUG [${attemptId}]: billingAddressValidation:`, billingAddressValidation);
      console.log(`📍 SIGNUP DEBUG [${attemptId}]: homeAddressFields:`, homeAddressFields);
      console.log(`📍 SIGNUP DEBUG [${attemptId}]: billingAddressFields:`, billingAddressFields);
      
      // 🔍 PLAN SELECTION DEBUG: Capture selected plan state
      console.log(`💳 SIGNUP DEBUG [${attemptId}]: === PLAN SELECTION STATE ===`);
      console.log(`💳 SIGNUP DEBUG [${attemptId}]: selectedPlan (state):`, selectedPlan);
      console.log(`💳 SIGNUP DEBUG [${attemptId}]: planObject (parameter):`, planObject);
      console.log(`💳 SIGNUP DEBUG [${attemptId}]: Final plan to use:`, planObject || selectedPlan || null);
      console.log(`💳 SIGNUP DEBUG [${attemptId}]: subscriptionData:`, subscriptionData);
      
      // 🔧 CRITICAL FIX v1.5.7: Enhanced data preparation with robust type handling
      const requestData = {
        // String fields - ensure they are trimmed and non-empty
        name: String(formData.name || "").trim(),
        email: String(formData.email || "").trim().toLowerCase(),
        password: String(formData.password || ""),
        role: String(formData.role || "PARENT"),
        
        // 🔧 CRITICAL FIX: Triple-safe boolean conversion to prevent any type inconsistencies
        agreeToTerms: !!(formData.agreeToTerms === true || formData.agreeToTerms === "true"),
        agreeToPrivacy: !!(formData.agreeToPrivacy === true || formData.agreeToPrivacy === "true"),
        useDifferentBillingAddress: !!(formData.useDifferentBillingAddress === true || formData.useDifferentBillingAddress === "true"),
        
        // Address fields - ensure they exist and are strings
        homeAddress: String(formData.homeAddress || "").trim(),
        homeAddressValidation: homeAddressValidation || null,
        billingAddress: String(formData.billingAddress || "").trim(),
        billingAddressValidation: billingAddressValidation || null,
        
        // 🔧 CRITICAL FIX v1.5.8: Use passed planObject parameter instead of state to avoid timing issues
        selectedPlan: planObject || selectedPlan || null,
        subscriptionData: subscriptionData || null,
        
        // Address fields - ensure they exist with proper defaults
        homeAddressFields: homeAddressFields || {
          street: "", city: "", state: "", zipCode: "", fullAddress: ""
        },
        billingAddressFields: billingAddressFields || {
          street: "", city: "", state: "", zipCode: "", fullAddress: ""
        },
        
        // 🔍 DEBUG METADATA: Add debugging information
        debugMetadata: {
          attemptId,
          attemptType,
          attemptTimestamp,
          frontendVersion: "1.5.7",
          previousError: error || "",
          formStateSnapshot: JSON.stringify(formData),
          dataPreparationTimestamp: new Date().toISOString()
        }
      };
      
      // 🔧 CRITICAL FIX v1.5.7: Final validation of prepared data
      console.log(`🔧 SIGNUP FIX v1.5.7: === PREPARED DATA VALIDATION ===`);
      
      // Validate all required fields are present and correct type
      if (typeof requestData.name !== 'string' || requestData.name.length === 0) {
        throw new Error("Invalid name field after preparation");
      }
      if (typeof requestData.email !== 'string' || requestData.email.length === 0) {
        throw new Error("Invalid email field after preparation");
      }
      if (typeof requestData.password !== 'string' || requestData.password.length === 0) {
        throw new Error("Invalid password field after preparation");
      }
      if (typeof requestData.homeAddress !== 'string' || requestData.homeAddress.length === 0) {
        throw new Error("Invalid home address field after preparation");
      }
      if (typeof requestData.agreeToTerms !== 'boolean' || requestData.agreeToTerms !== true) {
        throw new Error("Invalid agreeToTerms field after preparation");
      }
      if (typeof requestData.agreeToPrivacy !== 'boolean' || requestData.agreeToPrivacy !== true) {
        throw new Error("Invalid agreeToPrivacy field after preparation");
      }
      if (typeof requestData.useDifferentBillingAddress !== 'boolean') {
        throw new Error("Invalid useDifferentBillingAddress field after preparation");
      }
      
      console.log(`✅ SIGNUP FIX v1.5.7: All prepared data validated successfully`);

      // 🔍 REQUEST DATA DEBUG: Comprehensive logging of prepared request data
      console.log(`📤 SIGNUP DEBUG [${attemptId}]: === REQUEST DATA PREPARATION ===`);
      console.log(`📤 SIGNUP DEBUG [${attemptId}]: Request data before boolean conversion:`, {
        agreeToTerms: formData.agreeToTerms,
        agreeToPrivacy: formData.agreeToPrivacy,
        useDifferentBillingAddress: formData.useDifferentBillingAddress
      });
      console.log(`📤 SIGNUP DEBUG [${attemptId}]: Request data after boolean conversion:`, {
        agreeToTerms: requestData.agreeToTerms,
        agreeToPrivacy: requestData.agreeToPrivacy,
        useDifferentBillingAddress: requestData.useDifferentBillingAddress
      });
      console.log(`📤 SIGNUP DEBUG [${attemptId}]: Boolean conversion types:`, {
        agreeToTerms: typeof requestData.agreeToTerms,
        agreeToPrivacy: typeof requestData.agreeToPrivacy,
        useDifferentBillingAddress: typeof requestData.useDifferentBillingAddress
      });
      
      // 🔍 COMPLETE REQUEST PAYLOAD: Log complete request data
      console.log(`📤 SIGNUP DEBUG [${attemptId}]: Complete request payload:`, JSON.stringify(requestData, null, 2));
      console.log(`📤 SIGNUP DEBUG [${attemptId}]: Request payload keys:`, Object.keys(requestData));
      console.log(`📤 SIGNUP DEBUG [${attemptId}]: Request payload size: ${JSON.stringify(requestData).length} characters`);

      // 🔍 API REQUEST DEBUG: Log the actual fetch request
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: === SENDING API REQUEST ===`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: URL: /api/auth/signup`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Method: POST`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Headers: Content-Type: application/json`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Body size: ${JSON.stringify(requestData).length} characters`);
      
      const requestStartTime = Date.now();
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const requestEndTime = Date.now();
      const requestDuration = requestEndTime - requestStartTime;

      // 🔍 API RESPONSE DEBUG: Log response details
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: === API RESPONSE RECEIVED ===`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Request duration: ${requestDuration}ms`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Response status: ${response.status}`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Response statusText: ${response.statusText}`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Response ok: ${response.ok}`);
      console.log(`🌐 SIGNUP DEBUG [${attemptId}]: Response headers:`, Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      
      // 🔍 RESPONSE DATA DEBUG: Log complete response data
      console.log(`📥 SIGNUP DEBUG [${attemptId}]: === RESPONSE DATA ANALYSIS ===`);
      console.log(`📥 SIGNUP DEBUG [${attemptId}]: Response data:`, JSON.stringify(data, null, 2));
      console.log(`📥 SIGNUP DEBUG [${attemptId}]: Response data keys:`, Object.keys(data || {}));
      console.log(`📥 SIGNUP DEBUG [${attemptId}]: Has error field:`, 'error' in (data || {}));
      console.log(`📥 SIGNUP DEBUG [${attemptId}]: Error field type:`, typeof data?.error);
      console.log(`📥 SIGNUP DEBUG [${attemptId}]: Error field value:`, data?.error);

      if (!response.ok) {
        console.error(`🚨 SIGNUP ERROR [${attemptId}]: === API RESPONSE FAILED ===`);
        console.error(`🚨 SIGNUP ERROR [${attemptId}]: Status: ${response.status}`);
        console.error(`🚨 SIGNUP ERROR [${attemptId}]: StatusText: ${response.statusText}`);
        console.error(`🚨 SIGNUP ERROR [${attemptId}]: Response data:`, data);
        console.error(`🚨 SIGNUP ERROR [${attemptId}]: Attempt type: ${attemptType}`);
        console.error(`🚨 SIGNUP ERROR [${attemptId}]: Request duration: ${requestDuration}ms`);
        
        // 🔍 ERROR ANALYSIS: Detailed error breakdown
        console.error(`🔍 SIGNUP ERROR [${attemptId}]: === ERROR ANALYSIS ===`);
        if (data?.error?.issues) {
          console.error(`🔍 SIGNUP ERROR [${attemptId}]: Validation issues found:`, data.error.issues);
          data.error.issues.forEach((issue: any, index: number) => {
            console.error(`🔍 SIGNUP ERROR [${attemptId}]: Issue ${index + 1}:`, {
              path: issue.path,
              message: issue.message,
              code: issue.code,
              received: issue.received,
              expected: issue.expected
            });
          });
        }
        
        // Handle error message properly to avoid "[object Object]" display
        let errorMessage = "Account Creation Failed - Invalid signup data";
        if (typeof data.error === 'string' && data.error.trim() !== '') {
          errorMessage = data.error;
        } else if (typeof data.error === 'object' && data.error !== null) {
          if (typeof data.error.message === 'string' && data.error.message.trim() !== '') {
            errorMessage = data.error.message;
          } else if (typeof data.error.details === 'string' && data.error.details.trim() !== '') {
            errorMessage = data.error.details;
          } else {
            errorMessage = `Account creation failed - ${JSON.stringify(data.error)}`;
          }
        } else if (typeof data.message === 'string' && data.message.trim() !== '') {
          errorMessage = data.message;
        } else if (typeof data.details === 'string' && data.details.trim() !== '') {
          errorMessage = data.details;
        } else {
          errorMessage = `Account creation failed (Status ${response.status}) - Please check all required fields`;
        }
        
        console.error(`🚨 SIGNUP ERROR [${attemptId}]: Final error message: "${errorMessage}"`);
        
        throw new Error(errorMessage);
      }
      
      // 🔍 SUCCESS RESPONSE DEBUG: Log successful response
      console.log(`✅ SIGNUP SUCCESS [${attemptId}]: === API REQUEST SUCCESSFUL ===`);
      console.log(`✅ SIGNUP SUCCESS [${attemptId}]: Status: ${response.status}`);
      console.log(`✅ SIGNUP SUCCESS [${attemptId}]: Request duration: ${requestDuration}ms`);
      console.log(`✅ SIGNUP SUCCESS [${attemptId}]: Attempt type: ${attemptType}`);
      console.log(`✅ SIGNUP SUCCESS [${attemptId}]: Response data keys:`, Object.keys(data || {}));

      // Auto-login after successful account creation
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        console.error("Auto-login failed:", signInResult.error);
        // Still proceed to success, user can login manually
      }

      setCurrentStep('verification-prompt');
    } catch (error: any) {
      // 🔍 EXCEPTION DEBUG: Comprehensive error logging
      const attemptId = `signup_exception_${Date.now()}`;
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: === EXCEPTION DURING ACCOUNT CREATION ===`);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Error type:`, typeof error);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Error constructor:`, error?.constructor?.name);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Error message:`, error?.message);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Error stack:`, error?.stack);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Complete error object:`, error);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Current step:`, currentStep);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Selected plan (state):`, selectedPlan);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Plan object (parameter):`, planObject);
      console.error(`🚨 SIGNUP EXCEPTION [${attemptId}]: Form data summary:`, {
        hasName: !!formData.name,
        hasEmail: !!formData.email,
        hasPassword: !!formData.password,
        agreeToTerms: formData.agreeToTerms,
        agreeToPrivacy: formData.agreeToPrivacy,
        hasHomeAddress: !!formData.homeAddress
      });
      
      setError(error.message || "Something went wrong. Please try again.");
      // Keep user on current step (account-creation) so they can see the error and retry
      // Don't automatically go back to plan selection
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddressChange = (field: 'homeAddress' | 'billingAddress', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressFieldsChange = (field: 'homeAddress' | 'billingAddress', fields: AddressFields) => {
    if (field === 'homeAddress') {
      setHomeAddressFields(fields);
    } else {
      setBillingAddressFields(fields);
    }
  };

  const handleBackStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key as RegistrationStep);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic-info':
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <form className="space-y-6" onSubmit={handleBasicInfoSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-white mb-2">
                  Account Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PARENT" className="bg-gray-800">Parent</option>
                    <option value="VENUE_ADMIN" className="bg-gray-800">Venue Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Legal Agreements */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/20 rounded bg-white/5"
                    required
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-white leading-relaxed">
                    I agree to the{" "}
                    <Link 
                      href="/terms" 
                      target="_blank" 
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Terms of Service
                    </Link>
                    {" "}and understand that SafePlay will collect and process biometric data, including facial recognition information, from my children for safety monitoring purposes.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    id="agreeToPrivacy"
                    name="agreeToPrivacy"
                    type="checkbox"
                    checked={formData.agreeToPrivacy}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/20 rounded bg-white/5"
                    required
                  />
                  <label htmlFor="agreeToPrivacy" className="text-sm text-white leading-relaxed">
                    I have read and agree to the{" "}
                    <Link 
                      href="/privacy" 
                      target="_blank" 
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Privacy Policy
                    </Link>
                    {" "}and provide consent for SafePlay to collect, process, and store my children's personal information in accordance with COPPA and GDPR requirements.
                  </label>
                </div>

                <div className="bg-blue-900/30 border border-blue-400/20 rounded-lg p-4 mt-4">
                  <p className="text-xs text-blue-100 leading-relaxed">
                    <strong>Important:</strong> By creating an account, you certify that you are the legal parent or guardian of any children you register and have the authority to provide consent for the collection and processing of their biometric and personal information for child safety purposes.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !formData.agreeToTerms || !formData.agreeToPrivacy}
                className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? "Validating..." : "Continue to Address"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        );

      case 'address-collection':
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Address Information</h3>
              <p className="text-gray-300">Verify your address for account security and service delivery</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleAddressSubmit(); }}>
              {/* Home Address */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Home className="inline h-4 w-4 mr-2" />
                  Home Address *
                </label>
                <AddressAutocomplete
                  value={formData.homeAddress}
                  onChange={(value) => handleAddressChange('homeAddress', value)}
                  onValidationChange={setHomeAddressValidation}
                  onFieldsChange={(fields) => handleAddressFieldsChange('homeAddress', fields)}
                  placeholder="Start typing your address (e.g., 123 Main St, City, State)"
                  required
                  countryRestriction={['us', 'ca']}
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Type your street address with city and state. Suggestions will appear as you type.
                </p>
              </div>

              {/* Different Billing Address Checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="useDifferentBillingAddress"
                  checked={formData.useDifferentBillingAddress}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, useDifferentBillingAddress: !!checked }))
                  }
                  className="mt-1"
                />
                <label htmlFor="useDifferentBillingAddress" className="text-sm text-white leading-relaxed">
                  Use a different billing address for payments
                </label>
              </div>

              {/* Billing Address (conditional) */}
              {formData.useDifferentBillingAddress && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Billing Address *
                  </label>
                  <AddressAutocomplete
                    value={formData.billingAddress}
                    onChange={(value) => handleAddressChange('billingAddress', value)}
                    onValidationChange={setBillingAddressValidation}
                    onFieldsChange={(fields) => handleAddressFieldsChange('billingAddress', fields)}
                    placeholder="Start typing your billing address (e.g., 456 Oak Ave, City, State)"
                    required
                    countryRestriction={['us', 'ca']}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Type your billing address with city and state. Suggestions will appear as you type.
                  </p>
                </div>
              )}

              {/* Address Information Alert */}
              <Alert className="bg-blue-900/30 border border-blue-400/20">
                <MapPin className="h-4 w-4" />
                <AlertDescription className="text-blue-100">
                  <strong>Important:</strong> Your address information helps us verify your identity and ensure the safety of your children. This information is encrypted and stored securely.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleBackStep}
                  className="flex-1 text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.homeAddress}
                  className="flex-1 btn-primary"
                >
                  Continue to Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        );

      case 'plan-selection':
        return (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
              <p className="text-gray-600">Select the plan that best fits your needs</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <div className="max-w-6xl mx-auto">
              <SubscriptionPlans 
                onSelectPlan={handlePlanSelect}
                loading={isLoading}
              />
            </div>

            <div className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleBackStep}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Address
              </Button>
            </div>
          </div>
        );

      case 'payment-setup':
        return (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup</h3>
              <p className="text-gray-600">Complete your subscription to {selectedPlan?.name}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {selectedPlan && (
              <div className="max-w-md mx-auto">
                <PaymentSetup
                  planId={selectedPlan.id}
                  stripePriceId={selectedPlan.stripePriceId}
                  billingInterval={selectedPlan.billingInterval}
                  planName={selectedPlan.name}
                  amount={selectedPlan.amount}
                  onSuccess={handlePaymentSuccess}
                  onError={(error) => setError(error)}
                  prefilledBillingAddress={
                    formData.useDifferentBillingAddress 
                      ? formData.billingAddress 
                      : formData.homeAddress
                  }
                  billingAddressValidation={
                    formData.useDifferentBillingAddress 
                      ? billingAddressValidation 
                      : homeAddressValidation
                  }
                  prefilledBillingFields={
                    formData.useDifferentBillingAddress
                      ? billingAddressFields
                      : homeAddressFields
                  }
                  userEmail={formData.email}
                  userName={formData.name}
                />
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleBackStep}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plan Selection
              </Button>
            </div>
          </div>
        );

      case 'account-creation':
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <div className="text-center space-y-4">
              {isLoading ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Creating Your Account</h3>
                    <p className="text-gray-300">Please wait while we set up your SafePlay account...</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Account Creation Failed</h3>
                    <p className="text-gray-300 mb-4">We encountered an issue while creating your account</p>
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                      {error}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep('payment-setup')}
                      className="flex-1 text-white border-white/20 hover:bg-white/10"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go Back
                    </Button>
                    <Button
                      onClick={() => {
                        setError("");
                        handleAccountCreation(selectedPlan?.planType === 'FREE' ? null : { subscription: { id: 'retry' } }, selectedPlan);
                      }}
                      className="flex-1 btn-primary"
                    >
                      Try Again
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Account Created Successfully!</h3>
                    <p className="text-gray-300">Redirecting to verification...</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'verification-prompt':
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Account Created Successfully!</h3>
                <p className="text-gray-300">
                  Welcome to SafePlay! Your account has been set up and is ready to use.
                </p>
              </div>
              
              {selectedPlan && (
                <div className="bg-green-900/30 border border-green-400/20 rounded-lg p-4">
                  <p className="text-green-100">
                    <strong>Plan:</strong> {selectedPlan.name}
                    {/* 🔧 SUCCESS MESSAGE FIX v1.5.6: Only show trial badge for paid plans, not FREE plans */}
                    {selectedPlan.planType === 'FREE' ? (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                        No credit card required!
                      </Badge>
                    ) : selectedPlan.billingInterval !== 'lifetime' ? (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                        7 day free trial
                      </Badge>
                    ) : null}
                  </p>
                </div>
              )}

              <div className="space-y-3 mt-8">
                <Button 
                  onClick={() => {
                    setCurrentStep('complete');
                  }}
                  className="w-full btn-primary"
                >
                  Continue to Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/verification')}
                  className="w-full text-blue-400 hover:text-blue-300"
                >
                  Complete Identity Verification
                </Button>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to SafePlay!</h3>
                <p className="text-gray-300">
                  Your account is ready. You can now start using SafePlay to keep your children safe.
                </p>
              </div>

              <Button 
                onClick={() => {
                  if (formData.role === 'PARENT') {
                    router.push('/parent');
                  } else {
                    router.push('/venue-admin');
                  }
                }}
                className="w-full btn-primary"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Navigation Header */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <div className="relative w-16 h-16">
                <Image
                  src="https://mysafeplay.ai/logos/safeplay_combined_logo5.png"
                  alt="SafePlay"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link href="/safety" className="text-white/80 hover:text-white transition-colors">
                Safety Features
              </Link>
              <Link href="/memory-features" className="text-white/80 hover:text-white transition-colors">
                Memory Features
              </Link>
              <Link href="/auth/signin" className="text-white/80 hover:text-white transition-colors">
                Sign In
              </Link>
              <Button 
                variant="outline" 
                className="border-white/30 text-white/50 bg-white/5 cursor-not-allowed"
                disabled
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 pt-8">
        <div className="w-full max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-white">Create Your Account</h2>
            <span className="text-sm text-gray-300">
              Step {getCurrentStepIndex() + 1} of {steps.length}
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index <= getCurrentStepIndex() 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xs text-gray-400 mt-1 text-center max-w-20">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
