
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  UserPlus, 
  Users, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Trash2,
  Eye,
  Camera,
  MapPin,
  Shield,
  CreditCard,
  Bell
} from 'lucide-react'

interface Child {
  id: string
  firstName: string
  lastName: string
  profilePhoto?: string
}

interface FamilyInvitationInterfaceProps {
  children: Child[]
  onInvitationSent?: () => void
}

const familyRoles = [
  { value: 'SPOUSE', label: 'Spouse/Partner', description: 'Full access similar to parent' },
  { value: 'GRANDPARENT', label: 'Grandparent', description: 'View access with some interaction' },
  { value: 'SIBLING', label: 'Sibling', description: 'Limited access for older siblings' },
  { value: 'RELATIVE', label: 'Relative', description: 'Other family member with customizable access' },
  { value: 'FRIEND', label: 'Family Friend', description: 'Limited view access' },
  { value: 'NANNY', label: 'Nanny/Caregiver', description: 'Care-related access, no purchases' },
  { value: 'BABYSITTER', label: 'Babysitter', description: 'Temporary care access' },
  { value: 'TEACHER', label: 'Teacher/Educator', description: 'Educational context access' },
  { value: 'GUARDIAN', label: 'Legal Guardian', description: 'Full access' },
  { value: 'EMERGENCY_CONTACT', label: 'Emergency Contact', description: 'Minimal access for emergencies' },
  { value: 'CUSTOM', label: 'Custom Role', description: 'Fully customizable permissions' }
]

const defaultPermissions = {
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
    photoAccess: 'FULL' as const,
    videoAccess: 'FULL' as const,
    emergencyContact: true,
    notificationFrequency: 'REAL_TIME' as const
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
    photoAccess: 'FULL' as const,
    videoAccess: 'FULL' as const,
    emergencyContact: true,
    notificationFrequency: 'DAILY' as const
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
    photoAccess: 'RECENT_ONLY' as const,
    videoAccess: 'NO_ACCESS' as const,
    emergencyContact: true,
    notificationFrequency: 'REAL_TIME' as const
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
    photoAccess: 'NO_ACCESS' as const,
    videoAccess: 'NO_ACCESS' as const,
    emergencyContact: true,
    notificationFrequency: 'EMERGENCY_ONLY' as const
  }
}

