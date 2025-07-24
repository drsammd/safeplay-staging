
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Settings, 
  Shield, 
  AlertCircle, 
  Camera, 
  MapPin, 
  Bell, 
  Clock,
  UserCheck,
  UserX,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FamilyMember, Child } from '@/types/family'

interface FamilyMemberDashboardProps {
  onEditMember?: (member: FamilyMember) => void
  onRemoveMember?: (member: FamilyMember) => void
  onManageChildAccess?: (member: FamilyMember) => void
}

export default function FamilyMemberDashboard({ 
  onEditMember, 
  onRemoveMember, 
  onManageChildAccess 
}: FamilyMemberDashboardProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked' | 'emergency'>('all')

  useEffect(() => {
    fetchFamilyMembers()
  }, [])

  // Demo data for stakeholder presentations
  const getDemoFamilyMembers = () => [
    {
      id: 'demo-1',
      familyId: 'demo-family',
      memberId: 'demo-member-1',
      familyRole: 'SPOUSE',
      relationship: 'SPOUSE',
      displayName: 'Sarah Johnson',
      status: 'ACTIVE',
      isBlocked: false,
      emergencyContact: true,
      emergencyContactOrder: 1,
      joinedAt: '2024-01-15T00:00:00Z',
      lastActiveAt: '2025-01-07T10:30:00Z',
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
      notificationFrequency: 'REAL_TIME',
      member: {
        id: 'demo-member-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567',
        verificationLevel: 'VERIFIED'
      },
      childAccess: [
        {
          id: 'demo-access-1',
          accessLevel: 'FULL',
          child: {
            id: 'demo-child-1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://i.pinimg.com/736x/d8/3b/be/d83bbeaf83c9630677a83a8a89fe1c7c.jpg'
          }
        },
        {
          id: 'demo-access-2',
          accessLevel: 'FULL',
          child: {
            id: 'demo-child-2',
            firstName: 'Liam',
            lastName: 'Johnson',
            profilePhoto: 'https://i.pinimg.com/originals/4c/f6/45/4cf6452ddaa528ded02b8a3342bf73be.jpg'
          }
        }
      ]
    },
    {
      id: 'demo-2',
      familyId: 'demo-family',
      memberId: 'demo-member-2',
      familyRole: 'GRANDPARENT',
      relationship: 'GRANDPARENT',
      displayName: 'Robert Johnson',
      status: 'ACTIVE',
      isBlocked: false,
      emergencyContact: true,
      emergencyContactOrder: 2,
      joinedAt: '2024-02-20T00:00:00Z',
      lastActiveAt: '2025-01-06T15:45:00Z',
      canViewAllChildren: true,
      canEditChildren: false,
      canCheckInOut: true,
      canViewPhotos: true,
      canViewVideos: true,
      canPurchaseMedia: false,
      canReceiveAlerts: true,
      canViewLocation: true,
      canViewReports: false,
      canManageFamily: false,
      canMakePayments: false,
      photoAccess: 'FULL',
      videoAccess: 'THUMBNAILS_ONLY',
      notificationFrequency: 'DAILY',
      member: {
        id: 'demo-member-2',
        name: 'Robert Johnson',
        email: 'robert.johnson@email.com',
        phone: '+1 (555) 234-5678',
        verificationLevel: 'VERIFIED'
      },
      childAccess: [
        {
          id: 'demo-access-3',
          accessLevel: 'VIEW_ONLY',
          child: {
            id: 'demo-child-1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://cdn.openart.ai/uploads/image_gpymVPGl_1694873339084_512.webp'
          }
        },
        {
          id: 'demo-access-4',
          accessLevel: 'VIEW_ONLY',
          child: {
            id: 'demo-child-2',
            firstName: 'Liam',
            lastName: 'Johnson',
            profilePhoto: 'https://pics.craiyon.com/2023-07-02/a1ab3ce0c0f740ba97bc09d3d86c1ebd.webp'
          }
        }
      ]
    },
    {
      id: 'demo-3',
      familyId: 'demo-family',
      memberId: 'demo-member-3',
      familyRole: 'GRANDPARENT',
      relationship: 'GRANDPARENT',
      displayName: 'Linda Johnson',
      status: 'ACTIVE',
      isBlocked: false,
      emergencyContact: false,
      emergencyContactOrder: null,
      joinedAt: '2024-02-20T00:00:00Z',
      lastActiveAt: '2025-01-05T09:20:00Z',
      canViewAllChildren: true,
      canEditChildren: false,
      canCheckInOut: true,
      canViewPhotos: true,
      canViewVideos: false,
      canPurchaseMedia: true,
      canReceiveAlerts: false,
      canViewLocation: false,
      canViewReports: false,
      canManageFamily: false,
      canMakePayments: true,
      photoAccess: 'APPROVED_ONLY',
      videoAccess: 'NO_ACCESS',
      notificationFrequency: 'WEEKLY',
      member: {
        id: 'demo-member-3',
        name: 'Linda Johnson',
        email: 'linda.johnson@email.com',
        phone: '+1 (555) 345-6789',
        verificationLevel: 'VERIFIED'
      },
      childAccess: [
        {
          id: 'demo-access-5',
          accessLevel: 'SUPERVISED',
          child: {
            id: 'demo-child-1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://images.playground.com/895f5439454b47d89bec8b0e80b3bf19.jpeg'
          }
        }
      ]
    },
    {
      id: 'demo-4',
      familyId: 'demo-family',
      memberId: 'demo-member-4',
      familyRole: 'CAREGIVER',
      relationship: 'CAREGIVER',
      displayName: 'Maria Garcia',
      status: 'ACTIVE',
      isBlocked: false,
      emergencyContact: true,
      emergencyContactOrder: 3,
      joinedAt: '2024-03-10T00:00:00Z',
      lastActiveAt: '2025-01-07T16:15:00Z',
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
      notificationFrequency: 'REAL_TIME',
      member: {
        id: 'demo-member-4',
        name: 'Maria Garcia',
        email: 'maria.garcia@email.com',
        phone: '+1 (555) 456-7890',
        verificationLevel: 'VERIFIED'
      },
      childAccess: [
        {
          id: 'demo-access-6',
          accessLevel: 'SUPERVISED',
          child: {
            id: 'demo-child-1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f17f39e-4fb0-448c-9685-dc6eb7939984/dfv5vc1-3406be00-42ee-4ad1-b6a4-d0d208dcd103.png/v1/fill/w_894,h_894,q_70,strp/eight_years_old_girl_with_curly_brown_hair_by_mrjsaiart_dfv5vc1-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTAyNCIsInBhdGgiOiJcL2ZcLzRmMTdmMzllLTRmYjAtNDQ4Yy05Njg1LWRjNmViNzkzOTk4NFwvZGZ2NXZjMS0zNDA2YmUwMC00MmVlLTRhZDEtYjZhNC1kMGQyMDhkY2QxMDMucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.nqJrdUqOIOYACcm3b71qposLaxYtMp8K-4HTk45HbQ0'
          }
        },
        {
          id: 'demo-access-7',
          accessLevel: 'SUPERVISED',
          child: {
            id: 'demo-child-2',
            firstName: 'Liam',
            lastName: 'Johnson',
            profilePhoto: 'https://thumbs.dreamstime.com/b/portrait-little-years-old-boy-blonde-hair-standing-cheerful-smile-wearing-t-shirt-posing-against-black-studio-335269693.jpg'
          }
        }
      ]
    },
    {
      id: 'demo-5',
      familyId: 'demo-family',
      memberId: 'demo-member-5',
      familyRole: 'AUNT_UNCLE',
      relationship: 'AUNT_UNCLE',
      displayName: 'Michael Johnson',
      status: 'ACTIVE',
      isBlocked: false,
      emergencyContact: false,
      emergencyContactOrder: null,
      joinedAt: '2024-04-05T00:00:00Z',
      lastActiveAt: '2025-01-03T12:30:00Z',
      canViewAllChildren: false,
      canEditChildren: false,
      canCheckInOut: false,
      canViewPhotos: true,
      canViewVideos: false,
      canPurchaseMedia: true,
      canReceiveAlerts: false,
      canViewLocation: false,
      canViewReports: false,
      canManageFamily: false,
      canMakePayments: false,
      photoAccess: 'THUMBNAILS_ONLY',
      videoAccess: 'NO_ACCESS',
      notificationFrequency: 'DISABLED',
      member: {
        id: 'demo-member-5',
        name: 'Michael Johnson',
        email: 'michael.johnson@email.com',
        phone: '+1 (555) 567-8901',
        verificationLevel: 'UNVERIFIED'
      },
      childAccess: [
        {
          id: 'demo-access-8',
          accessLevel: 'LIMITED',
          child: {
            id: 'demo-child-1',
            firstName: 'Emma',
            lastName: 'Johnson',
            profilePhoto: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f17f39e-4fb0-448c-9685-dc6eb7939984/dfv5vc1-3406be00-42ee-4ad1-b6a4-d0d208dcd103.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzRmMTdmMzllLTRmYjAtNDQ4Yy05Njg1LWRjNmViNzkzOTk4NFwvZGZ2NXZjMS0zNDA2YmUwMC00MmVlLTRhZDEtYjZhNC1kMGQyMDhkY2QxMDMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.6QkF2IdfUkB6NxjvZpET8Xatr_XJM0QUkU5-Mexs4Qw'
          }
        }
      ]
    }
  ]

  const fetchFamilyMembers = async () => {
    try {
      setIsLoading(true)
      
      // First try to fetch from API
      const response = await fetch('/api/family/members')
      if (response.ok) {
        const data = await response.json()
        const apiFamilyMembers = data.ownedFamilies || []
        
        // CRITICAL FIX: Only use demo data for actual demo accounts
        if (apiFamilyMembers.length === 0) {
          // Check if this is the demo account by trying to get session
          const userResponse = await fetch('/api/auth/user')
          if (userResponse.ok) {
            const userData = await userResponse.json()
            if (userData.user?.email === 'parent@mysafeplay.ai') {
              console.log('🎭 Dashboard: Demo account parent@mysafeplay.ai - using demo family data')
              setFamilyMembers(getDemoFamilyMembers())
            } else {
              console.log('🧹 Dashboard: Real user account - keeping empty family for clean start')
              setFamilyMembers([])
            }
          } else {
            console.log('🧹 Dashboard: Cannot verify user - keeping empty family for clean start')
            setFamilyMembers([])
          }
        } else {
          setFamilyMembers(apiFamilyMembers)
        }
      } else {
        // CRITICAL FIX: Only use demo data for actual demo accounts on API failure
        const userResponse = await fetch('/api/auth/user')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.user?.email === 'parent@mysafeplay.ai') {
            console.log('🎭 Dashboard: Demo account API failure - using demo family data')
            setFamilyMembers(getDemoFamilyMembers())
          } else {
            console.log('🧹 Dashboard: Real user account API failure - keeping empty family for clean start')
            setFamilyMembers([])
          }
        } else {
          console.log('🧹 Dashboard: Cannot verify user on API failure - keeping empty family for clean start')
          setFamilyMembers([])
        }
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
      // CRITICAL FIX: Only use demo data for actual demo accounts on error
      try {
        const userResponse = await fetch('/api/auth/user')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.user?.email === 'parent@mysafeplay.ai') {
            console.log('🎭 Dashboard: Demo account error fallback - using demo family data')
            setFamilyMembers(getDemoFamilyMembers())
          } else {
            console.log('🧹 Dashboard: Real user account error - keeping empty family for clean start')
            setFamilyMembers([])
          }
        } else {
          console.log('🧹 Dashboard: Cannot verify user on error - keeping empty family for clean start')
          setFamilyMembers([])
        }
      } catch (userError) {
        console.log('🧹 Dashboard: User verification failed on error - keeping empty family for clean start')
        setFamilyMembers([])
      }
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SPOUSE':
        return 'bg-purple-100 text-purple-800'
      case 'GRANDPARENT':
        return 'bg-blue-100 text-blue-800'
      case 'NANNY':
        return 'bg-green-100 text-green-800'
      case 'EMERGENCY_CONTACT':
        return 'bg-red-100 text-red-800'
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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPermissionSummary = (member: FamilyMember) => {
    const permissions = []
    if (member.canViewPhotos) permissions.push('Photos')
    if (member.canViewVideos) permissions.push('Videos')
    if (member.canCheckInOut) permissions.push('Check-in/out')
    if (member.canViewLocation) permissions.push('Location')
    if (member.canPurchaseMedia) permissions.push('Purchases')
    return permissions.length > 0 ? permissions.join(', ') : 'Limited access'
  }

  const filteredMembers = familyMembers.filter(member => {
    switch (filter) {
      case 'active':
        return member.status === 'ACTIVE' && !member.isBlocked
      case 'blocked':
        return member.isBlocked
      case 'emergency':
        return member.emergencyContact
      default:
        return true
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Family Members</h2>
            <p className="text-sm text-gray-600">
              {familyMembers.length} family members with access to your children
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({familyMembers.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active ({familyMembers.filter(m => m.status === 'ACTIVE' && !m.isBlocked).length})
          </Button>
          <Button
            variant={filter === 'emergency' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('emergency')}
          >
            Emergency ({familyMembers.filter(m => m.emergencyContact).length})
          </Button>
          <Button
            variant={filter === 'blocked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('blocked')}
          >
            Blocked ({familyMembers.filter(m => m.isBlocked).length})
          </Button>
        </div>
      </div>

      {/* Family Members List */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Members</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't added any family members yet."
                : `No family members match the selected filter.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className={`transition-all hover:shadow-md ${member.isBlocked ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Member Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.member?.name} />
                      <AvatarFallback>
                        {member.member?.name?.charAt(0) || member.member?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">
                          {member.displayName || member.member?.name}
                        </h3>
                        
                        <Badge className={getRoleColor(member.familyRole)}>
                          {getRoleIcon(member.familyRole)} {member.familyRole.replace('_', ' ')}
                        </Badge>
                        
                        <Badge className={getStatusColor(member.status, member.isBlocked)}>
                          {member.isBlocked ? 'BLOCKED' : member.status}
                        </Badge>

                        {member.emergencyContact && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Emergency Contact
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{member.member?.email}</p>
                        {member.relationship && (
                          <p className="italic">{member.relationship}</p>
                        )}
                        <p>
                          Joined {new Date(member.joinedAt).toLocaleDateString()} • 
                          {member.lastActiveAt ? (
                            ` Last active ${new Date(member.lastActiveAt).toLocaleDateString()}`
                          ) : (
                            ' Never logged in'
                          )}
                        </p>
                      </div>

                      {/* Child Access Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            Access to {member.childAccess?.length || 0} children
                          </span>
                        </div>
                        
                        {(member.childAccess?.length || 0) > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {member.childAccess?.map((access) => (
                              <div key={access.id} className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1">
                                {access.child.profilePhoto && (
                                  <img 
                                    src={access.child.profilePhoto} 
                                    alt={`${access.child.firstName}`}
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                )}
                                <span className="text-xs">
                                  {access.child.firstName} ({access.accessLevel})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Permissions Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Permissions</span>
                        </div>
                        <p className="text-sm text-gray-600">{getPermissionSummary(member)}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {member.canViewPhotos && (
                            <div className="flex items-center space-x-1">
                              <Camera className="h-3 w-3" />
                              <span>Photos</span>
                            </div>
                          )}
                          {member.canViewLocation && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>Location</span>
                            </div>
                          )}
                          {member.canReceiveAlerts && (
                            <div className="flex items-center space-x-1">
                              <Bell className="h-3 w-3" />
                              <span>{member.notificationFrequency?.replace('_', ' ') || 'Not set'}</span>
                            </div>
                          )}
                          {member.canCheckInOut && (
                            <div className="flex items-center space-x-1">
                              <UserCheck className="h-3 w-3" />
                              <span>Check-in/out</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditMember?.(member)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManageChildAccess?.(member)}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Child Access
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRemoveMember?.(member)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
