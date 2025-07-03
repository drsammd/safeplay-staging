
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  Camera, 
  MapPin, 
  Bell, 
  Clock, 
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  Save,
  Trash2
} from 'lucide-react'

interface Child {
  id: string
  firstName: string
  lastName: string
  profilePhoto?: string
  dateOfBirth: string
}

interface ChildAccess {
  id: string
  child: Child
  accessLevel: string
  canViewProfile: boolean
  canEditProfile: boolean
  canViewLocation: boolean
  canTrackLocation: boolean
  canViewPhotos: boolean
  canViewVideos: boolean
  canDownloadMedia: boolean
  canPurchaseMedia: boolean
  canReceiveAlerts: boolean
  canCheckInOut: boolean
  canAuthorizePickup: boolean
  canViewReports: boolean
  canViewAnalytics: boolean
  canManageEmergencyContacts: boolean
  emergencyAlerts: boolean
  routineAlerts: boolean
  photoAlerts: boolean
  isBlocked: boolean
  status: string
  isTemporary: boolean
  temporaryStart?: string
  temporaryEnd?: string
  temporaryReason?: string
  createdAt: string
}

interface FamilyMember {
  id: string
  displayName?: string
  familyRole: string
  memberUser: {
    id: string
    name: string
    email: string
  }
}

interface ChildAccessManagementProps {
  familyMember: FamilyMember
  availableChildren: Child[]
  onAccessUpdated?: () => void
  onClose?: () => void
}

const accessLevels = [
  { value: 'FULL', label: 'Full Access', description: 'Complete access to all child information' },
  { value: 'BASIC', label: 'Basic Access', description: 'Name, photo, and location only' },
  { value: 'EMERGENCY_ONLY', label: 'Emergency Only', description: 'Access only during emergencies' },
  { value: 'RESTRICTED', label: 'Restricted', description: 'Limited access with specific restrictions' },
  { value: 'CUSTOM', label: 'Custom', description: 'Fully customized access permissions' }
]

