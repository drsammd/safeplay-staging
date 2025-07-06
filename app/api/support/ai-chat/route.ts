
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  context: z.object({
    page: z.string().optional(),
    userRole: z.string().optional(),
    venueId: z.string().optional()
  }).optional()
})

// Get or create AI chat configuration
async function getAIChatConfig() {
  let config = await db.aIChatConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })

  if (!config) {
    // Create default configuration
    config = await db.aIChatConfig.create({
      data: {
        name: 'Default SafePlay Support AI',
        isActive: true,
        aiModel: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.7,
        systemPrompt: `You are SafePlay AI, an intelligent support assistant for SafePlay, a comprehensive child safety and venue management platform. 

SafePlay provides:
- Child tracking and safety monitoring in entertainment venues
- Face recognition technology for child identification  
- Real-time alerts and notifications for parents
- Venue management tools for staff
- Mobile apps for parents and venue administrators
- Check-in/check-out systems
- Emergency response protocols

Your role:
- Provide helpful, accurate information about SafePlay features
- Search knowledge base for relevant articles
- Guide users to appropriate solutions
- Escalate complex issues to human agents
- Maintain a friendly, professional tone
- Focus on child safety and peace of mind

Always prioritize child safety concerns and escalate emergency situations immediately.`,
        welcomeMessage: 'Hi! I\'m SafePlay AI, your intelligent support assistant. I\'m here to help you with any questions about child safety, venue management, or using the SafePlay platform. How can I assist you today?',
        escalationPrompt: `Should this conversation be escalated to a human agent? Consider escalating if:
- User expresses frustration or dissatisfaction
- Technical issue requires complex troubleshooting
- Emergency or safety-critical situation
- Request for refund, billing disputes, or account changes
- Complex venue setup or configuration
- Legal or compliance questions
- User specifically requests human agent

Respond with "ESCALATE" if yes, or "CONTINUE" if AI can handle it.`,
        escalationConfidenceThreshold: 0.6,
        maxAIInteractions: 8,
        escalationTimeLimit: 15,
        kbIntegrationEnabled: true,
        kbSearchLimit: 3,
        ticketCreationEnabled: true,
        escalationKeywords: JSON.stringify([
          'human agent', 'speak to person', 'escalate', 'manager', 'supervisor',
          'frustrated', 'angry', 'terrible', 'awful', 'emergency', 'urgent',
          'billing issue', 'refund', 'cancel subscription', 'legal', 'lawsuit',
          'not working', 'broken', 'bug', 'error', 'crashed'
        ]),
        fallbackResponse: 'I apologize, but I\'m having trouble understanding your request. Let me connect you with one of our human support agents who can better assist you.',
        contentFilters: JSON.stringify(['inappropriate', 'offensive', 'spam']),
        sensitiveTopics: JSON.stringify(['legal advice', 'medical advice', 'emergency procedures'])
      }
    })
  }

  return config
}

// Search knowledge base for relevant articles
async function searchKnowledgeBase(query: string, userRole?: string, limit: number = 3) {
  const whereClause: any = {
    status: 'PUBLISHED',
    isPublic: true
  }

  if (userRole && userRole !== 'PARENT') {
    whereClause.OR = [
      { requiredRole: null },
      { requiredRole: userRole }
    ]
  } else {
    whereClause.requiredRole = null
  }

  const searchConditions = [
    { title: { contains: query, mode: 'insensitive' } },
    { content: { contains: query, mode: 'insensitive' } },
    { summary: { contains: query, mode: 'insensitive' } }
  ]

  const articles = await db.knowledgeBaseArticle.findMany({
    where: {
      ...whereClause,
      OR: searchConditions
    },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      category: true,
      slug: true,
      avgRating: true,
      viewCount: true
    },
    orderBy: [
      { avgRating: 'desc' },
      { viewCount: 'desc' }
    ],
    take: limit
  })

  return articles
}

// Generate AI response using LLM
async function generateAIResponse(
  message: string,
  context: any,
  config: any,
  conversationHistory: any[] = [],
  kbArticles: any[] = []
) {
  try {
    // Prepare knowledge base context
    let kbContext = ''
    if (kbArticles.length > 0) {
      kbContext = '\n\nRelevant Knowledge Base Articles:\n' + 
        kbArticles.map(article => 
          `- ${article.title}: ${article.summary || article.content.substring(0, 200)}...`
        ).join('\n')
    }

    // Prepare conversation history
    const historyContext = conversationHistory.length > 0 
      ? '\n\nPrevious conversation:\n' + 
        conversationHistory.slice(-6).map(msg => 
          `${msg.senderType === 'USER' ? 'User' : 'AI'}: ${msg.content}`
        ).join('\n')
      : ''

    // Build the prompt
    const fullPrompt = `${config.systemPrompt}

User Role: ${context.userRole || 'PARENT'}
Current Page: ${context.page || 'Unknown'}
${context.venueId ? `Venue ID: ${context.venueId}` : ''}

${kbContext}${historyContext}

User Message: ${message}

Please provide a helpful response. If you reference knowledge base articles, mention them naturally in your response.`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    return {
      content: aiResponse,
      confidence: 0.8 // We could implement confidence scoring based on response quality
    }

  } catch (error) {
    console.error('Error generating AI response:', error)
    return {
      content: config.fallbackResponse,
      confidence: 0.1
    }
  }
}

