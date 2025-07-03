
'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  FileText, 
  BarChart3, 
  Settings, 
  Users, 
  Bot,
  HelpCircle,
  Search,
  Plus,
  Bell,
  Menu,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from 'next-auth/react'
import { AIChatWidget } from './ai-chat-widget'
import { SupportTicketDashboard } from './support-ticket-dashboard'
import { KnowledgeBaseInterface } from './knowledge-base-interface'
import { SupportAnalyticsDashboard } from './support-analytics-dashboard'

interface SupportCenterLayoutProps {
  initialTab?: string
  showChat?: boolean
}

export function SupportCenterLayout({ initialTab = 'overview', showChat = true }: SupportCenterLayoutProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [stats, setStats] = useState({
    openTickets: 0,
    avgResponseTime: 0,
    satisfactionScore: 0,
    kbViews: 0
  })

  useEffect(() => {
    fetchQuickStats()
  }, [])

  const fetchQuickStats = async () => {
    try {
      // This would be a lightweight endpoint for dashboard stats
      const response = await fetch('/api/support/analytics?summary=true')
      if (response.ok) {
        const data = await response.json()
        setStats({
          openTickets: data.tickets?.total || 0,
          avgResponseTime: data.tickets?.avgFirstResponseTime || 0,
          satisfactionScore: data.satisfaction?.avgRating || 0,
          kbViews: data.knowledgeBase?.totalViews || 0
        })
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    if (minutes < 1440) return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`
    return `${Math.round(minutes / 1440)}d`
  }

  const canViewAnalytics = session?.user?.role === 'COMPANY_ADMIN' || session?.user?.role === 'VENUE_ADMIN'
  const canManageAgents = session?.user?.role === 'COMPANY_ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
              <p className="text-gray-600 mt-1">Get help and manage support requests</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {showChat && (
                <Button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Bot className="h-4 w-4" />
                  <span>Ask AI Assistant</span>
                </Button>
              )}
              
              <Button variant="outline" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Ticket</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            
            <TabsTrigger value="tickets" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            
            <TabsTrigger value="knowledge-base" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Knowledge Base</span>
            </TabsTrigger>
            
            {canViewAnalytics && (
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            )}
            
            {canManageAgents && (
              <TabsTrigger value="agents" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Agents</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab stats={stats} userRole={session?.user?.role} />
          </TabsContent>

          <TabsContent value="tickets">
            <SupportTicketDashboard />
          </TabsContent>

          <TabsContent value="knowledge-base">
            <KnowledgeBaseInterface />
          </TabsContent>

          {canViewAnalytics && (
            <TabsContent value="analytics">
              <SupportAnalyticsDashboard />
            </TabsContent>
          )}

          {canManageAgents && (
            <TabsContent value="agents">
              <AgentManagementTab />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <SupportSettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Chat Widget */}
      {showChat && (
        <AIChatWidget
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          context={{
            page: '/support',
            venueId: undefined // Could be passed in if venue-specific
          }}
        />
      )}
    </div>
  )
}

function OverviewTab({ stats, userRole }: { stats: any; userRole?: string }) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.openTickets}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">{formatDuration(stats.avgResponseTime)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.satisfactionScore.toFixed(1)}/5</p>
                </div>
                <Users className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">KB Views</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.kbViews}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create New Ticket
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search Knowledge Base
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Bot className="h-4 w-4 mr-2" />
                Chat with AI Assistant
              </Button>

              {userRole === 'COMPANY_ADMIN' && (
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle>Popular Help Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Setting up face recognition</span>
                  <Badge variant="secondary">Guide</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Camera installation help</span>
                  <Badge variant="secondary">Video</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Parent mobile app setup</span>
                  <Badge variant="secondary">Tutorial</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Billing and subscriptions</span>
                  <Badge variant="secondary">FAQ</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Emergency procedures</span>
                  <Badge variant="secondary">Policy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Support Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Bot className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">AI resolved 23 tickets automatically today</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New article published: "Camera Troubleshooting Guide"</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Users className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">3 new support agents onboarded</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function AgentManagementTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Management</CardTitle>
          <p className="text-sm text-gray-600">Manage support agents and their performance</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Management</h3>
            <p className="text-gray-500 mb-4">This section would contain detailed agent management features</p>
            <Button>Add New Agent</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SupportSettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Support Settings</CardTitle>
          <p className="text-sm text-gray-600">Configure support system preferences and AI settings</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Support Configuration</h3>
            <p className="text-gray-500 mb-4">Configure AI chatbot settings, escalation rules, and more</p>
            <Button>Configure Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
