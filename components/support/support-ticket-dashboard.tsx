
'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  User, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Tag,
  ArrowUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface SupportTicket {
  id: string
  ticketNumber: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  severity: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  venue?: {
    id: string
    name: string
  }
  assignedTo?: {
    user: {
      name: string
      email: string
    }
  }
  _count?: {
    messages: number
  }
}

interface CreateTicketData {
  title: string
  description: string
  category: string
  priority: string
  severity: string
  venueId?: string
}

const CATEGORIES = [
  'TECHNICAL_ISSUE',
  'ACCOUNT_BILLING', 
  'CHILD_SAFETY',
  'VENUE_SETUP',
  'FEATURE_REQUEST',
  'BUG_REPORT',
  'CAMERA_SUPPORT',
  'FACE_RECOGNITION',
  'ALERTS_NOTIFICATIONS',
  'CHECK_IN_OUT',
  'SUBSCRIPTION',
  'PAYMENT',
  'VERIFICATION',
  'MOBILE_APP',
  'GENERAL_INQUIRY',
  'EMERGENCY',
  'COMPLAINT',
  'FEEDBACK'
]

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']
const SEVERITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL']
const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_VENDOR', 'RESOLVED', 'CLOSED', 'REOPENED', 'ESCALATED', 'ON_HOLD']

export function SupportTicketDashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPriority, setSelectedPriority] = useState<string>('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchTickets()
  }, [searchQuery, selectedCategory, selectedStatus, selectedPriority, pagination.page])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedPriority) params.append('priority', selectedPriority)

      const response = await fetch(`/api/support/tickets?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }))
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch support tickets',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (data: CreateTicketData) => {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create ticket')

      const newTicket = await response.json()
      setTickets(prev => [newTicket, ...prev])
      setIsCreateDialogOpen(false)
      
      toast({
        title: 'Success',
        description: `Ticket ${newTicket.ticketNumber} created successfully`
      })
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast({
        title: 'Error',
        description: 'Failed to create support ticket',
        variant: 'destructive'
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500 text-white'
      case 'URGENT': return 'bg-orange-500 text-white'
      case 'HIGH': return 'bg-yellow-500 text-white'
      case 'MEDIUM': return 'bg-blue-500 text-white'
      case 'LOW': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      case 'ESCALATED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="h-4 w-4" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" />
      case 'CLOSED': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600 mt-1">Manage and track support requests</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Ticket</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <CreateTicketForm onSubmit={createTicket} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {formatCategoryName(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {PRIORITIES.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {formatCategoryName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-0">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                            #{ticket.ticketNumber} - {ticket.title}
                          </h3>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(ticket.status)}
                              <span>{formatCategoryName(ticket.status)}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{ticket.user.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Tag className="h-4 w-4" />
                            <span>{formatCategoryName(ticket.category)}</span>
                          </div>

                          {ticket._count?.messages && (
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{ticket._count.messages} messages</span>
                            </div>
                          )}

                          {ticket.assignedTo && (
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>Assigned to {ticket.assignedTo.user.name}</span>
                            </div>
                          )}

                          {ticket.venue && (
                            <div className="flex items-center space-x-1">
                              <span>Venue: {ticket.venue.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {tickets.length === 0 && !loading && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-500">Try adjusting your search filters or create a new ticket.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
          </p>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateTicketForm({ onSubmit }: { onSubmit: (data: CreateTicketData) => void }) {
  const [formData, setFormData] = useState<CreateTicketData>({
    title: '',
    description: '',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
    severity: 'NORMAL'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Brief description of the issue"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the issue or request"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {formatCategoryName(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="severity">Severity</Label>
        <Select value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map(severity => (
              <SelectItem key={severity} value={severity}>
                {severity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Create Ticket
        </Button>
      </div>
    </form>
  )
}

function formatCategoryName(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}
