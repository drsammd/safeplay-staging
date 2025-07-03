

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Usb, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

interface WebAuthnCredential {
  id: string;
  credentialId: string;
  deviceName?: string;
  deviceType?: string;
  lastUsed?: string;
  createdAt: string;
}

interface WebAuthnSetupProps {
  onSetupComplete?: () => void;
}

export default function WebAuthnSetup({ onSetupComplete }: WebAuthnSetupProps) {
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/verification/webauthn/credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || []);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    setIsRegistering(true);
    setError(null);
    setSuccess(null);

    try {
      // Get registration options
      const optionsResponse = await fetch('/api/verification/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: deviceName.trim() })
      });

      if (!optionsResponse.ok) {
        const data = await optionsResponse.json();
        throw new Error(data.error || 'Failed to get registration options');
      }

      const { options } = await optionsResponse.json();

      // Start WebAuthn registration
      const attResp = await startRegistration(options);

      // Verify registration
      const verifyResponse = await fetch('/api/verification/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attResp })
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Registration verification failed');
      }

      const result = await verifyResponse.json();
      setSuccess(`Security key "${result.deviceName}" registered successfully!`);
      setDeviceName('');
      await loadCredentials();
      onSetupComplete?.();

    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setError('Registration was cancelled or not allowed');
      } else if (error.name === 'NotSupportedError') {
        setError('WebAuthn is not supported on this device');
      } else {
        setError(error.message || 'Registration failed');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);
    setSuccess(null);

    try {
      // Get authentication options
      const optionsResponse = await fetch('/api/verification/webauthn/authenticate/options', {
        method: 'POST'
      });

      if (!optionsResponse.ok) {
        const data = await optionsResponse.json();
        throw new Error(data.error || 'Failed to get authentication options');
      }

      const { options } = await optionsResponse.json();

      // Start WebAuthn authentication
      const authResp = await startAuthentication(options);

      // Verify authentication
      const verifyResponse = await fetch('/api/verification/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResp })
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Authentication verification failed');
      }

      const result = await verifyResponse.json();
      setSuccess(`Authentication successful with "${result.deviceName}"!`);

    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setError('Authentication was cancelled or not allowed');
      } else if (error.name === 'NotSupportedError') {
        setError('WebAuthn is not supported on this device');
      } else {
        setError(error.message || 'Authentication failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRemoveCredential = async (credentialId: string) => {
    try {
      const response = await fetch('/api/verification/webauthn/credentials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove credential');
      }

      setSuccess('Security key removed successfully');
      await loadCredentials();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove credential');
    }
  };

  const getDeviceIcon = (deviceName?: string) => {
    if (deviceName?.toLowerCase().includes('phone') || deviceName?.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Usb className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Hardware Security Keys (WebAuthn)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Enhanced Security</h4>
            <p className="text-sm text-blue-700">
              Hardware security keys provide the highest level of security for two-factor authentication.
              They're resistant to phishing and work across all your devices.
            </p>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h4 className="font-medium">Register New Security Key</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter device name (e.g., YubiKey, iPhone Touch ID)"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleRegister}
                disabled={isRegistering || !deviceName.trim()}
              >
                {isRegistering ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Register
                  </>
                )}
              </Button>
            </div>
          </div>

          {credentials.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Registered Security Keys</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    'Test Authentication'
                  )}
                </Button>
              </div>
              
              <div className="space-y-2">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(credential.deviceName)}
                      <div>
                        <p className="font-medium">{credential.deviceName || 'Security Key'}</p>
                        <p className="text-sm text-gray-500">
                          Added {new Date(credential.createdAt).toLocaleDateString()}
                          {credential.lastUsed && (
                            <> • Last used {new Date(credential.lastUsed).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Active</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCredential(credential.credentialId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Browser Support</h4>
            <p className="text-sm text-yellow-700">
              WebAuthn is supported in modern browsers including Chrome, Firefox, Safari, and Edge.
              Make sure your browser is up to date for the best experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

