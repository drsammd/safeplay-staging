
'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare, 
  Star,
  Bot,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'

interface SupportAnalytics {
  period: {
    startDate: string
    endDate: string
    totalDays: number
  }
  tickets: {
    total: number
    resolved: number
    closed: number
    resolutionRate: number
    avgResolutionTime: number
    avgFirstResponseTime: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    byCategory: Record<string, number>
  }
  satisfaction: {
    avgRating: number
    totalResponses: number
    npsScore: number
  }
  ai: {
    totalInteractions: number
    avgConfidence: number
    escalations: number
    escalationRate: number
  }
  chat: {
    totalSessions: number
    avgDuration: number
    avgWaitTime: number
    avgRating: number
  }
  knowledgeBase: {
    totalViews: number
    avgRating: number
  }
  agents: Array<{
    id: string
    user: { name: string; email: string }
    department: string
    agentLevel: string
    totalTicketsHandled: number
    avgResolutionTime: number
    avgSatisfactionRating: number
    escalationRate: number
    status: string
    isActive: boolean
  }>
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78']

export function SupportAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, selectedDepartment, selectedAgent])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }
      
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())
      
      if (selectedDepartment) params.append('department', selectedDepartment)
      if (selectedAgent) params.append('agentId', selectedAgent)

      const response = await fetch(`/api/support/analytics?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch support analytics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    if (minutes < 1440) return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`
    return `${Math.round(minutes / 1440)}d ${Math.round((minutes % 1440) / 60)}h`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load analytics</h3>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    )
  }

  // Prepare chart data
  const statusData = Object.entries(analytics.tickets.byStatus).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    color: COLORS[Object.keys(analytics.tickets.byStatus).indexOf(status) % COLORS.length]
  }))

  const priorityData = Object.entries(analytics.tickets.byPriority).map(([priority, count]) => ({
    name: priority,
    value: count
  }))

  const categoryData = Object.entries(analytics.tickets.byCategory).map(([category, count]) => ({
    name: category.replace(/_/g, ' ').toLowerCase(),
    value: count
  })).slice(0, 8) // Top 8 categories

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Support Analytics</h2>
          <p className="text-gray-600 mt-1">
            {analytics.period.startDate && analytics.period.endDate && (
              <>Performance insights from {new Date(analytics.period.startDate).toLocaleDateString()} to {new Date(analytics.period.endDate).toLocaleDateString()}</>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.tickets.total)}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {analytics.tickets.resolutionRate.toFixed(1)}% resolved
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                  <p className="text-3xl font-bold text-gray-900">{formatDuration(analytics.tickets.avgResolutionTime)}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    First response: {formatDuration(analytics.tickets.avgFirstResponseTime)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.satisfaction.avgRating.toFixed(1)}/5</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    {analytics.satisfaction.totalResponses} responses
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Efficiency</p>
                  <p className="text-3xl font-bold text-gray-900">{(100 - analytics.ai.escalationRate).toFixed(1)}%</p>
                  <p className="text-sm text-purple-600 mt-1">
                    {formatNumber(analytics.ai.totalInteractions)} interactions
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Tickets by Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {statusData.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Priority Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#60B5FF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI and Chat Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>AI Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Success Rate</span>
                  <span>{(100 - analytics.ai.escalationRate).toFixed(1)}%</span>
                </div>
                <Progress value={100 - analytics.ai.escalationRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Avg Confidence</span>
                  <span>{(analytics.ai.avgConfidence * 100).toFixed(1)}%</span>
                </div>
                <Progress value={analytics.ai.avgConfidence * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{formatNumber(analytics.ai.totalInteractions)}</p>
                  <p className="text-xs text-gray-600">Total Interactions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{analytics.ai.escalations}</p>
                  <p className="text-xs text-gray-600">Escalations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Chat Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.chat.totalSessions)}</p>
                  <p className="text-xs text-gray-600">Total Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{analytics.chat.avgRating.toFixed(1)}/5</p>
                  <p className="text-xs text-gray-600">Avg Rating</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Avg Duration</span>
                  <span>{formatDuration(analytics.chat.avgDuration)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Wait Time</span>
                  <span>{formatDuration(analytics.chat.avgWaitTime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Knowledge Base</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.knowledgeBase.totalViews)}</p>
                  <p className="text-xs text-gray-600">Total Views</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{analytics.knowledgeBase.avgRating.toFixed(1)}/5</p>
                  <p className="text-xs text-gray-600">Avg Article Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Agent Performance */}
      {analytics.agents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Agent Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.agents.slice(0, 5).map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {agent.user.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.user.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{agent.department}</Badge>
                          <Badge variant="outline">{agent.agentLevel}</Badge>
                          <Badge variant={agent.isActive ? "default" : "secondary"}>
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{agent.totalTicketsHandled}</p>
                        <p className="text-xs text-gray-600">Tickets</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{formatDuration(agent.avgResolutionTime)}</p>
                        <p className="text-xs text-gray-600">Avg Time</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{agent.avgSatisfactionRating.toFixed(1)}/5</p>
                        <p className="text-xs text-gray-600">Rating</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{agent.escalationRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">Escalation</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
