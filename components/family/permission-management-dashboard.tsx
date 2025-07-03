
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Users, 
  Eye, 
  Edit, 
  Camera, 
  MapPin, 
  Bell, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  Save,
  RotateCcw,
  Settings
} from 'lucide-react'

import { FamilyMember } from '@/types/family'

interface PermissionManagementDashboardProps {
  familyMember: FamilyMember
  onPermissionsUpdated?: () => void
  onClose?: () => void
}

const permissionCategories = [
  {
    title: 'General Access',
    icon: Eye,
    permissions: [
      { key: 'canViewAllChildren', label: 'View all children', description: 'Can see profiles of all children in the family' },
      { key: 'canEditChildren', label: 'Edit child profiles', description: 'Can modify child information and settings' },
      { key: 'canCheckInOut', label: 'Check-in/Check-out', description: 'Can check children in and out of venues' }
    ]
  },
  {
    title: 'Media Access',
    icon: Camera,
    permissions: [
      { key: 'canViewPhotos', label: 'View photos', description: 'Can view child photos' },
      { key: 'canViewVideos', label: 'View videos', description: 'Can view child videos' },
      { key: 'canPurchaseMedia', label: 'Purchase media', description: 'Can buy photos and videos' }
    ]
  },
  {
    title: 'Location & Safety',
    icon: MapPin,
    permissions: [
      { key: 'canViewLocation', label: 'View location', description: 'Can see child location in real-time' },
      { key: 'canReceiveAlerts', label: 'Receive alerts', description: 'Can receive safety and activity alerts' },
      { key: 'emergencyContact', label: 'Emergency contact', description: 'Listed as emergency contact' }
    ]
  },
  {
    title: 'Administrative',
    icon: Shield,
    permissions: [
      { key: 'canViewReports', label: 'View reports', description: 'Can access safety and activity reports' },
      { key: 'canManageFamily', label: 'Manage family', description: 'Can invite and manage other family members' },
      { key: 'canMakePayments', label: 'Make payments', description: 'Can make purchases and payments' }
    ]
  }
]

const mediaAccessLevels = [
  { value: 'FULL', label: 'Full Access', description: 'Can view all media' },
  { value: 'THUMBNAILS_ONLY', label: 'Thumbnails Only', description: 'Can see thumbnails but not full images' },
  { value: 'APPROVED_ONLY', label: 'Approved Only', description: 'Can only view pre-approved media' },
  { value: 'RECENT_ONLY', label: 'Recent Only', description: 'Can only view media from last 30 days' },
  { value: 'NO_ACCESS', label: 'No Access', description: 'Cannot view any media' }
]

