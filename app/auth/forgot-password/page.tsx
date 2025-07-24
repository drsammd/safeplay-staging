
/**
 * SafePlay Forgot Password Page v1.5.40-alpha.13
 * 
 * FIXES:
 * - Creates missing forgot-password route to resolve 404 errors
 * - Provides professional password reset functionality
 * - Integrates with existing auth system design
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEmailSent(true);
      } else {
        setError(data.error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-auth bg-overlay-dark">
        <div className="content-overlay">
          <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
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
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Check Your Email
                </h2>
                <p className="text-gray-300">
                  We've sent password reset instructions to your email address.
                </p>
              </div>

              {/* Content */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <div className="text-center space-y-4">
                  <p className="text-white">
                    If an account with <strong>{email}</strong> exists, you'll receive an email with instructions to reset your password.
                  </p>
                  <p className="text-gray-300 text-sm">
                    Didn't receive the email? Check your spam folder or try again with a different email address.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <Button
                    onClick={() => {
                      setIsEmailSent(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Try Different Email
                  </Button>
                  
                  <Link href="/auth/signin">
                    <Button className="w-full btn-primary">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Back to Home */}
              <div className="text-center">
                <Link href="/" className="text-gray-400 hover:text-white text-sm">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-auth bg-overlay-dark">
      <div className="content-overlay">
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
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
              <h2 className="text-3xl font-bold text-white mb-2">
                Forgot Password
              </h2>
              <p className="text-gray-300">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            {/* Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              {error && (
                <Alert className="mb-6 bg-red-500/10 border-red-500/20">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/signin" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Link href="/" className="text-gray-400 hover:text-white text-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
