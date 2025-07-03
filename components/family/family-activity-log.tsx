
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity, 
  Filter, 
  Calendar, 
  User, 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface ActivityLog {
  id: string
  actionType: string
  resourceType: string
  actionDescription: string
  actionData?: any
  impactLevel: string
  status: string
  timestamp: string
  familyOwner?: {
    id: string
    name: string
    email: string
  }
  actor?: {
    id: string
    name: string
    email: string
  }
  target?: {
    id: string
    name: string
    email: string
  }
}

interface FamilyActivityLogProps {
  familyOwnerId?: string
}

const actionTypeLabels = {
  INVITE_MEMBER: 'Member Invited',
  ACCEPT_INVITATION: 'Invitation Accepted',
  DECLINE_INVITATION: 'Invitation Declined',
  REVOKE_INVITATION: 'Invitation Revoked',
  REMOVE_MEMBER: 'Member Removed',
  BLOCK_MEMBER: 'Member Blocked',
  UNBLOCK_MEMBER: 'Member Unblocked',
  UPDATE_PERMISSIONS: 'Permissions Updated',
  GRANT_CHILD_ACCESS: 'Child Access Granted',
  REVOKE_CHILD_ACCESS: 'Child Access Revoked',
  CHANGE_ROLE: 'Role Changed',
  UPDATE_PROFILE: 'Profile Updated',
  EMERGENCY_OVERRIDE: 'Emergency Override',
  PERMISSION_VIOLATION: 'Permission Violation'
}

const actionTypeIcons = {
  INVITE_MEMBER: UserPlus,
  ACCEPT_INVITATION: CheckCircle,
  DECLINE_INVITATION: XCircle,
  REVOKE_INVITATION: XCircle,
  REMOVE_MEMBER: UserMinus,
  BLOCK_MEMBER: AlertTriangle,
  UNBLOCK_MEMBER: CheckCircle,
  UPDATE_PERMISSIONS: Shield,
  GRANT_CHILD_ACCESS: Users,
  REVOKE_CHILD_ACCESS: AlertTriangle,
  CHANGE_ROLE: Settings,
  UPDATE_PROFILE: User,
  EMERGENCY_OVERRIDE: AlertTriangle,
  PERMISSION_VIOLATION: AlertTriangle
}

const impactLevelColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
}

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  ROLLED_BACK: 'bg-orange-100 text-orange-800'
}

export default function FamilyActivityLog({ familyOwnerId }: FamilyActivityLogProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    actionType: 'all',
    resourceType: 'all',
    impactLevel: 'all',
    startDate: '',
    endDate: '',
    targetId: '',
    page: 1,
    limit: 20
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    fetchActivityLogs()
  }, [filters])

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true)
      
      const searchParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/family/activity-logs?${searchParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActivityLogs(data.activityLogs || [])
        setPagination(data.pagination || {})
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const getActionIcon = (actionType: string) => {
    const IconComponent = actionTypeIcons[actionType as keyof typeof actionTypeIcons] || Activity
    return <IconComponent className="h-4 w-4" />
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getActionDescription = (log: ActivityLog) => {
    if (log.actionDescription) {
      return log.actionDescription
    }
    
    const actionLabel = actionTypeLabels[log.actionType as keyof typeof actionTypeLabels] || log.actionType
    const actorName = log.actor?.name || 'Someone'
    const targetName = log.target?.name || ''
    
    return targetName ? `${actorName} - ${actionLabel} - ${targetName}` : `${actorName} - ${actionLabel}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Family Activity Log</h2>
            <p className="text-sm text-gray-600">Track all family member activities and changes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="actionType">Action Type</Label>
              <Select value={filters.actionType} onValueChange={(value) => handleFilterChange('actionType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resourceType">Resource</Label>
              <Select value={filters.resourceType} onValueChange={(value) => handleFilterChange('resourceType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="FAMILY_MEMBER">Family Member</SelectItem>
                  <SelectItem value="INVITATION">Invitation</SelectItem>
                  <SelectItem value="CHILD_ACCESS">Child Access</SelectItem>
                  <SelectItem value="PERMISSION">Permission</SelectItem>
                  <SelectItem value="ROLE">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impactLevel">Impact Level</Label>
              <Select value={filters.impactLevel} onValueChange={(value) => handleFilterChange('impactLevel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  actionType: 'all',
                  resourceType: 'all',
                  impactLevel: 'all',
                  startDate: '',
                  endDate: '',
                  targetId: '',
                  page: 1,
                  limit: 20
                })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <div className="text-sm text-gray-600">
              {pagination.total} total activities
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
              <p className="text-gray-600">No family activities match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  {/* Action Icon */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                      {getActionIcon(log.actionType)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {actionTypeLabels[log.actionType as keyof typeof actionTypeLabels] || log.actionType}
                        </p>
                        <Badge className={impactLevelColors[log.impactLevel as keyof typeof impactLevelColors]}>
                          {log.impactLevel}
                        </Badge>
                        <Badge className={statusColors[log.status as keyof typeof statusColors]}>
                          {log.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {getActionDescription(log)}
                    </p>

                    {/* Actor and Target */}
                    <div className="flex items-center space-x-4 mt-2">
                      {log.actor && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {log.actor.name?.charAt(0) || log.actor.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">{log.actor.name || log.actor.email}</span>
                        </div>
                      )}

                      {log.target && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">→</span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {log.target.name?.charAt(0) || log.target.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">{log.target.name || log.target.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Details Icon */}
                  <div className="flex-shrink-0">
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getActionIcon(selectedLog.actionType)}
                  <span>{actionTypeLabels[selectedLog.actionType as keyof typeof actionTypeLabels] || selectedLog.actionType}</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {new Date(selectedLog.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">{getActionDescription(selectedLog)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Impact Level</h4>
                  <Badge className={impactLevelColors[selectedLog.impactLevel as keyof typeof impactLevelColors]}>
                    {selectedLog.impactLevel}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className={statusColors[selectedLog.status as keyof typeof statusColors]}>
                    {selectedLog.status}
                  </Badge>
                </div>
              </div>

              {selectedLog.actor && (
                <div>
                  <h4 className="font-medium mb-2">Performed By</h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedLog.actor.name?.charAt(0) || selectedLog.actor.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedLog.actor.name}</p>
                      <p className="text-xs text-gray-500">{selectedLog.actor.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.target && (
                <div>
                  <h4 className="font-medium mb-2">Target</h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {selectedLog.target.name?.charAt(0) || selectedLog.target.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedLog.target.name}</p>
                      <p className="text-xs text-gray-500">{selectedLog.target.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.actionData && (
                <div>
                  <h4 className="font-medium mb-2">Additional Details</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedLog.actionData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
