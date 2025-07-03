
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, UserPlus, Clock, Shield, Eye, Camera, Video, CreditCard, MapPin, FileText, Bell, Users } from "lucide-react"
import { defaultPermissions, type PermissionSet, type NotificationFrequency } from "@/lib/types/notification"

interface Child {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  profileImageUrl?: string
}

interface FamilyInvitationInterfaceProps {
  children: Child[]
  onInvitationSent?: () => void
}

// Role options
const roleOptions = [
  { value: 'SPOUSE', label: 'Spouse/Partner', description: 'Full access except family management' },
  { value: 'GRANDPARENT', label: 'Grandparent', description: 'View access with limited permissions' },
  { value: 'NANNY', label: 'Nanny/Caregiver', description: 'Care-focused permissions' },
  { value: 'GUARDIAN', label: 'Legal Guardian', description: 'Full access' },
  { value: 'EMERGENCY_CONTACT', label: 'Emergency Contact', description: 'Minimal access for emergencies' },
  { value: 'CUSTOM', label: 'Custom Role', description: 'Fully customizable permissions' }
]

export default function FamilyInvitationInterface({ children, onInvitationSent }: FamilyInvitationInterfaceProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [sentInvitations, setSentInvitations] = useState<any[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)

  // Form state with proper typing
  const [formData, setFormData] = useState<{
    inviteeEmail: string;
    inviteeName: string;
    familyRole: string;
    invitationMessage: string;
    linkedChildrenIds: string[];
    expirationDays: number;
    permissionSet: PermissionSet;
  }>({
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
      notificationFrequency: 'REAL_TIME'
    }
  })

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
      permissionSet: defaultPermissions[role] || prev.permissionSet
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
        description: "Please fill in all required fields",
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
        body: JSON.stringify({
          inviteeEmail: formData.inviteeEmail,
          inviteeName: formData.inviteeName,
          familyRole: formData.familyRole,
          invitationMessage: formData.invitationMessage,
          linkedChildrenIds: formData.linkedChildrenIds,
          expirationDays: formData.expirationDays,
          permissionSet: formData.permissionSet
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Invitation Sent!",
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
            notificationFrequency: 'REAL_TIME'
          }
        })

        fetchSentInvitations()
        onInvitationSent?.()
        setShowInviteForm(false)
      } else {
        const error = await response.json()
        toast({
          title: "Failed to Send Invitation",
          description: error.error || "An error occurred",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/family/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Invitation Cancelled",
          description: "The invitation has been cancelled"
        })
        fetchSentInvitations()
      } else {
        throw new Error('Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive"
      })
    }
  }

  const getPermissionDescription = (permission: string): string => {
    const descriptions: { [key: string]: string } = {
      canViewAllChildren: 'View all family children',
      canEditChildren: 'Edit children profiles',
      canCheckInOut: 'Check children in/out',
      canViewPhotos: 'View children photos',
      canViewVideos: 'View children videos',
      canPurchaseMedia: 'Purchase photos/videos',
      canReceiveAlerts: 'Receive safety alerts',
      canViewLocation: 'View children location',
      canViewReports: 'View activity reports',
      canManageFamily: 'Manage family members',
      canMakePayments: 'Make payments',
      emergencyContact: 'Emergency contact'
    }
    return descriptions[permission] || permission
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Family Management</h2>
          <p className="text-muted-foreground">Invite family members and manage permissions</p>
        </div>
        <Button onClick={() => setShowInviteForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Family Member
        </Button>
      </div>

      {/* Sent Invitations */}
      {sentInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Invitations you have sent that are waiting for response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{invitation.inviteeName || invitation.inviteeEmail}</span>
                    <Badge variant={invitation.status === 'PENDING' ? 'outline' : 'secondary'}>
                      {invitation.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Role: {invitation.familyRole} • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {invitation.status === 'PENDING' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invitation Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Family Member
              </CardTitle>
              <CardDescription>
                Send an invitation to add someone to your family
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteeEmail">Email Address *</Label>
                    <Input
                      id="inviteeEmail"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.inviteeEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, inviteeEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteeName">Name (Optional)</Label>
                    <Input
                      id="inviteeName"
                      placeholder="Enter their name"
                      value={formData.inviteeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, inviteeName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyRole">Family Role *</Label>
                  <Select value={formData.familyRole} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invitationMessage">Personal Message (Optional)</Label>
                  <Textarea
                    id="invitationMessage"
                    placeholder="Add a personal message to your invitation..."
                    value={formData.invitationMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, invitationMessage: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Child Access */}
              {children.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Child Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Select which children this family member will have access to
                  </p>
                  <div className="space-y-2">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`child-${child.id}`}
                          checked={formData.linkedChildrenIds.includes(child.id)}
                          onCheckedChange={(checked) => handleChildSelection(child.id, checked as boolean)}
                        />
                        <Label htmlFor={`child-${child.id}`} className="flex-1">
                          {child.firstName} {child.lastName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Permissions */}
              {formData.familyRole && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Permissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure what this family member can access and do
                  </p>

                  {/* Core Permissions */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Core Permissions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(formData.permissionSet).map(([permission, value]) => {
                        if (typeof value === 'boolean' && !['emergencyContact'].includes(permission)) {
                          return (
                            <div key={permission} className="flex items-center justify-between space-x-2">
                              <Label htmlFor={permission} className="text-sm flex-1">
                                {getPermissionDescription(permission)}
                              </Label>
                              <Switch
                                id={permission}
                                checked={value}
                                onCheckedChange={(checked) => handlePermissionChange(permission, checked)}
                              />
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>

                  {/* Access Levels */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Access Levels
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Photo Access</Label>
                        <Select 
                          value={formData.permissionSet.photoAccess} 
                          onValueChange={(value) => handlePermissionChange('photoAccess', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULL">Full Access</SelectItem>
                            <SelectItem value="RECENT_ONLY">Recent Only</SelectItem>
                            <SelectItem value="NO_ACCESS">No Access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Video Access</Label>
                        <Select 
                          value={formData.permissionSet.videoAccess} 
                          onValueChange={(value) => handlePermissionChange('videoAccess', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULL">Full Access</SelectItem>
                            <SelectItem value="RECENT_ONLY">Recent Only</SelectItem>
                            <SelectItem value="NO_ACCESS">No Access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Notification Frequency</Label>
                        <Select 
                          value={formData.permissionSet.notificationFrequency} 
                          onValueChange={(value: NotificationFrequency) => handlePermissionChange('notificationFrequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REAL_TIME">Real-time</SelectItem>
                            <SelectItem value="HOURLY">Hourly</SelectItem>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="EMERGENCY_ONLY">Emergency Only</SelectItem>
                            <SelectItem value="DISABLED">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="emergencyContact" className="text-sm">
                          Emergency Contact
                        </Label>
                        <Switch
                          id="emergencyContact"
                          checked={formData.permissionSet.emergencyContact}
                          onCheckedChange={(checked) => handlePermissionChange('emergencyContact', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Invitation Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Invitation Settings
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="expirationDays">Invitation Expires In (Days)</Label>
                  <Input
                    id="expirationDays"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.expirationDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 7 }))}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvitation}
                  disabled={isLoading || !formData.inviteeEmail || !formData.familyRole}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