// Check if escalation is needed
async function shouldEscalate(
  message: string,
  conversationHistory: any[],
  config: any,
  aiConfidence: number
) {
  // Check escalation keywords
  const escalationKeywords = JSON.parse(config.escalationKeywords || '[]')
  const messageLower = message.toLowerCase()
  
  for (const keyword of escalationKeywords) {
    if (messageLower.includes(keyword.toLowerCase())) {
      return {
        shouldEscalate: true,
        reason: `Escalation keyword detected: "${keyword}"`
      }
    }
  }

  // Check AI confidence
  if (aiConfidence < config.escalationConfidenceThreshold) {
    return {
      shouldEscalate: true,
      reason: 'Low AI confidence in response'
    }
  }

  // Check interaction count
  if (conversationHistory.length >= config.maxAIInteractions) {
    return {
      shouldEscalate: true,
      reason: 'Maximum AI interactions reached'
    }
  }

  // Use AI to determine if escalation is needed
  try {
    const escalationPrompt = `${config.escalationPrompt}

Recent conversation:
${conversationHistory.slice(-3).map(msg => 
  `${msg.senderType === 'USER' ? 'User' : 'AI'}: ${msg.content}`
).join('\n')}

Latest user message: ${message}

Should this be escalated?`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: [
          {
            role: 'user',
            content: escalationPrompt
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    })

    if (response.ok) {
      const data = await response.json()
      const decision = data.choices?.[0]?.message?.content?.toUpperCase()
      
      if (decision?.includes('ESCALATE')) {
        return {
          shouldEscalate: true,
          reason: 'AI recommended escalation'
        }
      }
    }
  } catch (error) {
    console.error('Error checking escalation:', error)
  }

  return {
    shouldEscalate: false,
    reason: null
  }
}

// POST /api/support/ai-chat - Send message to AI chatbot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = chatRequestSchema.parse(body)

    // Get AI configuration
    const config = await getAIChatConfig()

    // Get or create chat session
    let chatSession
    if (validatedData.sessionId) {
      chatSession = await db.supportChatSession.findUnique({
        where: { sessionId: validatedData.sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20 // Last 20 messages
          }
        }
      })
    }

    if (!chatSession) {
      // Create new chat session
      const sessionId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      chatSession = await db.supportChatSession.create({
        data: {
          sessionId,
          userId: session.user.id,
          status: 'ACTIVE',
          isAIOnly: true,
          initialQuery: validatedData.message,
          department: 'GENERAL',
          priority: 'NORMAL',
          language: 'en',
          userAgent: request.headers.get('user-agent'),
          referrerPage: validatedData.context?.page
        },
        include: {
          messages: true
        }
      })

      // Send welcome message
      await db.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          senderType: 'AI',
          content: config.welcomeMessage,
          messageType: 'TEXT',
          aiGenerated: true,
          aiModel: config.aiModel
        }
      })
    }

    // Save user message
    const userMessage = await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        senderId: session.user.id,
        senderType: 'USER',
        content: validatedData.message,
        messageType: 'TEXT'
      }
    })

    // Search knowledge base if enabled
    let kbArticles: any[] = []
    if (config.kbIntegrationEnabled) {
      kbArticles = await searchKnowledgeBase(
        validatedData.message,
        session.user.role,
        config.kbSearchLimit
      )
    }

    // Generate AI response
    const aiResult = await generateAIResponse(
      validatedData.message,
      {
        userRole: session.user.role,
        page: validatedData.context?.page,
        venueId: validatedData.context?.venueId
      },
      config,
      chatSession.messages || [],
      kbArticles
    )

    // Check if escalation is needed
    const escalationCheck = await shouldEscalate(
      validatedData.message,
      chatSession.messages || [],
      config,
      aiResult.confidence
    )

    let aiMessage
    let escalationInfo = null

    if (escalationCheck.shouldEscalate) {
      // Escalate to human agent
      await db.supportChatSession.update({
        where: { id: chatSession.id },
        data: {
          status: 'WAITING',
          isAIOnly: false,
          aiHandoffAt: new Date(),
          handoffReason: escalationCheck.reason
        }
      })

      const escalationMessage = "I understand you need additional assistance. Let me connect you with one of our human support agents who can better help you. Please wait a moment while I transfer your conversation."

      aiMessage = await db.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          senderType: 'AI',
          content: escalationMessage,
          messageType: 'TEXT',
          aiGenerated: true,
          aiModel: config.aiModel,
          aiPrompt: 'Escalation to human agent',
          aiConfidence: 1.0
        }
      })

      escalationInfo = {
        escalated: true,
        reason: escalationCheck.reason,
        waitingForAgent: true
      }

    } else {
      // Send AI response
      aiMessage = await db.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          senderType: 'AI',
          content: aiResult.content,
          messageType: 'TEXT',
          aiGenerated: true,
          aiModel: config.aiModel,
          aiConfidence: aiResult.confidence
        }
      })
    }

    return NextResponse.json({
      sessionId: chatSession.sessionId,
      userMessage,
      aiMessage,
      escalation: escalationInfo,
      suggestedArticles: kbArticles.map(article => ({
        title: article.title,
        summary: article.summary,
        slug: article.slug,
        category: article.category
      }))
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'AI chat failed' },
      { status: 500 }
    )
  }
}

// GET /api/support/ai-chat - Get AI chat configuration (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const config = await getAIChatConfig()
    return NextResponse.json(config)

  } catch (error) {
    console.error('Error fetching AI chat config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    )
  }
}
