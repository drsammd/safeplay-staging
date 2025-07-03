
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

  const fetchFamilyMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/family/members')
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data.ownedFamilies || [])
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
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
                      <AvatarImage src={member.memberUser.name} />
                      <AvatarFallback>
                        {member.memberUser.name?.charAt(0) || member.memberUser.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">
                          {member.displayName || member.memberUser.name}
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
                        <p>{member.memberUser.email}</p>
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
