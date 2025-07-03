
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  UserCheck, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Camera,
  MapPin,
  Bell,
  CreditCard
} from 'lucide-react'

interface Child {
  id: string
  firstName: string
  lastName: string
  profilePhoto?: string
}

interface Invitation {
  id: string
  inviterUserId: string
  inviteeEmail: string
  inviteeName?: string
  familyRole: string
  invitationMessage?: string
  invitationToken: string
  status: string
  linkedChildrenIds?: string[]
  linkedChildren?: Child[]
  permissionSet: any
  expiresAt: string
  sentAt: string
  inviter: {
    id: string
    name: string
    email: string
  }
}

interface InvitationAcceptanceWorkflowProps {
  token?: string
  invitationId?: string
  onAcceptanceComplete?: () => void
}

export default function InvitationAcceptanceWorkflow({ 
  token, 
  invitationId, 
  onAcceptanceComplete 
}: InvitationAcceptanceWorkflowProps) {
  const { toast } = useToast()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState<'review' | 'account' | 'confirm'>('review')
  
  // Account creation form
  const [accountForm, setAccountForm] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    createAccount: false
  })

  // Existing user login
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    if (token) {
      fetchInvitationByToken()
    } else if (invitationId) {
      fetchInvitationById()
    }
  }, [token, invitationId])

  const fetchInvitationByToken = async () => {
    if (!token) return
    
    try {
      setIsLoading(true)
      // For public invitation acceptance, we would need a public endpoint
      // For now, we'll simulate this with the token
      const response = await fetch(`/api/family/invitations/accept-by-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, validateOnly: true })
      })

      if (response.ok) {
        const data = await response.json()
        setInvitation(data.invitation)
        
        // Pre-fill invitee name if available
        if (data.invitation.inviteeName) {
          setAccountForm(prev => ({
            ...prev,
            name: data.invitation.inviteeName
          }))
        }
      } else {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invitation details.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInvitationById = async () => {
    if (!invitationId) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/family/invitations/${invitationId}`)
      
      if (response.ok) {
        const data = await response.json()
        setInvitation(data)
      } else {
        toast({
          title: "Not Found",
          description: "Invitation not found.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invitation details.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!invitation) return

    setIsLoading(true)
    try {
      let response
      
      if (token) {
        // Public acceptance via token
        response = await fetch('/api/family/invitations/accept-by-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            createAccount: accountForm.createAccount,
            accountData: accountForm.createAccount ? {
              name: accountForm.name,
              password: accountForm.password
            } : undefined
          })
        })
      } else {
        // Authenticated acceptance
        response = await fetch(`/api/family/invitations/${invitation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'accept' })
        })
      }

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Invitation Accepted",
          description: "You have successfully joined the family!",
        })
        
        setStep('confirm')
        onAcceptanceComplete?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to accept invitation",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeclineInvitation = async () => {
    if (!invitation) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/family/invitations/${invitation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'decline' })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Invitation Declined",
          description: "You have declined the family invitation.",
        })
        
        onAcceptanceComplete?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to decline invitation",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SPOUSE':
        return '👫'
      case 'GRANDPARENT':
        return '👴'
      case 'SIBLING':
        return '👦'
      case 'NANNY':
        return '👩‍🍼'
      case 'EMERGENCY_CONTACT':
        return '🚨'
      default:
        return '👤'
    }
  }

  const getRoleDescription = (role: string) => {
    const descriptions = {
      SPOUSE: 'Full access similar to parent',
      GRANDPARENT: 'View access with some interaction',
      SIBLING: 'Limited access for older siblings',
      RELATIVE: 'Other family member with customizable access',
      FRIEND: 'Limited view access',
      NANNY: 'Care-related access, no purchases',
      BABYSITTER: 'Temporary care access',
      TEACHER: 'Educational context access',
      GUARDIAN: 'Full access',
      EMERGENCY_CONTACT: 'Minimal access for emergencies',
      CUSTOM: 'Fully customizable permissions'
    }
    return descriptions[role as keyof typeof descriptions] || 'Custom family role'
  }

  const getPermissionSummary = (permissions: any) => {
    const perms = []
    if (permissions.canViewPhotos) perms.push('View photos')
    if (permissions.canViewVideos) perms.push('View videos')
    if (permissions.canCheckInOut) perms.push('Check-in/out')
    if (permissions.canViewLocation) perms.push('View location')
    if (permissions.canReceiveAlerts) perms.push('Receive alerts')
    if (permissions.canPurchaseMedia) perms.push('Purchase media')
    return perms
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation Not Found</h3>
          <p className="text-gray-600">
            This invitation link is invalid or has expired.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expiresAt) < new Date()
  if (isExpired) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation Expired</h3>
          <p className="text-gray-600">
            This invitation expired on {new Date(invitation.expiresAt).toLocaleDateString()}.
            Please contact {invitation.inviter.name} for a new invitation.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Check if invitation is already processed
  if (invitation.status !== 'PENDING') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          {invitation.status === 'ACCEPTED' ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Already Accepted</h3>
              <p className="text-gray-600">This invitation has already been accepted.</p>
            </>
          ) : invitation.status === 'DECLINED' ? (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation Declined</h3>
              <p className="text-gray-600">This invitation was declined.</p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation {invitation.status}</h3>
              <p className="text-gray-600">This invitation is no longer available.</p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'confirm') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to the Family!</h3>
          <p className="text-gray-600 mb-4">
            You have successfully joined {invitation.inviter.name}'s family on SafePlay.
          </p>
          <Button className="w-full" onClick={() => window.location.href = '/parent'}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Invitation Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Family Invitation</CardTitle>
              <CardDescription>You've been invited to join a family on SafePlay</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inviter Information */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {invitation.inviter.name?.charAt(0) || invitation.inviter.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{invitation.inviter.name}</p>
              <p className="text-sm text-gray-600">{invitation.inviter.email}</p>
              <p className="text-sm text-gray-500">has invited you to join their family</p>
            </div>
          </div>

          {/* Role Information */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">
                {getRoleIcon(invitation.familyRole)} {invitation.familyRole.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-gray-600">{getRoleDescription(invitation.familyRole)}</span>
            </div>
          </div>

          {/* Personal Message */}
          {invitation.invitationMessage && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Personal Message</h4>
              <p className="text-blue-800 text-sm">{invitation.invitationMessage}</p>
            </div>
          )}

          {/* Children Access */}
          {invitation.linkedChildren && invitation.linkedChildren.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">You'll have access to these children:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invitation.linkedChildren.map((child) => (
                  <div key={child.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {child.profilePhoto && (
                      <img 
                        src={child.profilePhoto} 
                        alt={`${child.firstName} ${child.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{child.firstName} {child.lastName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Summary */}
          <div>
            <h4 className="font-medium mb-3">Your permissions will include:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {getPermissionSummary(invitation.permissionSet).map((permission, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{permission}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expiration Notice */}
          <div className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Account Setup (for token-based invitations) */}
      {token && step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Account Setup</CardTitle>
            <CardDescription>
              To accept this invitation, you need a SafePlay account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createAccount"
                  checked={accountForm.createAccount}
                  onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, createAccount: Boolean(checked) }))}
                />
                <Label htmlFor="createAccount">Create a new SafePlay account</Label>
              </div>

              {accountForm.createAccount && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={accountForm.password}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Choose a secure password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={accountForm.confirmPassword}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={accountForm.acceptTerms}
                      onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, acceptTerms: Boolean(checked) }))}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      I agree to the Terms of Service and Privacy Policy
                    </Label>
                  </div>
                </div>
              )}

              {!accountForm.createAccount && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    If you already have a SafePlay account, please sign in to accept this invitation.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Button 
              onClick={handleAcceptInvitation}
              disabled={isLoading || (token && !!accountForm.createAccount && (!accountForm.name || !accountForm.password || !accountForm.acceptTerms || accountForm.password !== accountForm.confirmPassword))}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDeclineInvitation}
              disabled={isLoading}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
