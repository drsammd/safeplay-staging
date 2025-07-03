
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StagingAuthPage() {
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/staging-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          rememberMe
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Small delay for better UX
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      } else {
        setError(data.message || 'Invalid password. Please try again.');
        setAttempts(prev => prev + 1);
        setPassword("");
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Security Headers Notice */}
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta httpEquiv="X-Robots-Tag" content="noindex, nofollow" />
      </head>
      
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Image
              src="/logos/safeplay_combined_logo5.png"
              alt="SafePlay"
              width={80}
              height={80}
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">mySafePlay™</h1>
          <p className="text-gray-600">Stakeholder Access Portal</p>
        </div>

        {/* Main Authentication Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Beta Environment Access
            </CardTitle>
            <CardDescription className="text-gray-600">
              This is a secure staging environment for authorized stakeholders only.
              Please enter your access credentials to continue.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Notice */}
            <Alert className="border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                <strong>Confidential:</strong> This environment contains pre-release features. 
                Please do not share access credentials or discuss features publicly.
              </AlertDescription>
            </Alert>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Rate Limit Warning */}
            {attempts >= 3 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  Multiple failed attempts detected. Please verify your credentials.
                </AlertDescription>
              </Alert>
            )}

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Access Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter stakeholder password"
                    className="pr-10 h-12 text-lg"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Access mySafePlay™</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Help Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Need access credentials?
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                  <Mail className="h-4 w-4" />
                  <span>Contact your project manager</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 mySafePlay™. Secure Beta Environment v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Protected by enterprise-grade security measures
          </p>
        </div>
      </div>
    </div>
  );
}
