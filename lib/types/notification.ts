
// Notification frequency options
export type NotificationFrequency = 
  | 'REAL_TIME'
  | 'HOURLY' 
  | 'DAILY'
  | 'WEEKLY'
  | 'EMERGENCY_ONLY'
  | 'DISABLED';

// Access level types
export type AccessLevel = 'FULL' | 'RECENT_ONLY' | 'NO_ACCESS';

// Permission set interface for family members
export interface PermissionSet {
  canViewAllChildren: boolean;
  canEditChildren: boolean;
  canCheckInOut: boolean;
  canViewPhotos: boolean;
  canViewVideos: boolean;
  canPurchaseMedia: boolean;
  canReceiveAlerts: boolean;
  canViewLocation: boolean;
  canViewReports: boolean;
  canManageFamily: boolean;
  canMakePayments: boolean;
  photoAccess: AccessLevel;
  videoAccess: AccessLevel;
  emergencyContact: boolean;
  notificationFrequency: NotificationFrequency;
}

// Default permission sets for different family roles
export const defaultPermissions: Record<string, PermissionSet> = {
  SPOUSE: {
    canViewAllChildren: true,
    canEditChildren: true,
    canCheckInOut: true,
    canViewPhotos: true,
    canViewVideos: true,
    canPurchaseMedia: true,
    canReceiveAlerts: true,
    canViewLocation: true,
    canViewReports: true,
    canManageFamily: false, // Only primary parent can manage family
    canMakePayments: true,
    photoAccess: 'FULL',
    videoAccess: 'FULL',
    emergencyContact: true,
    notificationFrequency: 'REAL_TIME'
  },
  
  GRANDPARENT: {
    canViewAllChildren: true,
    canEditChildren: false,
    canCheckInOut: true,
    canViewPhotos: true,
    canViewVideos: true,
    canPurchaseMedia: false,
    canReceiveAlerts: true,
    canViewLocation: true,
    canViewReports: true,
    canManageFamily: false,
    canMakePayments: false,
    photoAccess: 'FULL',
    videoAccess: 'RECENT_ONLY',
    emergencyContact: true,
    notificationFrequency: 'DAILY'
  },
  
  NANNY: {
    canViewAllChildren: true,
    canEditChildren: false,
    canCheckInOut: true,
    canViewPhotos: true,
    canViewVideos: false,
    canPurchaseMedia: false,
    canReceiveAlerts: true,
    canViewLocation: true,
    canViewReports: false,
    canManageFamily: false,
    canMakePayments: false,
    photoAccess: 'RECENT_ONLY',
    videoAccess: 'NO_ACCESS',
    emergencyContact: true,
    notificationFrequency: 'REAL_TIME'
  },
  
  GUARDIAN: {
    canViewAllChildren: true,
    canEditChildren: true,
    canCheckInOut: true,
    canViewPhotos: true,
    canViewVideos: true,
    canPurchaseMedia: true,
    canReceiveAlerts: true,
    canViewLocation: true,
    canViewReports: true,
    canManageFamily: true,
    canMakePayments: true,
    photoAccess: 'FULL',
    videoAccess: 'FULL',
    emergencyContact: true,
    notificationFrequency: 'REAL_TIME'
  },
  
  EMERGENCY_CONTACT: {
    canViewAllChildren: false,
    canEditChildren: false,
    canCheckInOut: false,
    canViewPhotos: false,
    canViewVideos: false,
    canPurchaseMedia: false,
    canReceiveAlerts: true,
    canViewLocation: true,
    canViewReports: false,
    canManageFamily: false,
    canMakePayments: false,
    photoAccess: 'NO_ACCESS',
    videoAccess: 'NO_ACCESS',
    emergencyContact: true,
    notificationFrequency: 'EMERGENCY_ONLY'
  },
  
  CUSTOM: {
    canViewAllChildren: false,
    canEditChildren: false,
    canCheckInOut: false,
    canViewPhotos: false,
    canViewVideos: false,
    canPurchaseMedia: false,
    canReceiveAlerts: false,
    canViewLocation: false,
    canViewReports: false,
    canManageFamily: false,
    canMakePayments: false,
    photoAccess: 'NO_ACCESS',
    videoAccess: 'NO_ACCESS',
    emergencyContact: false,
    notificationFrequency: 'DISABLED'
  }
};
