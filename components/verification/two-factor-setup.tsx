
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  Download,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

interface TwoFactorSetupProps {
  isEnabled?: boolean;
  phoneVerified?: boolean;
  currentPhone?: string;
  onSetupComplete?: () => void;
}

export function TwoFactorSetup({ 
  isEnabled = false, 
  phoneVerified = false,
  currentPhone,
  onSetupComplete 
}: TwoFactorSetupProps) {
  const [activeTab, setActiveTab] = useState<'app' | 'sms'>('app');
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Authenticator App Setup
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [appCode, setAppCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // SMS Setup
  const [smsPhone, setSmsPhone] = useState(currentPhone || '');
  const [smsCode, setSmsCode] = useState('');
  const [smsAttemptId, setSmsAttemptId] = useState('');
  
  const { toast } = useToast();

  const handleAppSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/two-factor/setup-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes || []);
        setStep('verify');
      } else {
        setError(data.error || 'Failed to setup authenticator');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppVerification = async () => {
    if (!appCode.trim() || appCode.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/two-factor/verify-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: appCode.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBackupCodes(data.backupCodes || []);
        setStep('backup');
        toast({
          title: "2FA enabled successfully",
          description: "Your account is now protected with two-factor authentication.",
        });
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSMSSetup = async () => {
    if (!smsPhone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/two-factor/setup-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: smsPhone.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "SMS 2FA enabled",
          description: "Two-factor authentication via SMS has been enabled.",
        });
        onSetupComplete?.();
      } else {
        setError(data.error || 'Failed to enable SMS 2FA');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/two-factor/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "2FA disabled",
          description: "Two-factor authentication has been disabled.",
        });
        onSetupComplete?.();
      } else {
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Secret copied",
      description: "The secret key has been copied to your clipboard.",
    });
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({
      title: "Backup codes copied",
      description: "The backup codes have been copied to your clipboard.",
    });
  };

  const downloadBackupCodes = () => {
    const content = `SafePlay Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleDateString()}

Keep these codes safe! Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to log in.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'safeplay-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup codes downloaded",
      description: "Save this file in a secure location.",
    });
  };

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
            <Badge variant="success" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          </CardTitle>
          <CardDescription>
            Your account is protected with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Two-factor authentication is active
            </span>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleDisable2FA}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
          <Badge variant="outline" className="ml-auto">
            <AlertCircle className="h-3 w-3 mr-1" />
            Disabled
          </Badge>
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account with two-factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'app' | 'sms')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="app">
              <Smartphone className="h-4 w-4 mr-2" />
              Authenticator App
            </TabsTrigger>
            <TabsTrigger value="sms" disabled={!phoneVerified}>
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="app" className="space-y-4 mt-4">
            {step === 'setup' && (
              <div className="space-y-4">
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    You'll need an authenticator app like Google Authenticator, Authy, or 1Password to use this method.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handleAppSetup}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Setting up...' : 'Setup Authenticator App'}
                </Button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <h3 className="font-medium">Scan QR Code</h3>
                  <p className="text-sm text-gray-600">
                    Scan this QR code with your authenticator app:
                  </p>
                  
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border inline-block">
                      <Image
                        src={qrCodeUrl}
                        alt="2FA QR Code"
                        width={200}
                        height={200}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Or enter this secret key manually:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={secret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copySecret}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enter the 6-digit code from your app:
                    </label>
                    <Input
                      value={appCode}
                      onChange={(e) => setAppCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  <Button 
                    onClick={handleAppVerification}
                    disabled={isLoading || appCode.length !== 6}
                    className="w-full"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </Button>
                </div>
              </div>
            )}

            {step === 'backup' && (
              <div className="space-y-4">
                <Alert>
                  <Download className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Save these backup codes in a secure location. 
                    You can use them to access your account if you lose your authenticator device.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Backup Codes</h3>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={copyBackupCodes}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Codes
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={downloadBackupCodes}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <Button 
                  onClick={() => {
                    onSetupComplete?.();
                    setStep('setup');
                  }}
                  className="w-full"
                >
                  Complete Setup
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 mt-4">
            {!phoneVerified ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to verify your phone number first before enabling SMS 2FA.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    SMS 2FA will send verification codes to your phone number. Make sure your phone can receive SMS messages.
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                  />
                </div>

                <Button 
                  onClick={handleSMSSetup}
                  disabled={isLoading || !smsPhone.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Enabling...' : 'Enable SMS 2FA'}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