export default function ChildAccessManagement({ 
  familyMember, 
  availableChildren, 
  onAccessUpdated, 
  onClose 
}: ChildAccessManagementProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [childAccesses, setChildAccesses] = useState<ChildAccess[]>([])
  const [showAddAccess, setShowAddAccess] = useState(false)
  const [editingAccess, setEditingAccess] = useState<ChildAccess | null>(null)

  // New access form state
  const [newAccessForm, setNewAccessForm] = useState({
    childId: '',
    accessLevel: 'BASIC',
    canViewProfile: true,
    canEditProfile: false,
    canViewLocation: true,
    canTrackLocation: true,
    canViewPhotos: true,
    canViewVideos: true,
    canDownloadMedia: false,
    canPurchaseMedia: false,
    canReceiveAlerts: true,
    canCheckInOut: false,
    canAuthorizePickup: false,
    canViewReports: false,
    canViewAnalytics: false,
    canManageEmergencyContacts: false,
    emergencyAlerts: true,
    routineAlerts: true,
    photoAlerts: true,
    isTemporary: false,
    temporaryStart: '',
    temporaryEnd: '',
    temporaryReason: '',
    grantReason: ''
  })

  useEffect(() => {
    fetchChildAccesses()
  }, [familyMember.id])

  const fetchChildAccesses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/family/members/${familyMember.id}/child-access`)
      if (response.ok) {
        const data = await response.json()
        setChildAccesses(data.childAccess || [])
      }
    } catch (error) {
      console.error('Error fetching child accesses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccessLevelChange = (level: string) => {
    const defaults = {
      FULL: {
        canViewProfile: true,
        canEditProfile: true,
        canViewLocation: true,
        canTrackLocation: true,
        canViewPhotos: true,
        canViewVideos: true,
        canDownloadMedia: true,
        canPurchaseMedia: false,
        canReceiveAlerts: true,
        canCheckInOut: true,
        canAuthorizePickup: false,
        canViewReports: true,
        canViewAnalytics: false,
        canManageEmergencyContacts: false
      },
      BASIC: {
        canViewProfile: true,
        canEditProfile: false,
        canViewLocation: true,
        canTrackLocation: false,
        canViewPhotos: true,
        canViewVideos: false,
        canDownloadMedia: false,
        canPurchaseMedia: false,
        canReceiveAlerts: true,
        canCheckInOut: false,
        canAuthorizePickup: false,
        canViewReports: false,
        canViewAnalytics: false,
        canManageEmergencyContacts: false
      },
      EMERGENCY_ONLY: {
        canViewProfile: true,
        canEditProfile: false,
        canViewLocation: true,
        canTrackLocation: false,
        canViewPhotos: false,
        canViewVideos: false,
        canDownloadMedia: false,
        canPurchaseMedia: false,
        canReceiveAlerts: true,
        canCheckInOut: false,
        canAuthorizePickup: false,
        canViewReports: false,
        canViewAnalytics: false,
        canManageEmergencyContacts: false
      }
    }

    const levelDefaults = defaults[level as keyof typeof defaults]
    if (levelDefaults) {
      setNewAccessForm(prev => ({
        ...prev,
        accessLevel: level,
        ...levelDefaults
      }))
    } else {
      setNewAccessForm(prev => ({
        ...prev,
        accessLevel: level
      }))
    }
  }

  const handleGrantAccess = async () => {
    if (!newAccessForm.childId) {
      toast({
        title: "Missing Information",
        description: "Please select a child to grant access to.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/family/members/${familyMember.id}/child-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccessForm)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Access Granted",
          description: `Successfully granted access to ${result.childAccess.child.firstName}`,
        })
        
        fetchChildAccesses()
        setShowAddAccess(false)
        setNewAccessForm({
          childId: '',
          accessLevel: 'BASIC',
          canViewProfile: true,
          canEditProfile: false,
          canViewLocation: true,
          canTrackLocation: true,
          canViewPhotos: true,
          canViewVideos: true,
          canDownloadMedia: false,
          canPurchaseMedia: false,
          canReceiveAlerts: true,
          canCheckInOut: false,
          canAuthorizePickup: false,
          canViewReports: false,
          canViewAnalytics: false,
          canManageEmergencyContacts: false,
          emergencyAlerts: true,
          routineAlerts: true,
          photoAlerts: true,
          isTemporary: false,
          temporaryStart: '',
          temporaryEnd: '',
          temporaryReason: '',
          grantReason: ''
        })
        
        onAccessUpdated?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to grant access",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to grant access",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAccess = async (accessId: string, updates: any) => {
    try {
      const response = await fetch(`/api/family/child-access/${accessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Access Updated",
          description: "Successfully updated child access permissions",
        })
        
        fetchChildAccesses()
        setEditingAccess(null)
        onAccessUpdated?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update access",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive"
      })
    }
  }

  const handleRevokeAccess = async (accessId: string, reason: string = 'Access revoked by parent') => {
    try {
      const response = await fetch(`/api/family/child-access/${accessId}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Access Revoked",
          description: "Successfully revoked child access",
        })
        
        fetchChildAccesses()
        onAccessUpdated?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to revoke access",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive"
      })
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'FULL':
        return 'bg-green-100 text-green-800'
      case 'BASIC':
        return 'bg-blue-100 text-blue-800'
      case 'EMERGENCY_ONLY':
        return 'bg-red-100 text-red-800'
      case 'RESTRICTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CUSTOM':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string, isBlocked: boolean) => {
    if (isBlocked) return 'bg-red-100 text-red-800'
    
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800'
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const availableChildrenForAccess = availableChildren.filter(child => 
    !childAccesses.some(access => access.child.id === child.id)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Child Access Management</h2>
            <p className="text-sm text-gray-600">
              Manage {familyMember.displayName || familyMember.memberUser.name}'s access to children
            </p>
          </div>
        </div>

        {availableChildrenForAccess.length > 0 && (
          <Button onClick={() => setShowAddAccess(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Grant Child Access
          </Button>
        )}
      </div>

      {/* Add Access Form */}
      {showAddAccess && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Grant Child Access</CardTitle>
            <CardDescription>
              Give this family member access to a specific child with customized permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Child Selection */}
            <div>
              <Label htmlFor="childId">Select Child *</Label>
              <Select value={newAccessForm.childId} onValueChange={(value) => setNewAccessForm(prev => ({ ...prev, childId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {availableChildrenForAccess.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <div className="flex items-center space-x-2">
                        {child.profilePhoto && (
                          <img 
                            src={child.profilePhoto} 
                            alt={`${child.firstName} ${child.lastName}`}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        )}
                        <span>{child.firstName} {child.lastName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Access Level */}
            <div>
              <Label htmlFor="accessLevel">Access Level *</Label>
              <Select value={newAccessForm.accessLevel} onValueChange={handleAccessLevelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accessLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile & Location */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Profile & Location
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canViewProfile" className="text-sm">View profile</Label>
                    <Switch
                      id="canViewProfile"
                      checked={newAccessForm.canViewProfile}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canViewProfile: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canEditProfile" className="text-sm">Edit profile</Label>
                    <Switch
                      id="canEditProfile"
                      checked={newAccessForm.canEditProfile}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canEditProfile: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canViewLocation" className="text-sm">View location</Label>
                    <Switch
                      id="canViewLocation"
                      checked={newAccessForm.canViewLocation}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canViewLocation: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canTrackLocation" className="text-sm">Track location</Label>
                    <Switch
                      id="canTrackLocation"
                      checked={newAccessForm.canTrackLocation}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canTrackLocation: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Media Access */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Camera className="h-4 w-4 mr-2" />
                  Media Access
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canViewPhotos" className="text-sm">View photos</Label>
                    <Switch
                      id="canViewPhotos"
                      checked={newAccessForm.canViewPhotos}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canViewPhotos: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canViewVideos" className="text-sm">View videos</Label>
                    <Switch
                      id="canViewVideos"
                      checked={newAccessForm.canViewVideos}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canViewVideos: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canDownloadMedia" className="text-sm">Download media</Label>
                    <Switch
                      id="canDownloadMedia"
                      checked={newAccessForm.canDownloadMedia}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canDownloadMedia: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canPurchaseMedia" className="text-sm">Purchase media</Label>
                    <Switch
                      id="canPurchaseMedia"
                      checked={newAccessForm.canPurchaseMedia}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canPurchaseMedia: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Alerts & Actions */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Alerts & Actions
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canReceiveAlerts" className="text-sm">Receive alerts</Label>
                    <Switch
                      id="canReceiveAlerts"
                      checked={newAccessForm.canReceiveAlerts}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canReceiveAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canCheckInOut" className="text-sm">Check in/out</Label>
                    <Switch
                      id="canCheckInOut"
                      checked={newAccessForm.canCheckInOut}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canCheckInOut: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canAuthorizePickup" className="text-sm">Authorize pickup</Label>
                    <Switch
                      id="canAuthorizePickup"
                      checked={newAccessForm.canAuthorizePickup}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canAuthorizePickup: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Administrative */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Administrative
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canViewReports" className="text-sm">View reports</Label>
                    <Switch
                      id="canViewReports"
                      checked={newAccessForm.canViewReports}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canViewReports: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canViewAnalytics" className="text-sm">View analytics</Label>
                    <Switch
                      id="canViewAnalytics"
                      checked={newAccessForm.canViewAnalytics}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canViewAnalytics: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="canManageEmergencyContacts" className="text-sm">Manage emergency contacts</Label>
                    <Switch
                      id="canManageEmergencyContacts"
                      checked={newAccessForm.canManageEmergencyContacts}
                      onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, canManageEmergencyContacts: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Temporary Access */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTemporary"
                  checked={newAccessForm.isTemporary}
                  onCheckedChange={(checked) => setNewAccessForm(prev => ({ ...prev, isTemporary: checked }))}
                />
                <Label htmlFor="isTemporary">This is temporary access</Label>
              </div>

              {newAccessForm.isTemporary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-yellow-50">
                  <div>
                    <Label htmlFor="temporaryStart">Start Date</Label>
                    <input
                      id="temporaryStart"
                      type="datetime-local"
                      value={newAccessForm.temporaryStart}
                      onChange={(e) => setNewAccessForm(prev => ({ ...prev, temporaryStart: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="temporaryEnd">End Date</Label>
                    <input
                      id="temporaryEnd"
                      type="datetime-local"
                      value={newAccessForm.temporaryEnd}
                      onChange={(e) => setNewAccessForm(prev => ({ ...prev, temporaryEnd: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="temporaryReason">Reason for temporary access</Label>
                    <Textarea
                      id="temporaryReason"
                      placeholder="Why is this temporary access needed?"
                      value={newAccessForm.temporaryReason}
                      onChange={(e) => setNewAccessForm(prev => ({ ...prev, temporaryReason: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Grant Reason */}
            <div>
              <Label htmlFor="grantReason">Reason for granting access (optional)</Label>
              <Textarea
                id="grantReason"
                placeholder="Why are you granting this access?"
                value={newAccessForm.grantReason}
                onChange={(e) => setNewAccessForm(prev => ({ ...prev, grantReason: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddAccess(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleGrantAccess} disabled={isLoading || !newAccessForm.childId} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Granting...' : 'Grant Access'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Child Accesses */}
      {childAccesses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Child Access</h3>
            <p className="text-gray-600">
              This family member doesn't have access to any children yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {childAccesses.map((access) => (
            <Card key={access.id} className={access.isBlocked ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={access.child.profilePhoto} />
                      <AvatarFallback>
                        {access.child.firstName.charAt(0)}{access.child.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">
                          {access.child.firstName} {access.child.lastName}
                        </h3>
                        
                        <Badge className={getAccessLevelColor(access.accessLevel)}>
                          {access.accessLevel.replace('_', ' ')}
                        </Badge>
                        
                        <Badge className={getStatusColor(access.status, access.isBlocked)}>
                          {access.isBlocked ? 'BLOCKED' : access.status}
                        </Badge>

                        {access.isTemporary && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Temporary
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>Age: {Math.floor((new Date().getTime() - new Date(access.child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old</p>
                        <p>Access granted: {new Date(access.createdAt).toLocaleDateString()}</p>
                        {access.isTemporary && access.temporaryEnd && (
                          <p className="text-yellow-600">Expires: {new Date(access.temporaryEnd).toLocaleDateString()}</p>
                        )}
                      </div>

                      {/* Permissions Summary */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {access.canViewPhotos && (
                          <div className="flex items-center space-x-1">
                            <Camera className="h-3 w-3" />
                            <span>Photos</span>
                          </div>
                        )}
                        {access.canViewLocation && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>Location</span>
                          </div>
                        )}
                        {access.canReceiveAlerts && (
                          <div className="flex items-center space-x-1">
                            <Bell className="h-3 w-3" />
                            <span>Alerts</span>
                          </div>
                        )}
                        {access.canCheckInOut && (
                          <div className="flex items-center space-x-1">
                            <UserCheck className="h-3 w-3" />
                            <span>Check-in/out</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAccess(access)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (access.isBlocked) {
                          handleUpdateAccess(access.id, { isBlocked: false })
                        } else {
                          handleUpdateAccess(access.id, { isBlocked: true, blockReason: 'Blocked by parent' })
                        }
                      }}
                    >
                      {access.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeAccess(access.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Close Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
