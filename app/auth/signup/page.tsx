
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, User, Mail, Lock, Building, ArrowRight, ArrowLeft, CheckCircle, MapPin, Home } from "lucide-react";
import SubscriptionPlans from "@/components/subscription/subscription-plans";
import PaymentSetup from "@/components/subscription/payment-setup";
import { AddressAutocomplete } from "@/components/verification/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms of Service to create an account");
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToPrivacy) {
      setError("You must agree to the Privacy Policy to create an account");
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

    // More forgiving validation - allow proceeding with any reasonable address format
    if (homeAddressValidation && !homeAddressValidation.isValid && homeAddressValidation.confidence < 0.1) {
      setError("Please enter a more complete address (include street number, street name, city, state)");
      return;
    }

    // Validate billing address if different billing address is used
    if (formData.useDifferentBillingAddress) {
      if (!formData.billingAddress.trim()) {
        setError("Billing address is required when using a different billing address");
        return;
      }

      if (billingAddressValidation && !billingAddressValidation.isValid && billingAddressValidation.confidence < 0.1) {
        setError("Please enter a more complete billing address (include street number, street name, city, state)");
        return;
      }
    }

    // Proceed to plan selection
    setCurrentStep('plan-selection');
  };

  const handlePlanSelect = (stripePriceId: string, billingInterval: 'monthly' | 'yearly' | 'lifetime', planId: string) => {
    // Fetch plan details from the plans component
    fetch('/api/stripe/plans')
      .then(res => res.json())
      .then(data => {
        const plan = data.plans?.find((p: any) => p.id === planId);
        if (plan) {
          const amount = billingInterval === 'lifetime' ? plan.lifetimePrice : 
                        billingInterval === 'yearly' ? plan.yearlyPrice : 
                        plan.price;
          
          setSelectedPlan({
            id: planId,
            name: plan.name,
            stripePriceId,
            billingInterval,
            amount,
            planType: plan.planType
          });

          // If free plan, skip payment and create account
          if (plan.planType === 'FREE') {
            handleAccountCreation(null);
          } else {
            setCurrentStep('payment-setup');
          }
        }
      })
      .catch(error => {
        console.error('Error fetching plan details:', error);
        setError('Failed to load plan details. Please try again.');
      });
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('complete');
  };

  const handleAccountCreation = async (subscriptionData: any) => {
    setCurrentStep('account-creation');
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          agreeToTerms: formData.agreeToTerms,
          agreeToPrivacy: formData.agreeToPrivacy,
          homeAddress: formData.homeAddress,
          homeAddressValidation: homeAddressValidation,
          useDifferentBillingAddress: formData.useDifferentBillingAddress,
          billingAddress: formData.billingAddress,
          billingAddressValidation: billingAddressValidation,
          selectedPlan: selectedPlan,
          subscriptionData: subscriptionData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

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
      setError(error.message || "Something went wrong. Please try again.");
      setCurrentStep('plan-selection'); // Go back to plan selection on error
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
                {isLoading ? "Validating..." : "Continue to Plan Selection"}
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
                  placeholder="Enter your home address"
                  required
                  countryRestriction={['us', 'ca']}
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This address will be used for identity verification and service delivery
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
                    placeholder="Enter your billing address"
                    required
                    countryRestriction={['us', 'ca']}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This address will be used for billing and payment processing
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
                  disabled={!formData.homeAddress || (homeAddressValidation && !homeAddressValidation.isValid && homeAddressValidation.confidence < 0.1)}
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
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h3>
              <p className="text-gray-300">Select the plan that best fits your needs</p>
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
                Back to Basic Info
              </Button>
            </div>
          </div>
        );

      case 'payment-setup':
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Payment Setup</h3>
              <p className="text-gray-300">Complete your subscription to {selectedPlan?.name}</p>
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
                  Welcome to SafePlay! To unlock all features and enhance your account security, 
                  we recommend completing additional verification steps.
                </p>
              </div>
              
              {selectedPlan && (
                <div className="bg-green-900/30 border border-green-400/20 rounded-lg p-4">
                  <p className="text-green-100">
                    <strong>Plan:</strong> {selectedPlan.name}
                    {selectedPlan.billingInterval !== 'lifetime' && (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                        7 day free trial
                      </Badge>
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-white">Identity Verification</h4>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      Upload your ID for enhanced security and full feature access
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-white border-white/20 hover:bg-white/10"
                      onClick={() => router.push('/verification')}
                    >
                      Complete Verification
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="font-medium text-white">Address Verified</h4>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      Your address has been successfully verified
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-green-400 border-green-400/20 cursor-default"
                      disabled
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </Button>
                  </CardContent>
                </Card>
              </div>

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
                  Complete Identity Verification First
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
                  Your account has been created successfully. You're now ready to start protecting your children.
                </p>
              </div>
              {selectedPlan && (
                <div className="bg-green-900/30 border border-green-400/20 rounded-lg p-4">
                  <p className="text-green-100">
                    <strong>Plan:</strong> {selectedPlan.name}
                    {selectedPlan.billingInterval !== 'lifetime' && (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                        7 day free trial
                      </Badge>
                    )}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    router.push(formData.role === 'VENUE_ADMIN' ? '/venue-admin' : '/parent');
                  }}
                  className="w-full btn-primary"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full text-white border-white/20 hover:bg-white/10"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-auth bg-overlay-dark">
      <div className="content-overlay">
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <Link href="/" className="inline-block mb-8">
                <Image
                  src="/logos/safeplay_combined_logo5.png"
                  alt="SafePlay"
                  width={160}
                  height={53}
                  className="h-12 w-auto mx-auto"
                />
              </Link>
              <h1 className="text-3xl font-bold text-white mb-2">
                {steps[getCurrentStepIndex()]?.title || 'Create Account'}
              </h1>
              <p className="text-gray-300 mb-6">
                {steps[getCurrentStepIndex()]?.description || 'Join SafePlay and start protecting your children'}
              </p>
              
              {/* Progress Bar */}
              <div className="max-w-md mx-auto mb-8">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Step {getCurrentStepIndex() + 1} of {steps.length}</span>
                  <span>{Math.round(getProgressPercentage())}% Complete</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center space-x-2 mb-8">
                {steps.map((step, index) => (
                  <div
                    key={step.key}
                    className={`w-3 h-3 rounded-full ${
                      index <= getCurrentStepIndex() 
                        ? 'bg-blue-500' 
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="relative">
              {renderStepContent()}
            </div>

            {/* Back to Home Link */}
            {currentStep === 'basic-info' && (
              <div className="text-center">
                <Link href="/" className="text-gray-400 hover:text-white text-sm">
                  ← Back to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
