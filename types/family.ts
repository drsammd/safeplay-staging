export interface FamilyMember {
  id: string
  displayName?: string
  relationship?: string
  familyRole: string
  status: string
  isBlocked: boolean
  emergencyContact: boolean
  emergencyContactOrder?: number
  joinedAt: string
  lastActiveAt?: string
  memberUser: {
    id: string
    name: string
    email: string
    verificationLevel?: string
  }
  childAccess?: Array<{
    id: string
    child: Child
    accessLevel: string
    canViewPhotos: boolean
    canViewVideos: boolean
    canReceiveAlerts: boolean
    canCheckInOut: boolean
  }>
  // Permissions
  canViewAllChildren?: boolean
  canEditChildren?: boolean
  canCheckInOut?: boolean
  canViewPhotos?: boolean
  canViewVideos?: boolean
  canPurchaseMedia?: boolean
  canReceiveAlerts?: boolean
  canViewLocation?: boolean
  canViewReports?: boolean
  canManageFamily?: boolean
  canMakePayments?: boolean
  photoAccess?: string
  videoAccess?: string
  notificationFrequency?: string
  timeRestrictions?: any
}

export interface Child {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  profileImageUrl?: string
  profilePhoto?: string
  status: string
  createdAt: string
  updatedAt: string
}
