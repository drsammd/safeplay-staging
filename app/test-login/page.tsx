
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, User, Lock, CheckCircle, XCircle, AlertTriangle, Database } from "lucide-react";

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'info';
  message: string;
  data?: any;
}

interface AuthTestResponse {
  success: boolean;
  user?: any;
  steps: TestResult[];
  error?: string;
}

export default function TestLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuthTestResponse | null>(null);

  const quickTestAccounts = [
    { email: 'admin@mysafeplay.ai', password: 'password123', role: 'COMPANY_ADMIN' },
    { email: 'venue@mysafeplay.ai', password: 'password123', role: 'VENUE_ADMIN' },
    { email: 'parent@mysafeplay.ai', password: 'password123', role: 'PARENT' },
    { email: 'john@mysafeplay.ai', password: 'johndoe123', role: 'COMPANY_ADMIN' }
  ];

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/demo-diagnostics/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password 
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        steps: [{
          step: 'Network Error',
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to connect to test endpoint'
        }],
        error: 'Network error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTest = (account: typeof quickTestAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Login (Direct Database)</h1>
          <p className="text-gray-600 mt-2">
            This tool tests authentication directly against the database, bypassing NextAuth complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Test Credentials
              </CardTitle>
              <CardDescription>
                Enter credentials to test authentication step-by-step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestLogin} className="space-y-4">
                <div>
                  <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="test-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to test"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="test-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="test-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password to test"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Testing Authentication..." : "Test Authentication"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Test Options */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Test Accounts</CardTitle>
              <CardDescription>
                Click to auto-fill credentials for demo accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickTestAccounts.map((account) => (
                  <Button
                    key={account.email}
                    variant="outline"
                    onClick={() => handleQuickTest(account)}
                    className="w-full justify-between h-auto p-3"
                  >
                    <div className="text-left">
                      <p className="font-medium">{account.email}</p>
                      <p className="text-xs text-gray-500 font-mono">{account.password}</p>
                    </div>
                    <Badge variant="secondary">
                      {account.role.replace('_', ' ')}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2 text-red-600" />
                )}
                Authentication Test Results
              </CardTitle>
              <CardDescription>
                Step-by-step breakdown of the authentication process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Overall Result */}
              <Alert className={`mb-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  <strong>{result.success ? 'Authentication Successful!' : 'Authentication Failed'}</strong>
                  {result.error && ` - ${result.error}`}
                </AlertDescription>
              </Alert>

              {/* User Info */}
              {result.success && result.user && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">✅ Authenticated User:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                    <p><strong>Name:</strong> {result.user.name}</p>
                    <p><strong>Email:</strong> {result.user.email}</p>
                    <p><strong>Role:</strong> {result.user.role}</p>
                    <p><strong>ID:</strong> {result.user.id}</p>
                    <p><strong>2FA Enabled:</strong> {result.user.twoFactorEnabled ? 'Yes' : 'No'}</p>
                    <p><strong>Phone Verified:</strong> {result.user.phoneVerified ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}

              {/* Step-by-step results */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Authentication Steps:</h4>
                {result.steps.map((step, index) => (
                  <div key={index} className={`p-3 border rounded-lg ${getStatusColor(step.status)}`}>
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(step.status)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{step.step}</p>
                        <p className="text-sm text-gray-700">{step.message}</p>
                        {step.data && (
                          <pre className="text-xs text-gray-600 mt-1 bg-white/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Steps */}
              {result.success && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">🎉 Ready to Login!</h4>
                  <p className="text-green-700 text-sm mb-3">
                    The credentials work with direct database authentication. Try the official login page:
                  </p>
                  <Button asChild size="sm">
                    <a href="/auth/signin">Go to Official Login Page</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <a href="/demo-status">← Demo Status</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/auth/signin">Official Login →</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
