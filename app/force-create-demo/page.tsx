
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, User, RefreshCw, CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";

interface CreationResult {
  email: string;
  name: string;
  role: string;
  password: string;
  success: boolean;
  error?: string;
}

interface CreationResponse {
  success: boolean;
  results: CreationResult[];
  deletedCount: number;
  error?: string;
}

export default function ForceCreateDemoPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<CreationResponse | null>(null);

  const demoAccounts = [
    { email: 'admin@mysafeplay.ai', name: 'Admin User', role: 'COMPANY_ADMIN', password: 'password123' },
    { email: 'venue@mysafeplay.ai', name: 'Venue Administrator', role: 'VENUE_ADMIN', password: 'password123' },
    { email: 'parent@mysafeplay.ai', name: 'Parent User', role: 'PARENT', password: 'password123' },
    { email: 'john@mysafeplay.ai', name: 'John Doe', role: 'COMPANY_ADMIN', password: 'johndoe123' }
  ];

  const handleCreateAccounts = async () => {
    setIsCreating(true);
    setResult(null);

    try {
      const response = await fetch('/api/demo-diagnostics/force-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accounts: demoAccounts })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        results: [],
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Network error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      COMPANY_ADMIN: 'bg-red-500',
      VENUE_ADMIN: 'bg-blue-500', 
      PARENT: 'bg-green-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Force Create Demo Accounts</h1>
          <p className="text-gray-600 mt-2">
            This tool will delete any existing demo accounts and create fresh ones with known passwords.
          </p>
        </div>

        {/* Warning */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Warning:</strong> This will permanently delete any existing demo accounts and create new ones. 
            Use this only when demo credentials are not working.
          </AlertDescription>
        </Alert>

        {/* Accounts to Create */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Demo Accounts to Create
            </CardTitle>
            <CardDescription>
              These accounts will be created with the specified credentials for testing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoAccounts.map((account) => (
                <div key={account.email} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-600">{account.email}</p>
                    <p className="text-xs text-gray-500 font-mono">Password: {account.password}</p>
                  </div>
                  <Badge className={`${getRoleBadge(account.role)} text-white`}>
                    {account.role.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Button 
                onClick={handleCreateAccounts} 
                disabled={isCreating}
                size="lg"
                className="w-full md:w-auto"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Demo Accounts...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Force Create Demo Accounts
                  </>
                )}
              </Button>
              
              {!isCreating && (
                <p className="text-sm text-gray-600 mt-2">
                  This process takes a few seconds to complete
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2 text-red-600" />
                )}
                Creation Results
              </CardTitle>
              <CardDescription>
                {result.success 
                  ? `Successfully processed demo accounts. Deleted ${result.deletedCount} existing accounts.`
                  : 'There were errors creating demo accounts.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Error:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {result.results.map((accountResult) => (
                  <div key={accountResult.email} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{accountResult.name}</p>
                      <p className="text-sm text-gray-600">{accountResult.email}</p>
                      {accountResult.success && (
                        <p className="text-xs text-gray-500 font-mono">Password: {accountResult.password}</p>
                      )}
                      {accountResult.error && (
                        <p className="text-xs text-red-600">Error: {accountResult.error}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getRoleBadge(accountResult.role)} text-white`}>
                        {accountResult.role.replace('_', ' ')}
                      </Badge>
                      {accountResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.success && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Demo Accounts Ready!</h4>
                  <p className="text-green-700 text-sm mb-3">
                    You can now test login with these credentials:
                  </p>
                  <div className="space-y-1 text-sm font-mono text-green-700">
                    {result.results.filter(r => r.success).map(account => (
                      <p key={account.email}>
                        {account.email} / {account.password}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 space-x-2">
                    <Button asChild size="sm">
                      <a href="/auth/signin">Test Login Now</a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href="/demo-status">Check Status</a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <a href="/demo-status">← Back to Demo Status</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/test-login">Test Login Page →</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
