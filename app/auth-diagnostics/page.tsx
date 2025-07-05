
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Shield, Settings, User } from "lucide-react";

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface CompleteDiagnostic {
  overallStatus: 'healthy' | 'issues' | 'critical';
  summary: string;
  results: DiagnosticResult[];
  recommendations: string[];
}

export default function AuthDiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostic, setDiagnostic] = useState<CompleteDiagnostic | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runCompleteDiagnostic = async () => {
    setIsRunning(true);
    
    try {
      const response = await fetch('/api/demo-diagnostics/complete-check');
      const data = await response.json();
      setDiagnostic(data);
    } catch (error) {
      setDiagnostic({
        overallStatus: 'critical',
        summary: 'Failed to run diagnostic',
        results: [{
          category: 'System',
          test: 'Diagnostic Execution',
          status: 'fail',
          message: error instanceof Error ? error.message : 'Network error'
        }],
        recommendations: ['Check network connection', 'Verify API endpoints are working']
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runCompleteDiagnostic();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runCompleteDiagnostic, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'issues':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const groupedResults = diagnostic?.results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, DiagnosticResult[]>) || {};

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Database':
        return Database;
      case 'Authentication':
        return Shield;
      case 'Configuration':
        return Settings;
      case 'Demo Accounts':
        return User;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Authentication Diagnostics</h1>
            <p className="text-gray-600 mt-2">Complete health check for the authentication system</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button onClick={runCompleteDiagnostic} disabled={isRunning}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Run Diagnostic
            </Button>
          </div>
        </div>

        {isRunning && !diagnostic && (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-lg font-medium">Running Complete Diagnostic...</p>
              <p className="text-gray-600">This may take a few seconds</p>
            </CardContent>
          </Card>
        )}

        {diagnostic && (
          <>
            {/* Overall Status */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full ${getOverallStatusColor(diagnostic.overallStatus)} flex items-center justify-center`}>
                    {diagnostic.overallStatus === 'healthy' ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : diagnostic.overallStatus === 'issues' ? (
                      <AlertTriangle className="h-6 w-6 text-white" />
                    ) : (
                      <XCircle className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {diagnostic.overallStatus === 'healthy' ? 'System Healthy' : 
                       diagnostic.overallStatus === 'issues' ? 'Issues Detected' : 
                       'Critical Issues'}
                    </h2>
                    <p className="text-gray-600">{diagnostic.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(groupedResults).map(([category, results]) => {
                const CategoryIcon = getCategoryIcon(category);
                const categoryStatus = results.some(r => r.status === 'fail') ? 'fail' : 
                                     results.some(r => r.status === 'warning') ? 'warning' : 'pass';
                
                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CategoryIcon className="h-5 w-5" />
                        <span>{category}</span>
                        {getStatusIcon(categoryStatus)}
                      </CardTitle>
                      <CardDescription>
                        {results.length} test{results.length !== 1 ? 's' : ''} in this category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.map((result, index) => (
                          <div key={index} className={`p-3 border rounded-lg ${getStatusColor(result.status)}`}>
                            <div className="flex items-start space-x-3">
                              {getStatusIcon(result.status)}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{result.test}</p>
                                <p className="text-sm text-gray-700">{result.message}</p>
                                {result.details && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-gray-600 cursor-pointer">Show details</summary>
                                    <pre className="text-xs text-gray-600 mt-1 bg-white/50 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(result.details, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recommendations */}
            {diagnostic.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>
                    Suggested actions to resolve detected issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {diagnostic.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-medium text-orange-600">{index + 1}</span>
                        </div>
                        <p className="text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Tools to address common issues found in diagnostics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild variant="outline" className="h-auto p-3">
                    <a href="/force-create-demo" className="block text-center">
                      <User className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm">Fix Demo Accounts</div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-3">
                    <a href="/test-login" className="block text-center">
                      <Shield className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm">Test Login</div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-3">
                    <a href="/emergency-access" className="block text-center">
                      <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm">Emergency Access</div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-3">
                    <a href="/auth/signin" className="block text-center">
                      <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm">Try Official Login</div>
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
