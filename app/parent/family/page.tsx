
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  UserPlus, 
  Activity, 
  Settings, 
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Import our family management components
import FamilyInvitationInterface from '@/components/family/family-invitation-interface'
import FamilyMemberDashboard from '@/components/family/family-member-dashboard'
import PermissionManagementDashboard from '@/components/family/permission-management-dashboard'
import ChildAccessManagement from '@/components/family/child-access-management'
import FamilyActivityLog from '@/components/family/family-activity-log'
import { FamilyMember, Child } from '@/types/family'

export default function FamilyManagementPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [children, setChildren] = useState<Child[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [currentView, setCurrentView] = useState<'dashboard' | 'permissions' | 'child-access'>('dashboard')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchChildren(),
        fetchFamilyMembers()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load family data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children || [])
      }
    } catch (error) {
      console.error('Error fetching children:', error)
    }
  }

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family/members')
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data.ownedFamilies || [])
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
    }
  }

  const handleEditMember = (member: FamilyMember) => {
    setSelectedMember(member)
    setCurrentView('permissions')
  }

  const handleManageChildAccess = (member: FamilyMember) => {
    setSelectedMember(member)
    setCurrentView('child-access')
  }

  const handleRemoveMember = async (member: FamilyMember) => {
    if (!confirm(`Are you sure you want to remove ${member.displayName || member.memberUser.name} from your family?`)) {
      return
    }

    try {
      const response = await fetch(`/api/family/members/${member.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Member Removed",
          description: `${member.displayName || member.memberUser.name} has been removed from your family`,
        })
        fetchFamilyMembers()
      } else {
        const result = await response.json()
        toast({
          title: "Error",
          description: result.error || "Failed to remove family member",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove family member",
        variant: "destructive"
      })
    }
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedMember(null)
    fetchFamilyMembers() // Refresh data
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If editing permissions for a specific member
  if (currentView === 'permissions' && selectedMember) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Back to Family Dashboard
          </Button>
        </div>
        <PermissionManagementDashboard
          familyMember={selectedMember}
          onPermissionsUpdated={handleBackToDashboard}
          onClose={handleBackToDashboard}
        />
      </div>
    )
  }

  // If managing child access for a specific member
  if (currentView === 'child-access' && selectedMember) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            ← Back to Family Dashboard
          </Button>
        </div>
        <ChildAccessManagement
          familyMember={selectedMember}
          availableChildren={children}
          onAccessUpdated={handleBackToDashboard}
          onClose={handleBackToDashboard}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Family Management</h1>
        </div>
        <p className="text-gray-600">
          Manage your family members, their permissions, and access to your children's information.
        </p>
      </div>

      {/* Family Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Family Members</p>
                <p className="text-2xl font-bold text-gray-900">{familyMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {familyMembers.filter(m => m.status === 'ACTIVE' && !m.isBlocked).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emergency Contacts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {familyMembers.filter(m => m.emergencyContact).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Family Members</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Invitations</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Activity Log</span>
          </TabsTrigger>
        </TabsList>

        {/* Family Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <FamilyMemberDashboard
            onEditMember={handleEditMember}
            onRemoveMember={handleRemoveMember}
            onManageChildAccess={handleManageChildAccess}
          />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-6">
          <FamilyInvitationInterface
            children={children}
            onInvitationSent={fetchFamilyMembers}
          />
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <FamilyActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  )
}
