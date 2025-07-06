
"use client";

import { useState } from "react";
import { Shield, Phone, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SecurityEnhancementPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call for sending verification code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would call an SMS service
      console.log("Sending verification code to:", phoneNumber);
      
      setStep(2);
    } catch (error) {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call for verifying code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would verify the code with the backend
      console.log("Verifying code:", verificationCode);
      
      setIsVerified(true);
      setStep(3);
    } catch (error) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // Redirect back to children page
    router.push("/parent/children");
  };

  return (
    <div className="min-h-full bg-registration bg-overlay-light">
      <div className="content-overlay max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-blue-600" />
              Security Enhancement
            </h1>
            <p className="text-gray-600 mt-1">
              Enhance your account security with phone verification
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Phone Number</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Verification</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step >= 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
              </div>
              <span className="ml-2 text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="card">
          {step === 1 && (
            <div className="text-center">
              <Phone className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Enter Your Phone Number</h2>
              <p className="text-gray-600 mb-6">
                We'll send you a verification code to confirm your phone number and enhance your account security.
              </p>
              
              <div className="max-w-sm mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="input-field w-full text-center"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                
                <button
                  onClick={handleSendCode}
                  disabled={isLoading || !phoneNumber}
                  className="btn-primary w-full mt-4 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <Phone className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Enter Verification Code</h2>
              <p className="text-gray-600 mb-6">
                We've sent a 6-digit verification code to <strong>{phoneNumber}</strong>
              </p>
              
              <div className="max-w-sm mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="input-field w-full text-center text-2xl tracking-widest"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
                
                <button
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="btn-primary w-full mt-4 disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary w-full mt-2"
                >
                  Change Phone Number
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Security Enhanced!</h2>
              <p className="text-gray-600 mb-6">
                Your phone number has been successfully verified. Your account security has been enhanced.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-800 mb-2">Security Features Enabled:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Two-factor authentication</li>
                  <li>✓ SMS security alerts</li>
                  <li>✓ Account recovery via phone</li>
                  <li>✓ Enhanced login protection</li>
                </ul>
              </div>
              
              <button
                onClick={handleComplete}
                className="btn-primary"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your phone number will be kept secure and only used for security purposes.
            You can update or remove it anytime in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
