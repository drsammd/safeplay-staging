
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Phone,
  FileText,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface VerificationRequirement {
  id: string;
  name: string;
  description: string;
  requiredLevel: string;
  requiredPhone: boolean;
  requiredIdentity: boolean;
  requiredTwoFactor: boolean;
  gracePeriodDays?: number;
  enforced: boolean;
}

interface VerificationEnforcementProps {
  action: string;
  userVerificationLevel: string;
  phoneVerified: boolean;
  identityVerified: boolean;
  twoFactorEnabled: boolean;
  onVerificationRequired?: () => void;
  children?: React.ReactNode;
}

export function VerificationEnforcement({
  action,
  userVerificationLevel,
  phoneVerified,
  identityVerified,
  twoFactorEnabled,
  onVerificationRequired,
  children
}: VerificationEnforcementProps) {
  const { data: session } = useSession();
  const [requirements, setRequirements] = useState<VerificationRequirement[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVerificationRequirements();
  }, [action, userVerificationLevel, phoneVerified, identityVerified, twoFactorEnabled]);

  const checkVerificationRequirements = async () => {
    try {
      // This would typically fetch from an API endpoint
      // For now, we'll use hardcoded requirements based on common patterns
      const actionRequirements = getActionRequirements(action);
      
      if (actionRequirements) {
        const missing = [];
        let blocked = false;

        // Check verification level requirement
        const levelHierarchy = ['UNVERIFIED', 'PHONE_VERIFIED', 'IDENTITY_VERIFIED', 'FULL_VERIFIED'];
        const userLevelIndex = levelHierarchy.indexOf(userVerificationLevel);
        const requiredLevelIndex = levelHierarchy.indexOf(actionRequirements.requiredLevel);
        
        if (userLevelIndex < requiredLevelIndex) {
          blocked = true;
        }

        // Check specific requirements
        if (actionRequirements.requiredPhone && !phoneVerified) {
          missing.push('Phone verification required');
          blocked = true;
        }
        
        if (actionRequirements.requiredIdentity && !identityVerified) {
          missing.push('Identity verification required');
          blocked = true;
        }
        
        if (actionRequirements.requiredTwoFactor && !twoFactorEnabled) {
          missing.push('Two-factor authentication required');
          blocked = true;
        }

        setRequirements([actionRequirements]);
        setMissingRequirements(missing);
        setIsBlocked(blocked && actionRequirements.enforced);
      } else {
        setIsBlocked(false);
        setMissingRequirements([]);
      }
    } catch (error) {
      console.error('Error checking verification requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionRequirements = (action: string): VerificationRequirement | null => {
    // Define verification requirements for different actions
    const actionMap: Record<string, VerificationRequirement> = {
      'add_child': {
        id: 'add_child',
        name: 'Add Child',
        description: 'Adding children to your account requires identity verification for safety.',
        requiredLevel: 'IDENTITY_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: false,
        enforced: true
      },
      'biometric_enrollment': {
        id: 'biometric_enrollment',
        name: 'Biometric Enrollment',
        description: 'Enrolling biometric data requires full verification for security.',
        requiredLevel: 'FULL_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: true,
        enforced: true
      },
      'high_value_transaction': {
        id: 'high_value_transaction',
        name: 'High Value Transaction',
        description: 'Large transactions require enhanced verification.',
        requiredLevel: 'IDENTITY_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: false,
        enforced: true
      },
      'admin_access': {
        id: 'admin_access',
        name: 'Admin Access',
        description: 'Administrative functions require full verification.',
        requiredLevel: 'FULL_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: true,
        enforced: true
      },
      'sensitive_data_access': {
        id: 'sensitive_data_access',
        name: 'Sensitive Data Access',
        description: 'Accessing sensitive data requires identity verification.',
        requiredLevel: 'IDENTITY_VERIFIED',
        requiredPhone: true,
        requiredIdentity: true,
        requiredTwoFactor: false,
        enforced: true
      }
    };

    return actionMap[action] || null;
  };

  const getRequiredActions = () => {
    const actions = [];
    
    if (!phoneVerified) {
      actions.push({
        icon: Phone,
        title: 'Verify Phone Number',
        description: 'Add and verify your phone number',
        href: '/verification#phone'
      });
    }
    
    if (!identityVerified) {
      actions.push({
        icon: FileText,
        title: 'Verify Identity',
        description: 'Upload government-issued ID',
        href: '/verification#identity'
      });
    }
    
    if (!twoFactorEnabled) {
      actions.push({
        icon: Shield,
        title: 'Enable 2FA',
        description: 'Set up two-factor authentication',
        href: '/verification#two-factor'
      });
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  // If no verification is required, render children normally
  if (!isBlocked && missingRequirements.length === 0) {
    return <>{children}</>;
  }

  // If verification is required but not enforced, show warning
  if (!isBlocked && missingRequirements.length > 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Enhanced verification recommended</p>
              <p className="text-sm">
                Complete these verification steps for enhanced security and access to all features.
              </p>
              <Link href="/verification">
                <Button variant="outline" size="sm" className="mt-2">
                  Complete Verification
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // If verification is required and enforced, block access
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <Shield className="h-5 w-5" />
          Verification Required
        </CardTitle>
        <CardDescription className="text-red-700">
          {requirements[0]?.description || 'This action requires additional verification.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Missing Requirements */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-red-800">Required Verifications:</h3>
          <div className="space-y-1">
            {missingRequirements.map((requirement, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="h-3 w-3" />
                {requirement}
              </div>
            ))}
          </div>
        </div>

        {/* Required Actions */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-red-800">Complete these steps:</h3>
          <div className="space-y-2">
            {getRequiredActions().map((actionItem, index) => (
              <Link key={index} href={actionItem.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-colors cursor-pointer">
                  <actionItem.icon className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-red-800">{actionItem.title}</div>
                    <div className="text-xs text-red-600">{actionItem.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-red-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link href="/verification" className="flex-1">
            <Button className="w-full">
              Complete Verification
            </Button>
          </Link>
          {onVerificationRequired && (
            <Button 
              variant="outline" 
              onClick={onVerificationRequired}
            >
              Learn More
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
