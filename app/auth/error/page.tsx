
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; 
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
  Signin: "Try signing in with a different account.", 
  OAuthSignin: "Try signing in with a different account.",
  OAuthCallback: "Try signing in with a different account.",
  OAuthCreateAccount: "Try signing in with a different account.",
  EmailCreateAccount: "Try signing in with a different account.",
  Callback: "Try signing in with a different account.",
  OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "The email could not be sent.",
  CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
  SessionRequired: "Please sign in to access this page.",
  "2FA_REQUIRED": "Two-factor authentication is required for your account."
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const errorParam = searchParams?.get("error");
    setError(errorParam || "Default");
  }, [searchParams]);

  const getErrorMessage = (error: string): string => {
    return errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;
  };

  const getErrorTitle = (error: string): string => {
    switch (error) {
      case "2FA_REQUIRED":
        return "Two-Factor Authentication Required";
      case "AccessDenied":
        return "Access Denied";
      case "Configuration":
        return "Configuration Error";
      case "Verification":
        return "Verification Error";
      case "CredentialsSignin":
        return "Sign In Failed";
      default:
        return "Authentication Error";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/backgrounds/auth_bg.png')] bg-cover bg-center opacity-30"></div>
      
      <div className="relative w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {getErrorTitle(error)}
            </CardTitle>
            <CardDescription className="text-gray-600">
              We encountered an issue during authentication
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>

            {error === "2FA_REQUIRED" && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  Please return to the sign-in page and complete the two-factor authentication process.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/signin">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && error && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600 font-mono">
                  Debug Info: {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
