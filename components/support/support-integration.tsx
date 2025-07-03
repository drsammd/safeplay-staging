
'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, HelpCircle, Book, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIChatWidget } from './ai-chat-widget'

interface SupportIntegrationProps {
  context?: {
    page?: string
    venueId?: string
    feature?: string
  }
  showQuickHelp?: boolean
  showChatButton?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

// Quick Help Widget - can be embedded in any page
export function SupportQuickHelp({ context, showQuickHelp = true, showChatButton = true, position = 'bottom-right' }: SupportIntegrationProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [quickHelp, setQuickHelp] = useState<any[]>([])
  const [isMinimized, setIsMinimized] = useState(true)

  useEffect(() => {
    if (context?.page) {
      fetchContextualHelp()
    }
  }, [context])

  const fetchContextualHelp = async () => {
    try {
      // This would fetch contextual help based on the current page/feature
      const params = new URLSearchParams()
      if (context?.page) params.append('page', context.page)
      if (context?.feature) params.append('feature', context.feature)
      
      const response = await fetch(`/api/support/knowledge-base/search?${params}&limit=3`)
      if (response.ok) {
        const data = await response.json()
        setQuickHelp(data.articles?.slice(0, 3) || [])
      }
    } catch (error) {
      console.error('Error fetching contextual help:', error)
    }
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4', 
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  if (!showQuickHelp && !showChatButton) return null

  return (
    <>
      {/* Floating Support Widget */}
      <div className={`fixed ${positionClasses[position]} z-40 space-y-2`}>
        {/* Quick Help Panel */}
        {showQuickHelp && quickHelp.length > 0 && !isMinimized && (
          <Card className="w-80 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Book className="h-4 w-4 mr-2" />
                  Quick Help
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-2">
                {quickHelp.map((article) => (
                  <a
                    key={article.slug}
                    href={`/support/knowledge-base/${article.slug}`}
                    className="block p-2 hover:bg-gray-50 rounded text-sm"
                    target="_blank"
                  >
                    <p className="font-medium text-gray-900 line-clamp-1">{article.title}</p>
                    {article.summary && (
                      <p className="text-gray-600 line-clamp-2 mt-1">{article.summary}</p>
                    )}
                  </a>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <a 
                  href="/support"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all help articles →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {showQuickHelp && quickHelp.length > 0 && isMinimized && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="shadow-lg bg-white"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          )}
          
          {showChatButton && (
            <Button
              onClick={() => setIsChatOpen(true)}
              className="shadow-lg"
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Get Help
            </Button>
          )}
        </div>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={context}
      />
    </>
  )
}

// Support Status Badge - shows unread tickets, active chats etc
export function SupportStatusBadge() {
  const [status, setStatus] = useState({
    unreadTickets: 0,
    activeChatSessions: 0,
    pendingActions: 0
  })

  useEffect(() => {
    fetchSupportStatus()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchSupportStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSupportStatus = async () => {
    try {
      const response = await fetch('/api/support/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching support status:', error)
    }
  }

  const totalNotifications = status.unreadTickets + status.activeChatSessions + status.pendingActions

  if (totalNotifications === 0) return null

  return (
    <Badge variant="destructive" className="animate-pulse">
      <AlertCircle className="h-3 w-3 mr-1" />
      {totalNotifications}
    </Badge>
  )
}

// Contextual Help Tooltip - shows relevant help for specific UI elements
export function ContextualHelpTooltip({ 
  feature, 
  children 
}: { 
  feature: string
  children: React.ReactNode 
}) {
  const [helpContent, setHelpContent] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (feature && isVisible) {
      fetchFeatureHelp()
    }
  }, [feature, isVisible])

  const fetchFeatureHelp = async () => {
    try {
      const response = await fetch(`/api/support/knowledge-base/search?feature=${feature}&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.articles?.[0]) {
          setHelpContent(data.articles[0].summary || data.articles[0].title)
        }
      }
    } catch (error) {
      console.error('Error fetching feature help:', error)
    }
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && helpContent && (
        <div className="absolute z-50 w-64 p-3 mt-2 text-sm bg-white border rounded-lg shadow-lg">
          <p className="text-gray-700">{helpContent}</p>
          <a 
            href="/support"
            className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Learn more →
          </a>
        </div>
      )}
    </div>
  )
}

// Support Navigation Menu Item
export function SupportNavItem() {
  return (
    <a
      href="/support"
      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
    >
      <HelpCircle className="h-4 w-4" />
      <span>Support</span>
      <SupportStatusBadge />
    </a>
  )
}
