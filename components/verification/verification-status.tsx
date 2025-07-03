
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Phone, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Star,
  ArrowRight
} from "lucide-react";

interface VerificationStatusProps {
  phoneVerified: boolean;
  identityVerified: boolean;
  twoFactorEnabled: boolean;
  verificationLevel: string;
  nextSteps?: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
}

const levelConfig = {
  UNVERIFIED: {
    label: 'Unverified',
    color: 'destructive' as const,
    progress: 0,
    description: 'Basic account security'
  },
  PHONE_VERIFIED: {
    label: 'Phone Verified',
    color: 'secondary' as const,
    progress: 33,
    description: 'Enhanced account security'
  },
  IDENTITY_VERIFIED: {
    label: 'Identity Verified',
    color: 'outline' as const,
    progress: 66,
    description: 'High account security'
  },
  FULL_VERIFIED: {
    label: 'Fully Verified',
    color: 'success' as const,
    progress: 100,
    description: 'Maximum account security'
  }
};

export function VerificationStatus({
  phoneVerified,
  identityVerified,
  twoFactorEnabled,
  verificationLevel,
  nextSteps = []
}: VerificationStatusProps) {
  const currentLevel = levelConfig[verificationLevel as keyof typeof levelConfig] || levelConfig.UNVERIFIED;

  const getVerificationItems = () => [
    {
      icon: Phone,
      title: 'Phone Verification',
      description: 'Verify your phone number',
      completed: phoneVerified,
      priority: 'high'
    },
    {
      icon: FileText,
      title: 'Identity Verification',
      description: 'Upload government-issued ID',
      completed: identityVerified,
      priority: phoneVerified ? 'high' : 'medium'
    },
    {
      icon: Shield,
      title: 'Two-Factor Authentication',
      description: 'Enable 2FA for extra security',
      completed: twoFactorEnabled,
      priority: identityVerified ? 'medium' : 'low'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const verificationItems = getVerificationItems();
  const completedCount = verificationItems.filter(item => item.completed).length;

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Verification Status
            </CardTitle>
            <Badge variant={currentLevel.color}>
              {currentLevel.label}
            </Badge>
          </div>
          <CardDescription>
            {currentLevel.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedCount}/3 completed</span>
            </div>
            <Progress value={currentLevel.progress} className="h-2" />
          </div>

          {/* Verification Items */}
          <div className="space-y-3">
            {verificationItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className={`p-2 rounded-full ${
                  item.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <item.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    {item.completed ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {item.priority} priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                {!item.completed && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Level Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Security Benefits
          </CardTitle>
          <CardDescription>
            What you get with each verification level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className={`p-3 rounded-lg border ${phoneVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4" />
                <span className="font-medium text-sm">Phone Verified</span>
                {phoneVerified && <CheckCircle className="h-3 w-3 text-green-600" />}
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• SMS notifications and alerts</li>
                <li>• Account recovery via phone</li>
                <li>• Basic identity confirmation</li>
              </ul>
            </div>

            <div className={`p-3 rounded-lg border ${identityVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4" />
                <span className="font-medium text-sm">Identity Verified</span>
                {identityVerified && <CheckCircle className="h-3 w-3 text-green-600" />}
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• Higher transaction limits</li>
                <li>• Access to premium features</li>
                <li>• Enhanced account security</li>
                <li>• Priority customer support</li>
              </ul>
            </div>

            <div className={`p-3 rounded-lg border ${twoFactorEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4" />
                <span className="font-medium text-sm">Two-Factor Enabled</span>
                {twoFactorEnabled && <CheckCircle className="h-3 w-3 text-green-600" />}
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• Maximum account protection</li>
                <li>• Secure login authentication</li>
                <li>• Protection against unauthorized access</li>
                <li>• Peace of mind security</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recommended Next Steps
            </CardTitle>
            <CardDescription>
              Complete these steps to improve your account security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className={`p-2 rounded-full text-white ${
                    step.priority === 'high' ? 'bg-red-500' :
                    step.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriorityColor(step.priority)}`}
                  >
                    {step.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
