
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Building, Baby, AlertTriangle, ExternalLink, Clock } from "lucide-react";

interface AccessResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
  sessionInfo?: any;
}

export default function EmergencyAccessPage() {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [result, setResult] = useState<AccessResult | null>(null);

  const accessOptions = [
    {
      role: 'COMPANY_ADMIN',
      title: 'Company Admin Dashboard',
      description: 'Full administrative access to system settings, analytics, and user management',
      icon: Shield,
      color: 'bg-red-500',
      dashboardUrl: '/admin',
      demoUser: 'admin@mysafeplay.ai'
    },
    {
      role: 'VENUE_ADMIN', 
      title: 'Venue Admin Dashboard',
      description: 'Venue management, camera monitoring, zone configuration, and child tracking',
      icon: Building,
      color: 'bg-blue-500',
      dashboardUrl: '/venue-admin',
      demoUser: 'venue@mysafeplay.ai'
    },
    {
      role: 'PARENT',
      title: 'Parent Dashboard',
      description: 'Child monitoring, photo access, location tracking, and family management',
      icon: Baby,
      color: 'bg-green-500',
      dashboardUrl: '/parent',
      demoUser: 'parent@mysafeplay.ai'
    }
  ];

  const handleEmergencyAccess = async (role: string, dashboardUrl: string) => {
    setIsCreatingSession(true);
    setResult(null);

    try {
      const response = await fetch('/api/demo-diagnostics/emergency-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role,
          dashboardUrl
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: `Emergency session created for ${role}`,
          redirectUrl: dashboardUrl,
          sessionInfo: data.session
        });
        
        // Redirect after short delay to show success message
        setTimeout(() => {
          window.location.href = dashboardUrl;
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create emergency session'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Network error creating session'
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDirectAccess = (dashboardUrl: string) => {
    // Direct access without session creation - useful for testing UI
    window.location.href = dashboardUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emergency Access Portal</h1>
          <p className="text-gray-600 mt-2">
            Bypass authentication and access different user dashboards directly for testing purposes.
          </p>
        </div>

        {/* Warning */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Emergency Use Only:</strong> This portal bypasses normal authentication and should only be used for testing when login is not working. Sessions created here are temporary.
          </AlertDescription>
        </Alert>

        {/* Access Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accessOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Card key={option.role} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full ${option.color} mx-auto mb-3 flex items-center justify-center`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                  <Badge variant="outline" className="mt-2 w-fit mx-auto">
                    {option.demoUser}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleEmergencyAccess(option.role, option.dashboardUrl)}
                    disabled={isCreatingSession}
                    className="w-full"
                  >
                    {isCreatingSession ? (
                      "Creating Session..."
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Create Session & Access
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleDirectAccess(option.dashboardUrl)}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Direct Access (No Session)
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Result Display */}
        {result && (
          <Card>
            <CardContent className="p-4">
              <Alert className={`${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  <strong>{result.success ? 'Success!' : 'Error:'}</strong> {result.message}
                  {result.success && result.redirectUrl && (
                    <div className="mt-2 flex items-center text-green-700">
                      <Clock className="h-4 w-4 mr-1" />
                      Redirecting to {result.redirectUrl} in 2 seconds...
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              
              {result.sessionInfo && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                  <p className="font-mono">Session Info: {JSON.stringify(result.sessionInfo, null, 2)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alternative Access Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Alternative Access Methods</CardTitle>
            <CardDescription>
              If emergency session creation fails, try these direct links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4">
                <a href="/admin" className="block text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2" />
                  <div>Company Admin</div>
                  <div className="text-xs opacity-75">/admin</div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4">
                <a href="/venue-admin" className="block text-center">
                  <Building className="h-6 w-6 mx-auto mb-2" />
                  <div>Venue Admin</div>
                  <div className="text-xs opacity-75">/venue-admin</div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4">
                <a href="/parent" className="block text-center">
                  <Baby className="h-6 w-6 mx-auto mb-2" />
                  <div>Parent Dashboard</div>
                  <div className="text-xs opacity-75">/parent</div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Tools</CardTitle>
            <CardDescription>
              Additional tools to diagnose and fix authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto p-3">
                <a href="/demo-status" className="block text-center">
                  <User className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm">Demo Status</div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-3">
                <a href="/force-create-demo" className="block text-center">
                  <Shield className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm">Force Create</div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-3">
                <a href="/test-login" className="block text-center">
                  <ExternalLink className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm">Test Login</div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-3">
                <a href="/auth/signin" className="block text-center">
                  <User className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm">Official Login</div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use Emergency Access</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li><strong>Create Session & Access:</strong> Creates a temporary session and redirects you to the dashboard. This provides the most complete experience.</li>
              <li><strong>Direct Access:</strong> Goes directly to the dashboard without creating a session. Some features may not work without authentication.</li>
              <li><strong>Alternative Links:</strong> Use these if the emergency session creation fails completely.</li>
              <li><strong>Diagnostic Tools:</strong> Use these to understand and fix the underlying authentication issues.</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm">
                <strong>Recommended workflow:</strong> Try "Create Session & Access" first. If that fails, use "Direct Access" to test the UI, then use the diagnostic tools to fix the authentication issue.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
