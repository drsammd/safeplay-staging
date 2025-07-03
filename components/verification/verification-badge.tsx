
"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Phone,
  FileText,
  Star
} from "lucide-react";

interface VerificationBadgeProps {
  verificationLevel: string;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  twoFactorEnabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const levelConfig = {
  UNVERIFIED: {
    label: 'Unverified',
    color: 'destructive' as const,
    icon: AlertCircle,
    description: 'Account needs verification'
  },
  PHONE_VERIFIED: {
    label: 'Phone Verified',
    color: 'secondary' as const,
    icon: Phone,
    description: 'Phone number verified'
  },
  IDENTITY_VERIFIED: {
    label: 'Identity Verified',
    color: 'outline' as const,
    icon: FileText,
    description: 'Identity documents verified'
  },
  FULL_VERIFIED: {
    label: 'Fully Verified',
    color: 'success' as const,
    icon: Star,
    description: 'Fully verified with 2FA enabled'
  }
};

export function VerificationBadge({
  verificationLevel,
  phoneVerified = false,
  identityVerified = false,
  twoFactorEnabled = false,
  size = 'md',
  showDetails = false
}: VerificationBadgeProps) {
  const config = levelConfig[verificationLevel as keyof typeof levelConfig] || levelConfig.UNVERIFIED;
  const IconComponent = config.icon;

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-sm';
      default: return 'text-sm';
    }
  };

  const badgeContent = (
    <Badge variant={config.color} className={getTextSize()}>
      <IconComponent className={`${getIconSize()} mr-1`} />
      {config.label}
    </Badge>
  );

  if (!showDetails) {
    return badgeContent;
  }

  const verificationDetails = [
    { label: 'Phone Verified', verified: phoneVerified, icon: Phone },
    { label: 'Identity Verified', verified: identityVerified, icon: FileText },
    { label: '2FA Enabled', verified: twoFactorEnabled, icon: Shield }
  ];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="space-y-2">
            <div className="font-medium text-sm">{config.description}</div>
            <div className="space-y-1">
              {verificationDetails.map((detail, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <detail.icon className="h-3 w-3" />
                  <span className={detail.verified ? 'text-green-600' : 'text-gray-500'}>
                    {detail.label}
                  </span>
                  {detail.verified ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
