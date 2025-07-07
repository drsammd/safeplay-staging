
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Phone, 
  CreditCard, 
  Key, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Lock
} from 'lucide-react';

export default function VerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  const verificationSteps = [
    {
      id: 'phone',
      title: 'Phone Verification',
      description: 'Verify your phone number for enhanced security',
      icon: Phone,
      completed: user?.phoneVerified || false,
      required: true
    },
    {
      id: 'identity',
      title: 'Identity Verification',
      description: 'Complete identity verification to unlock all features',
      icon: CreditCard,
      completed: user?.identityVerified || false,
      required: true
    },
    {
      id: 'twoFactor',
      title: 'Two-Factor Authentication',
      description: 'Enable 2FA for maximum account protection',
      icon: Key,
      completed: user?.twoFactorEnabled || false,
      required: false
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Security & Verification</h1>
        <p className="text-gray-600 text-lg">
          Complete your security setup to unlock all SafePlay features
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {verificationSteps.map((step, index) => (
          <Card key={step.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{step.title}</span>
                      {step.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {step.completed ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Completed
                    </Badge>
                  ) : (
                    <Button 
                      onClick={() => {
                        // Handle verification step
                        console.log(`Starting ${step.id} verification`);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <span>Complete</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your security and privacy are our top priority. All verification data is encrypted 
            and stored securely according to industry standards.
          </AlertDescription>
        </Alert>

        <div className="text-center pt-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/parent')}
            className="flex items-center space-x-2"
          >
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
