
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Phone, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PhoneVerificationProps {
  currentPhone?: string;
  isVerified?: boolean;
  onVerificationComplete?: (phoneNumber: string) => void;
}

export function PhoneVerification({ 
  currentPhone, 
  isVerified = false, 
  onVerificationComplete 
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const { toast } = useToast();

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/phone/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationId(data.verificationId);
        setStep('verify');
        toast({
          title: "Verification code sent",
          description: "Please check your phone for the verification code.",
        });
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/phone/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Phone verified successfully",
          description: "Your phone number has been verified.",
        });
        onVerificationComplete?.(phoneNumber);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    await handleSendCode();
  };

  if (isVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Verification
            <Badge variant="success" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </CardTitle>
          <CardDescription>
            Your phone number is verified and secured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Phone: {currentPhone}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Phone Verification
          <Badge variant="outline" className="ml-auto">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        </CardTitle>
        <CardDescription>
          Verify your phone number to enhance account security and enable SMS notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'input' ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US numbers)
              </p>
            </div>
            <Button 
              onClick={handleSendCode}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full text-center text-lg tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep('input')}
                disabled={isLoading}
                className="flex-1"
              >
                Change Number
              </Button>
              <Button 
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full text-sm"
            >
              Didn't receive the code? Resend
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
