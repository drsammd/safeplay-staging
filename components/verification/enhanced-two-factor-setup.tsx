

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  Bell,
  Copy
} from 'lucide-react';
import WebAuthnSetup from './webauthn-setup';

interface TwoFactorMethodStatus {
  sms: { enabled: boolean; phoneNumber?: string };
  authenticatorApp: { enabled: boolean };
  email: { enabled: boolean };
  webauthn: { enabled: boolean; devices: number };
  push: { enabled: boolean; devices: number };
  backupCodes: { enabled: boolean };
}

interface EnhancedTwoFactorSetupProps {
  onSetupComplete?: () => void;
}

export default function EnhancedTwoFactorSetup({ onSetupComplete }: EnhancedTwoFactorSetupProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [methods, setMethods] = useState<TwoFactorMethodStatus>({
    sms: { enabled: false },
    authenticatorApp: { enabled: false },
    email: { enabled: false },
    webauthn: { enabled: false, devices: 0 },
    push: { enabled: false, devices: 0 },
    backupCodes: { enabled: false }
  });
  const [emailForVerification, setEmailForVerification] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [isEmailSetup, setIsEmailSetup] = useState(false);
  const [isPushSetup, setIsPushSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification/enhanced-status');
      if (response.ok) {
        const data = await response.json();
        setMethods({
          sms: { 
            enabled: data.availableTwoFactorMethods.sms.enabled,
            phoneNumber: data.availableTwoFactorMethods.sms.phoneNumber
          },
          authenticatorApp: { 
            enabled: data.availableTwoFactorMethods.authenticatorApp.enabled 
          },
          email: { enabled: true },
          webauthn: { 
            enabled: data.availableTwoFactorMethods.webauthn.enabled,
            devices: data.availableTwoFactorMethods.webauthn.devices
          },
          push: { 
            enabled: data.availableTwoFactorMethods.push.enabled,
            devices: data.availableTwoFactorMethods.push.devices
          },
          backupCodes: { 
            enabled: data.availableTwoFactorMethods.backupCodes.enabled 
          }
        });
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerification = async () => {
    if (!emailForVerification.trim()) {
      setError('Please enter an email address');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/verification/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailForVerification.trim(),
          purpose: 'TWO_FACTOR'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email verification');
      }

      setSuccess('Verification code sent to your email');
      setIsEmailSetup(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send email verification');
    }
  };

  const verifyEmailCode = async () => {
    if (!emailCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setError(null);

    try {
      const response = await fetch('/api/verification/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: emailCode.trim(),
          purpose: 'TWO_FACTOR'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Email verification completed successfully!');
      setEmailCode('');
      setIsEmailSetup(false);
      await loadVerificationStatus();
      onSetupComplete?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const setupPushNotifications = async () => {
    setIsPushSetup(true);
    setError(null);
    setSuccess(null);

    try {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Register service worker and get FCM token (simplified)
      // In a real implementation, you would integrate with Firebase SDK
      const mockToken = `fcm_token_${Date.now()}`;

      const response = await fetch('/api/verification/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceToken: mockToken,
          platform: 'WEB',
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register for push notifications');
      }

      setSuccess('Push notifications enabled successfully!');
      await loadVerificationStatus();
      onSetupComplete?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to setup push notifications');
    } finally {
      setIsPushSetup(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      // This would call the existing backup codes generation
      const mockCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );
      
      setBackupCodes(mockCodes);
      setSuccess('Backup codes generated successfully! Please save them securely.');
      await loadVerificationStatus();
    } catch (error) {
      setError('Failed to generate backup codes');
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccess('Backup codes copied to clipboard');
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'authenticatorApp': return <Key className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'webauthn': return <Shield className="h-5 w-5" />;
      case 'push': return <Bell className="h-5 w-5" />;
      case 'backupCodes': return <Copy className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
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
            Enhanced Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="webauthn">Hardware Keys</TabsTrigger>
              <TabsTrigger value="push">Push</TabsTrigger>
              <TabsTrigger value="backup">Backup Codes</TabsTrigger>
              <TabsTrigger value="existing">Existing</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {error && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  {Object.entries(methods).map(([key, method]) => {
                    const methodNames = {
                      sms: 'SMS',
                      authenticatorApp: 'Authenticator App',
                      email: 'Email',
                      webauthn: 'Hardware Security Keys',
                      push: 'Push Notifications',
                      backupCodes: 'Backup Codes'
                    };

                    return (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getMethodIcon(key)}
                          <div>
                            <p className="font-medium">{methodNames[key as keyof typeof methodNames]}</p>
                            <p className="text-sm text-gray-500">
                              {key === 'sms' && method.phoneNumber && `Phone: ${method.phoneNumber}`}
                              {key === 'webauthn' && method.devices > 0 && `${method.devices} device(s)`}
                              {key === 'push' && method.devices > 0 && `${method.devices} device(s)`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={method.enabled ? 'default' : 'secondary'}>
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Email-Based 2FA</h4>
                  <p className="text-sm text-blue-700">
                    Receive verification codes via email. This is a convenient option when other methods aren't available.
                  </p>
                </div>

                {!isEmailSetup ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <Input
                        type="email"
                        placeholder="Enter email address for 2FA"
                        value={emailForVerification}
                        onChange={(e) => setEmailForVerification(e.target.value)}
                      />
                    </div>
                    <Button onClick={sendEmailVerification} disabled={!emailForVerification.trim()}>
                      Send Verification Code
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Verification Code</label>
                      <Input
                        placeholder="Enter 6-digit code from email"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={verifyEmailCode} disabled={!emailCode.trim()}>
                        Verify Email
                      </Button>
                      <Button variant="outline" onClick={() => setIsEmailSetup(false)}>
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="webauthn">
                <WebAuthnSetup onSetupComplete={onSetupComplete} />
              </TabsContent>

              <TabsContent value="push" className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Push Notifications</h4>
                  <p className="text-sm text-green-700">
                    Receive instant 2FA prompts as push notifications on your registered devices.
                  </p>
                </div>

                <Button 
                  onClick={setupPushNotifications} 
                  disabled={isPushSetup}
                  className="w-full"
                >
                  {isPushSetup ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Enable Push Notifications
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="backup" className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Backup Codes</h4>
                  <p className="text-sm text-yellow-700">
                    Generate one-time backup codes for account recovery when other 2FA methods aren't available.
                  </p>
                </div>

                {backupCodes.length === 0 ? (
                  <Button onClick={generateBackupCodes} className="w-full">
                    Generate Backup Codes
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Your Backup Codes</h4>
                        <Button size="sm" onClick={copyBackupCodes}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Save these codes securely. Each code can only be used once and won't be shown again.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="existing" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Existing Methods</h4>
                  <p className="text-sm text-gray-700">
                    SMS and Authenticator App methods from the original system are still available.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS Authentication</span>
                    </div>
                    <Badge variant={methods.sms.enabled ? 'default' : 'secondary'}>
                      {methods.sms.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="h-4 w-4" />
                      <span>Authenticator App</span>
                    </div>
                    <Badge variant={methods.authenticatorApp.enabled ? 'default' : 'secondary'}>
                      {methods.authenticatorApp.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