const notificationFrequencies = [
  { value: 'REAL_TIME', label: 'Real-time', description: 'Immediate notifications' },
  { value: 'HOURLY', label: 'Hourly', description: 'Hourly digest' },
  { value: 'DAILY', label: 'Daily', description: 'Daily digest' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Weekly digest' },
  { value: 'EMERGENCY_ONLY', label: 'Emergency Only', description: 'Only emergency alerts' },
  { value: 'DISABLED', label: 'Disabled', description: 'No notifications' }
]

export default function PermissionManagementDashboard({ 
  familyMember, 
  onPermissionsUpdated, 
  onClose 
}: PermissionManagementDashboardProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Form state
  const [permissions, setPermissions] = useState({
    canViewAllChildren: familyMember.canViewAllChildren || false,
    canEditChildren: familyMember.canEditChildren || false,
    canCheckInOut: familyMember.canCheckInOut || false,
    canViewPhotos: familyMember.canViewPhotos || false,
    canViewVideos: familyMember.canViewVideos || false,
    canPurchaseMedia: familyMember.canPurchaseMedia || false,
    canReceiveAlerts: familyMember.canReceiveAlerts || false,
    canViewLocation: familyMember.canViewLocation || false,
    canViewReports: familyMember.canViewReports || false,
    canManageFamily: familyMember.canManageFamily || false,
    canMakePayments: familyMember.canMakePayments || false,
    emergencyContact: familyMember.emergencyContact,
    photoAccess: familyMember.photoAccess || 'NONE',
    videoAccess: familyMember.videoAccess || 'NONE',
    notificationFrequency: familyMember.notificationFrequency || 'REAL_TIME',
    isBlocked: familyMember.isBlocked,
    blockReason: '',
    notes: ''
  })

  // Track changes
  useEffect(() => {
    const hasChanges = Object.keys(permissions).some(key => {
      if (key === 'blockReason' || key === 'notes') return false
      return permissions[key as keyof typeof permissions] !== (familyMember as any)[key]
    })
    setHasChanges(hasChanges)
  }, [permissions, familyMember])

  const handlePermissionChange = (key: string, value: boolean | string) => {
    setPermissions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const resetPermissions = () => {
    setPermissions({
      canViewAllChildren: familyMember.canViewAllChildren,
      canEditChildren: familyMember.canEditChildren,
      canCheckInOut: familyMember.canCheckInOut,
      canViewPhotos: familyMember.canViewPhotos,
      canViewVideos: familyMember.canViewVideos,
      canPurchaseMedia: familyMember.canPurchaseMedia,
      canReceiveAlerts: familyMember.canReceiveAlerts,
      canViewLocation: familyMember.canViewLocation,
      canViewReports: familyMember.canViewReports,
      canManageFamily: familyMember.canManageFamily,
      canMakePayments: familyMember.canMakePayments,
      emergencyContact: familyMember.emergencyContact,
      photoAccess: familyMember.photoAccess,
      videoAccess: familyMember.videoAccess,
      notificationFrequency: familyMember.notificationFrequency,
      isBlocked: familyMember.isBlocked,
      blockReason: '',
      notes: ''
    })
  }

  const applyRoleDefaults = (role: string) => {
    const defaults = {
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
        canManageFamily: false,
        canMakePayments: true,
        emergencyContact: true,
        photoAccess: 'FULL',
        videoAccess: 'FULL',
        notificationFrequency: 'REAL_TIME'
      },
      GRANDPARENT: {
        canViewAllChildren: true,
        canEditChildren: false,
        canCheckInOut: false,
        canViewPhotos: true,
        canViewVideos: true,
        canPurchaseMedia: false,
        canReceiveAlerts: true,
        canViewLocation: true,
        canViewReports: false,
        canManageFamily: false,
        canMakePayments: false,
        emergencyContact: true,
        photoAccess: 'FULL',
        videoAccess: 'FULL',
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
        emergencyContact: true,
        photoAccess: 'RECENT_ONLY',
        videoAccess: 'NO_ACCESS',
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
        emergencyContact: true,
        photoAccess: 'NO_ACCESS',
        videoAccess: 'NO_ACCESS',
        notificationFrequency: 'EMERGENCY_ONLY'
      }
    }

    const roleDefaults = defaults[role as keyof typeof defaults]
    if (roleDefaults) {
      setPermissions(prev => ({
        ...prev,
        ...roleDefaults
      }))
    }
  }

  const handleSavePermissions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/family/members/${familyMember.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissions)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Permissions Updated",
          description: `Successfully updated permissions for ${familyMember.displayName || familyMember.memberUser.name}`,
        })
        
        onPermissionsUpdated?.()
        onClose?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update permissions",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Permission Management</h2>
            <p className="text-sm text-gray-600">
              Configure permissions for {familyMember.displayName || familyMember.memberUser.name}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => applyRoleDefaults(familyMember.familyRole)}>
            Apply {familyMember.familyRole.replace('_', ' ')} Defaults
          </Button>
          
          {hasChanges && (
            <Button variant="outline" onClick={resetPermissions}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
          )}
        </div>
      </div>

      {/* Member Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold">{familyMember.displayName || familyMember.memberUser.name}</h3>
                <Badge>{familyMember.familyRole.replace('_', ' ')}</Badge>
                {familyMember.isBlocked && (
                  <Badge variant="destructive">BLOCKED</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{familyMember.memberUser.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block/Unblock Member */}
      <Card className={permissions.isBlocked ? 'border-red-200 bg-red-50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Member Status</span>
          </CardTitle>
          <CardDescription>
            Block or unblock this family member's access to all children and family information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isBlocked" className="font-medium">
                {permissions.isBlocked ? 'Member is currently blocked' : 'Member has access'}
              </Label>
              <p className="text-sm text-gray-600">
                {permissions.isBlocked 
                  ? 'This member cannot access any family information' 
                  : 'This member can access information based on their permissions'
                }
              </p>
            </div>
            <Switch
              id="isBlocked"
              checked={permissions.isBlocked}
              onCheckedChange={(checked) => handlePermissionChange('isBlocked', checked)}
            />
          </div>

          {permissions.isBlocked && (
            <div>
              <Label htmlFor="blockReason">Reason for blocking (optional)</Label>
              <Textarea
                id="blockReason"
                placeholder="Enter reason for blocking this member..."
                value={permissions.blockReason}
                onChange={(e) => handlePermissionChange('blockReason', e.target.value)}
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Categories */}
      {!permissions.isBlocked && (
        <div className="grid gap-6">
          {permissionCategories.map((category) => {
            const IconComponent = category.icon
            return (
              <Card key={category.title}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    <span>{category.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.permissions.map((permission) => (
                    <div key={permission.key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor={permission.key} className="font-medium cursor-pointer">
                          {permission.label}
                        </Label>
                        <p className="text-sm text-gray-600">{permission.description}</p>
                      </div>
                      <Switch
                        id={permission.key}
                        checked={permissions[permission.key as keyof typeof permissions] as boolean}
                        onCheckedChange={(checked) => handlePermissionChange(permission.key, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}

          {/* Media Access Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-blue-600" />
                <span>Media Access Levels</span>
              </CardTitle>
              <CardDescription>
                Configure detailed media access permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="photoAccess">Photo Access Level</Label>
                <Select 
                  value={permissions.photoAccess} 
                  onValueChange={(value) => handlePermissionChange('photoAccess', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaAccessLevels.map((level) => (
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

              <div>
                <Label htmlFor="videoAccess">Video Access Level</Label>
                <Select 
                  value={permissions.videoAccess} 
                  onValueChange={(value) => handlePermissionChange('videoAccess', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaAccessLevels.map((level) => (
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
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Configure how and when this member receives notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notificationFrequency">Notification Frequency</Label>
                <Select 
                  value={permissions.notificationFrequency} 
                  onValueChange={(value) => handlePermissionChange('notificationFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationFrequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        <div>
                          <div className="font-medium">{freq.label}</div>
                          <div className="text-sm text-gray-500">{freq.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Add any additional notes about this family member's permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about this family member..."
                value={permissions.notes}
                onChange={(e) => handlePermissionChange('notes', e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSavePermissions}
          disabled={isLoading || !hasChanges}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Permissions
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
