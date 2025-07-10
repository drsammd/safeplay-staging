
"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, User, Mail, Lock, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'credentials' | 'two-factor'>('credentials');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'SMS' | 'AUTHENTICATOR_APP' | 'BACKUP_CODE'>('SMS');
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    twoFactorCode: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userRequires2FA, setUserRequires2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check for messages from URL params and handle auto-login
  useEffect(() => {
    const message = searchParams.get('message');
    const errorParam = searchParams.get('error');
    const autoLogin = searchParams.get('auto');
    const autoToken = searchParams.get('token');
    
    if (message) {
      // You could show a success toast here
    }
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // Handle auto-login from staging auth
    if (autoLogin === 'true' && autoToken) {
      console.log('🔄 Auto-login detected, attempting automatic authentication...');
      handleAutoLogin(autoToken);
    }
  }, [searchParams]);

  const handleAutoLogin = async (token: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log('🔄 Checking for demo session data...');
      
      // Check if demo session data exists from staging auth
      const demoSessionData = sessionStorage.getItem('mySafePlay_demoSession');
      const demoUserData = sessionStorage.getItem('mySafePlay_demoUser');
      
      if (demoSessionData && demoUserData) {
        const demoSession = JSON.parse(demoSessionData);
        const demoUser = JSON.parse(demoUserData);
        
        console.log('✅ Demo session found, auto-signing in as:', demoUser.email);
        
        // Use known demo credentials based on the user
        let demoPassword = 'demo123'; // Default demo password
        
        // Set specific passwords for known demo accounts
        if (demoUser.email === 'john@doe.com') {
          demoPassword = 'johndoe123';
        } else if (demoUser.email === 'venue@mysafeplay.ai') {
          demoPassword = 'venue123';
        } else if (demoUser.email === 'parent@mysafeplay.ai') {
          demoPassword = 'parent123';
        }
        
        // Attempt auto-signin with demo credentials
        const result = await signIn("credentials", {
          email: demoUser.email,
          password: demoPassword,
          redirect: false,
        });

        if (result?.error) {
          console.error('❌ Auto-signin failed with demo credentials:', result.error);
          // Fall back to manual login
          setError('Auto-login failed. Please enter your credentials manually.');
        } else if (result?.ok) {
          console.log('✅ Auto-signin successful, redirecting...');
          const session = await getSession();
          
          // Clear demo session storage since we're now properly authenticated
          sessionStorage.removeItem('mySafePlay_demoSession');
          sessionStorage.removeItem('mySafePlay_demoUser');
          sessionStorage.removeItem('mySafePlay_demoMode');
          
          // Redirect based on user role
          if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'COMPANY_ADMIN') {
            router.push('/admin');
          } else if (session?.user?.role === 'VENUE_ADMIN') {
            router.push('/venue-admin');
          } else {
            router.push('/parent');
          }
        }
      } else {
        console.log('❌ No demo session data found, falling back to manual login');
        setError('Auto-login session not found. Please enter your credentials manually.');
      }
    } catch (error) {
      console.error('❌ Auto-signin error:', error);
      setError('Auto-login failed. Please enter your credentials manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Check if user requires 2FA first without signing in
      const checkResponse = await fetch('/api/auth/check-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.success) {
        setError(checkData.error || 'Invalid email or password');
        return;
      }

      if (checkData.requires2FA) {
        // User has 2FA enabled, need to proceed to 2FA step
        setUserRequires2FA(true);
        setUserId(checkData.userId);
        setStep('two-factor');
        // Send SMS 2FA code automatically if user has SMS 2FA
        await sendSMS2FACode();
      } else {
        // User doesn't have 2FA, proceed with normal sign in
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
        } else if (result?.ok) {
          // Successful login without 2FA
          const session = await getSession();
          
          // Redirect based on user role
          if (session?.user?.role === 'SUPER_ADMIN') {
            router.push('/admin');
          } else if (session?.user?.role === 'VENUE_ADMIN') {
            router.push('/venue-admin');
          } else {
            router.push('/parent');
          }
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendSMS2FACode = async () => {
    try {
      const response = await fetch('/api/verification/two-factor/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose: 'LOGIN'
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to send 2FA code:', data.error);
      }
    } catch (error) {
      console.error('Error sending 2FA code:', error);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Verify 2FA code
      const response = await fetch('/api/verification/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.twoFactorCode,
          method: twoFactorMethod,
          purpose: 'LOGIN'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 2FA successful, complete the login
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          twoFactorVerified: 'true',
          redirect: false,
        });

        if (result?.ok) {
          const session = await getSession();
          
          // Redirect based on user role
          if (session?.user?.role === 'SUPER_ADMIN') {
            router.push('/admin');
          } else if (session?.user?.role === 'VENUE_ADMIN') {
            router.push('/venue-admin');
          } else {
            router.push('/parent');
          }
        } else {
          setError("Login failed after 2FA verification");
        }
      } else {
        setError(data.error || 'Invalid 2FA code');
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSMS = async () => {
    setIsLoading(true);
    await sendSMS2FACode();
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
                {step === 'credentials' ? 'Welcome Back' : 'Two-Factor Authentication'}
              </h2>
              <p className="text-gray-300">
                {step === 'credentials' 
                  ? 'Sign in to your SafePlay account'
                  : 'Enter your 2FA code to complete login'
                }
              </p>
            </div>

            {/* Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}

              {step === 'credentials' ? (
                <form className="space-y-6" onSubmit={handleCredentialsSubmit}>
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
                        placeholder="Enter your password"
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-white text-sm">
                      We've sent a verification code to your registered device.
                    </p>
                  </div>

                  <Tabs value={twoFactorMethod} onValueChange={(value) => setTwoFactorMethod(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="SMS">SMS</TabsTrigger>
                      <TabsTrigger value="AUTHENTICATOR_APP">App</TabsTrigger>
                      <TabsTrigger value="BACKUP_CODE">Backup</TabsTrigger>
                    </TabsList>

                    <TabsContent value="SMS" className="space-y-4">
                      <form onSubmit={handleTwoFactorSubmit}>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            SMS Verification Code
                          </label>
                          <Input
                            name="twoFactorCode"
                            value={formData.twoFactorCode}
                            onChange={handleInputChange}
                            placeholder="Enter 6-digit code"
                            className="text-center text-lg tracking-widest bg-white/5 border-white/20 text-white"
                            maxLength={6}
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={isLoading || formData.twoFactorCode.length !== 6}
                          className="w-full mt-4"
                        >
                          {isLoading ? "Verifying..." : "Verify Code"}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleResendSMS}
                          disabled={isLoading}
                          className="w-full mt-2 text-white hover:bg-white/10"
                        >
                          Resend SMS Code
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="AUTHENTICATOR_APP" className="space-y-4">
                      <form onSubmit={handleTwoFactorSubmit}>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Authenticator Code
                          </label>
                          <Input
                            name="twoFactorCode"
                            value={formData.twoFactorCode}
                            onChange={handleInputChange}
                            placeholder="Enter 6-digit code"
                            className="text-center text-lg tracking-widest bg-white/5 border-white/20 text-white"
                            maxLength={6}
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={isLoading || formData.twoFactorCode.length !== 6}
                          className="w-full mt-4"
                        >
                          {isLoading ? "Verifying..." : "Verify Code"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="BACKUP_CODE" className="space-y-4">
                      <form onSubmit={handleTwoFactorSubmit}>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Backup Code
                          </label>
                          <Input
                            name="twoFactorCode"
                            value={formData.twoFactorCode}
                            onChange={handleInputChange}
                            placeholder="Enter backup code"
                            className="text-center bg-white/5 border-white/20 text-white"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Each backup code can only be used once
                          </p>
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={isLoading || !formData.twoFactorCode.trim()}
                          className="w-full mt-4"
                        >
                          {isLoading ? "Verifying..." : "Verify Backup Code"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <Button
                    variant="ghost"
                    onClick={() => setStep('credentials')}
                    className="w-full text-white hover:bg-white/10"
                  >
                    ← Back to Login
                  </Button>
                </div>
              )}

              {/* Links */}
              <div className="mt-6 space-y-4">
                {step === 'credentials' && (
                  <>
                    <div className="text-center">
                      <Link href="/auth/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                        Forgot your password?
                      </Link>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-gray-300">
                        Don't have an account?{" "}
                        <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                          Sign up here
                        </Link>
                      </p>
                    </div>
                  </>
                )}
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