export default function FamilyInvitationInterface({ children, onInvitationSent }: FamilyInvitationInterfaceProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [sentInvitations, setSentInvitations] = useState<any[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    inviteeEmail: '',
    inviteeName: '',
    familyRole: '',
    invitationMessage: '',
    linkedChildrenIds: [] as string[],
    expirationDays: 7,
    permissionSet: {
      canViewAllChildren: false,
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
      photoAccess: 'FULL' as const,
      videoAccess: 'FULL' as const,
      emergencyContact: false,
      notificationFrequency: 'REAL_TIME' as const
    }
  })

  // Load sent invitations
  useEffect(() => {
    fetchSentInvitations()
  }, [])

  const fetchSentInvitations = async () => {
    try {
      const response = await fetch('/api/family/invitations?type=sent')
      if (response.ok) {
        const data = await response.json()
        setSentInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      familyRole: role,
      permissionSet: defaultPermissions[role as keyof typeof defaultPermissions] || prev.permissionSet
    }))
  }

  const handlePermissionChange = (permission: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      permissionSet: {
        ...prev.permissionSet,
        [permission]: value
      }
    }))
  }

  const handleChildSelection = (childId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      linkedChildrenIds: checked 
        ? [...prev.linkedChildrenIds, childId]
        : prev.linkedChildrenIds.filter(id => id !== childId)
    }))
  }

  const handleSendInvitation = async () => {
    if (!formData.inviteeEmail || !formData.familyRole) {
      toast({
        title: "Missing Information",
        description: "Please provide email and select a family role.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/family/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Invitation Sent",
          description: `Family invitation sent to ${formData.inviteeEmail}`,
        })
        
        // Reset form
        setFormData({
          inviteeEmail: '',
          inviteeName: '',
          familyRole: '',
          invitationMessage: '',
          linkedChildrenIds: [],
          expirationDays: 7,
          permissionSet: {
            canViewAllChildren: false,
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
            photoAccess: 'FULL',
            videoAccess: 'FULL',
            emergencyContact: false,
            notificationFrequency: 'REAL_TIME'
          }
        })
        
        setShowInviteForm(false)
        fetchSentInvitations()
        onInvitationSent?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invitation",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvitationAction = async (invitationId: string, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/family/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, revokeReason: reason })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
        fetchSentInvitations()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update invitation",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invitation",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'DECLINED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'EXPIRED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'REVOKED':
        return <XCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'DECLINED':
        return 'bg-red-100 text-red-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      case 'REVOKED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Family Members</h2>
            <p className="text-sm text-gray-600">Invite family members to access your children's information</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowInviteForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Family Member
        </Button>
      </div>

      {/* Invitation Form */}
      {showInviteForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-blue-600" />
              <span>Send Family Invitation</span>
            </CardTitle>
            <CardDescription>
              Invite a family member to access your children's information with customized permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inviteeEmail">Email Address *</Label>
                <Input
                  id="inviteeEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.inviteeEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteeEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="inviteeName">Name (Optional)</Label>
                <Input
                  id="inviteeName"
                  placeholder="Enter their name"
                  value={formData.inviteeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteeName: e.target.value }))}
                />
              </div>
            </div>

            {/* Family Role */}
            <div>
              <Label htmlFor="familyRole">Family Role *</Label>
              <Select value={formData.familyRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select family role" />
                </SelectTrigger>
                <SelectContent>
                  {familyRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-sm text-gray-500">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Child Selection */}
            <div>
              <Label>Children Access</Label>
              <p className="text-sm text-gray-600 mb-3">Select which children this family member can access:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children?.map((child) => (
                  <div key={child.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`child-${child.id}`}
                      checked={formData.linkedChildrenIds.includes(child.id)}
                      onCheckedChange={(checked) => handleChildSelection(child.id, checked as boolean)}
                    />
                    <div className="flex items-center space-x-2">
                      {child.profilePhoto && (
                        <img 
                          src={child.profilePhoto} 
                          alt={`${child.firstName} ${child.lastName}`}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <Label htmlFor={`child-${child.id}`} className="cursor-pointer">
                        {child.firstName} {child.lastName}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            {formData.familyRole && (
              <div>
                <Label>Permissions</Label>
                <p className="text-sm text-gray-600 mb-4">Customize what this family member can do:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Permissions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      General Access
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewAllChildren"
                          checked={formData.permissionSet.canViewAllChildren}
                          onCheckedChange={(checked) => handlePermissionChange('canViewAllChildren', checked as boolean)}
                        />
                        <Label htmlFor="canViewAllChildren" className="text-sm">Can view all children</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canEditChildren"
                          checked={formData.permissionSet.canEditChildren}
                          onCheckedChange={(checked) => handlePermissionChange('canEditChildren', checked as boolean)}
                        />
                        <Label htmlFor="canEditChildren" className="text-sm">Can edit child profiles</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canCheckInOut"
                          checked={formData.permissionSet.canCheckInOut}
                          onCheckedChange={(checked) => handlePermissionChange('canCheckInOut', checked as boolean)}
                        />
                        <Label htmlFor="canCheckInOut" className="text-sm">Can check children in/out</Label>
                      </div>
                    </div>
                  </div>

                  {/* Media Permissions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Camera className="h-4 w-4 mr-2" />
                      Media Access
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewPhotos"
                          checked={formData.permissionSet.canViewPhotos}
                          onCheckedChange={(checked) => handlePermissionChange('canViewPhotos', checked as boolean)}
                        />
                        <Label htmlFor="canViewPhotos" className="text-sm">Can view photos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewVideos"
                          checked={formData.permissionSet.canViewVideos}
                          onCheckedChange={(checked) => handlePermissionChange('canViewVideos', checked as boolean)}
                        />
                        <Label htmlFor="canViewVideos" className="text-sm">Can view videos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canPurchaseMedia"
                          checked={formData.permissionSet.canPurchaseMedia}
                          onCheckedChange={(checked) => handlePermissionChange('canPurchaseMedia', checked as boolean)}
                        />
                        <Label htmlFor="canPurchaseMedia" className="text-sm">Can purchase media</Label>
                      </div>
                    </div>
                  </div>

                  {/* Location & Alerts */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location & Alerts
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewLocation"
                          checked={formData.permissionSet.canViewLocation}
                          onCheckedChange={(checked) => handlePermissionChange('canViewLocation', checked as boolean)}
                        />
                        <Label htmlFor="canViewLocation" className="text-sm">Can view location</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canReceiveAlerts"
                          checked={formData.permissionSet.canReceiveAlerts}
                          onCheckedChange={(checked) => handlePermissionChange('canReceiveAlerts', checked as boolean)}
                        />
                        <Label htmlFor="canReceiveAlerts" className="text-sm">Can receive alerts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emergencyContact"
                          checked={formData.permissionSet.emergencyContact}
                          onCheckedChange={(checked) => handlePermissionChange('emergencyContact', checked as boolean)}
                        />
                        <Label htmlFor="emergencyContact" className="text-sm">Emergency contact</Label>
                      </div>
                    </div>
                  </div>

                  {/* Administrative */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Administrative
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewReports"
                          checked={formData.permissionSet.canViewReports}
                          onCheckedChange={(checked) => handlePermissionChange('canViewReports', checked as boolean)}
                        />
                        <Label htmlFor="canViewReports" className="text-sm">Can view reports</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canManageFamily"
                          checked={formData.permissionSet.canManageFamily}
                          onCheckedChange={(checked) => handlePermissionChange('canManageFamily', checked as boolean)}
                        />
                        <Label htmlFor="canManageFamily" className="text-sm">Can manage family</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canMakePayments"
                          checked={formData.permissionSet.canMakePayments}
                          onCheckedChange={(checked) => handlePermissionChange('canMakePayments', checked as boolean)}
                        />
                        <Label htmlFor="canMakePayments" className="text-sm">Can make payments</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Notification Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Frequency
                  </h4>
                  <Select 
                    value={formData.permissionSet.notificationFrequency} 
                    onValueChange={(value) => handlePermissionChange('notificationFrequency', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REAL_TIME">Real-time notifications</SelectItem>
                      <SelectItem value="HOURLY">Hourly digest</SelectItem>
                      <SelectItem value="DAILY">Daily digest</SelectItem>
                      <SelectItem value="WEEKLY">Weekly digest</SelectItem>
                      <SelectItem value="EMERGENCY_ONLY">Emergency only</SelectItem>
                      <SelectItem value="DISABLED">No notifications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Personal Message */}
            <div>
              <Label htmlFor="invitationMessage">Personal Message (Optional)</Label>
              <Textarea
                id="invitationMessage"
                placeholder="Add a personal message to the invitation..."
                value={formData.invitationMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, invitationMessage: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Expiration */}
            <div>
              <Label htmlFor="expirationDays">Invitation Expires In</Label>
              <Select 
                value={formData.expirationDays.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, expirationDays: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowInviteForm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={isLoading || !formData.inviteeEmail || !formData.familyRole}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Invitations */}
      {sentInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sent Invitations</CardTitle>
            <CardDescription>
              Track the status of your family invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invitation.status)}
                      <Badge className={getStatusColor(invitation.status)}>
                        {invitation.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">{invitation.inviteeName || invitation.inviteeEmail}</p>
                      <p className="text-sm text-gray-600">
                        {invitation.familyRole.replace('_', ' ')} • 
                        {invitation.linkedChildren?.length || 0} children • 
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {invitation.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInvitationAction(invitation.id, 'resend')}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInvitationAction(invitation.id, 'revoke', 'Revoked by parent')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: Open invitation details modal
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
