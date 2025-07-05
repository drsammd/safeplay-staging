
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Database, Shield, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface DemoAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  passwordHash: string;
}

interface SystemStatus {
  totalUsers: number;
  demoAccounts: DemoAccount[];
  databaseConnected: boolean;
  authConfigured: boolean;
  lastCheck: string;
}

export default function DemoStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/demo-diagnostics/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Network error fetching status');
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getRoleBadge = (role: string) => {
    const colors = {
      COMPANY_ADMIN: 'bg-red-500',
      VENUE_ADMIN: 'bg-blue-500', 
      PARENT: 'bg-green-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg">Loading demo status...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SafePlay Demo Status</h1>
            <p className="text-gray-600 mt-2">Real-time diagnostic information for demo accounts and authentication</p>
          </div>
          <Button onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-700">
                <XCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {status && (
          <>
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Database</p>
                      <div className="flex items-center">
                        {status.databaseConnected ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <p className="text-sm text-gray-900">
                          {status.databaseConnected ? 'Connected' : 'Disconnected'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Authentication</p>
                      <div className="flex items-center">
                        {status.authConfigured ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <p className="text-sm text-gray-900">
                          {status.authConfigured ? 'Configured' : 'Not Configured'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{status.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Last Check</p>
                      <p className="text-sm text-gray-900">{new Date(status.lastCheck).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Demo Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Demo Accounts ({status.demoAccounts.length})
                </CardTitle>
                <CardDescription>
                  Current demo accounts available for testing. These should work for login.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status.demoAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-900">No Demo Accounts Found</p>
                    <p className="text-gray-600">Demo accounts need to be created for testing.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {status.demoAccounts.map((account) => (
                      <div key={account.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium text-gray-900">{account.name}</p>
                              <p className="text-sm text-gray-600">{account.email}</p>
                              <p className="text-xs text-gray-500">Created: {new Date(account.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getRoleBadge(account.role)} text-white`}>
                              {account.role.replace('_', ' ')}
                            </Badge>
                            {account.twoFactorEnabled && (
                              <Badge variant="outline" className="text-orange-600">
                                2FA Enabled
                              </Badge>
                            )}
                            {account.phoneVerified && (
                              <Badge variant="outline" className="text-green-600">
                                Phone Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                          <p className="font-mono">Password Hash: {account.passwordHash.substring(0, 60)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Tools to diagnose and fix demo account issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button asChild className="h-auto p-4">
                    <a href="/force-create-demo" className="block text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2" />
                      <div>Force Create Demo Accounts</div>
                      <div className="text-xs opacity-75">Recreate all demo accounts</div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <a href="/test-login" className="block text-center">
                      <User className="h-8 w-8 mx-auto mb-2" />
                      <div>Test Login Page</div>
                      <div className="text-xs opacity-75">Simple authentication test</div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <a href="/emergency-access" className="block text-center">
                      <Database className="h-8 w-8 mx-auto mb-2" />
                      <div>Emergency Access</div>
                      <div className="text-xs opacity-75">Direct dashboard access</div>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
