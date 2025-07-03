
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, MessageCircle, X, FileText, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ChatMessage {
  id: string
  content: string
  senderType: 'USER' | 'AI' | 'AGENT' | 'SYSTEM'
  messageType: string
  aiGenerated?: boolean
  aiConfidence?: number
  createdAt: string
}

interface SuggestedArticle {
  title: string
  summary?: string
  slug: string
  category: string
}

interface AIChatWidgetProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  context?: {
    page?: string
    venueId?: string
  }
}

export function AIChatWidget({ isOpen, onClose, initialMessage, context }: AIChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [escalationInfo, setEscalationInfo] = useState<any>(null)
  const [suggestedArticles, setSuggestedArticles] = useState<SuggestedArticle[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleSendMessage(initialMessage)
    }
  }, [isOpen, initialMessage])

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || currentMessage.trim()
    if (!content) return

    setCurrentMessage('')
    setIsLoading(true)

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      senderType: 'USER',
      messageType: 'TEXT',
      createdAt: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/support/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          sessionId,
          context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Update session ID
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      // Add AI response
      if (data.aiMessage) {
        setMessages(prev => [...prev, data.aiMessage])
      }

      // Handle escalation
      if (data.escalation?.escalated) {
        setEscalationInfo(data.escalation)
      }

      // Update suggested articles
      if (data.suggestedArticles?.length > 0) {
        setSuggestedArticles(data.suggestedArticles)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again or contact support directly.',
        senderType: 'SYSTEM',
        messageType: 'TEXT',
        createdAt: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-500'
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 z-50 w-96 h-[600px] shadow-2xl"
    >
      <Card className="h-full flex flex-col bg-white border border-gray-200 overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">SafePlay AI</CardTitle>
                <p className="text-blue-100 text-sm">
                  {escalationInfo?.escalated ? 'Connecting to agent...' : 'AI Support Assistant'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-gray-500 py-8"
                >
                  <Bot className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium mb-2">Hi! I'm SafePlay AI</p>
                  <p className="text-sm">I'm here to help you with any questions about child safety, venue management, or using the SafePlay platform.</p>
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${message.senderType === 'USER' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`${
                        message.senderType === 'USER' 
                          ? 'bg-blue-500 text-white' 
                          : message.senderType === 'AI'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {message.senderType === 'USER' ? (
                          <User className="h-4 w-4" />
                        ) : message.senderType === 'AI' ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`space-y-1 ${message.senderType === 'USER' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-lg px-3 py-2 ${
                        message.senderType === 'USER'
                          ? 'bg-blue-500 text-white'
                          : message.senderType === 'AI'
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.aiGenerated && message.aiConfidence && (
                          <div className="flex items-center mt-2 space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(message.aiConfidence)}`} />
                            <span className="text-xs text-gray-500">
                              {Math.round(message.aiConfidence * 100)}% confidence
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <span className="text-xs text-gray-500 px-1">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Suggested Articles */}
              {suggestedArticles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t pt-4 mt-4"
                >
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Helpful Articles
                  </p>
                  <div className="space-y-2">
                    {suggestedArticles.map((article, index) => (
                      <motion.div
                        key={article.slug}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <a
                          href={`/support/knowledge-base/${article.slug}`}
                          target="_blank"
                          className="block p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900">{article.title}</p>
                              {article.summary && (
                                <p className="text-xs text-blue-700 mt-1 line-clamp-2">{article.summary}</p>
                              )}
                              <Badge variant="outline" className="mt-1 text-xs">
                                {article.category.replace('_', ' ')}
                              </Badge>
                            </div>
                            <ExternalLink className="h-3 w-3 text-blue-500 ml-2 flex-shrink-0" />
                          </div>
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Escalation Notice */}
              {escalationInfo?.escalated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                >
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Transferred to Human Agent
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {escalationInfo.reason}
                      </p>
                      {escalationInfo.waitingForAgent && (
                        <p className="text-xs text-yellow-600 mt-2">
                          Please wait while we connect you with a support agent...
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={escalationInfo?.escalated ? "Waiting for agent..." : "Type your message..."}
              disabled={isLoading || escalationInfo?.escalated}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !currentMessage.trim() || escalationInfo?.escalated}
              size="sm"
              className="px-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {escalationInfo?.escalated && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              This conversation will continue with a human agent
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
