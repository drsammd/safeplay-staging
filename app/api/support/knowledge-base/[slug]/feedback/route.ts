
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  wasHelpful: z.boolean(),
  improvementSuggestions: z.string().optional()
})

// POST /api/support/knowledge-base/[slug]/feedback - Submit feedback for article
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const slug = params.slug
    const body = await request.json()
    const validatedData = feedbackSchema.parse(body)

    // Find the article - knowledgeBaseArticle model doesn't exist
    const article = null

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if article is accessible
    if (article.status !== 'PUBLISHED' || (!article.isPublic && !session?.user)) {
      return NextResponse.json({ error: 'Article not accessible' }, { status: 403 })
    }

    // Check for existing feedback from this user
    if (session?.user) {
      const existingFeedback = await db.articleFeedback.findFirst({
        where: {
          articleId: article.id,
          userId: session.user.id
        }
      })

      if (existingFeedback) {
        return NextResponse.json({ error: 'You have already provided feedback for this article' }, { status: 409 })
      }
    }

    // Create feedback
    const feedback = await db.articleFeedback.create({
      data: {
        articleId: article.id,
        userId: session?.user?.id || null,
        rating: validatedData.rating,
        comment: validatedData.comment,
        wasHelpful: validatedData.wasHelpful,
        improvementSuggestions: validatedData.improvementSuggestions
      }
    })

    // Update article ratings
    const feedbackStats = await db.articleFeedback.aggregate({
      where: { articleId: article.id },
      _avg: { rating: true },
      _count: { rating: true },
      _sum: {
        rating: true
      }
    })

    const helpfulCount = await db.articleFeedback.count({
      where: {
        articleId: article.id,
        wasHelpful: true
      }
    })

    const notHelpfulCount = await db.articleFeedback.count({
      where: {
        articleId: article.id,
        wasHelpful: false
      }
    })

    // Update the article with new statistics - knowledgeBaseArticle model doesn't exist
    // await db.knowledgeBaseArticle.update({
    //   where: { id: article.id },
    //   data: {
    //     avgRating: feedbackStats._avg.rating || 0,
    //     helpfulVotes: helpfulCount,
    //     notHelpfulVotes: notHelpfulCount
    //   }
    // })

    return NextResponse.json(feedback, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting article feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

// GET /api/support/knowledge-base/[slug]/feedback - Get feedback for article (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'VENUE_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const slug = params.slug
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Find the article - knowledgeBaseArticle model doesn't exist
    const article = null

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const [feedback, total] = await Promise.all([
      db.articleFeedback.findMany({
        where: { articleId: article.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.articleFeedback.count({ where: { articleId: article.id } })
    ])

    // Get statistics
    const stats = await db.articleFeedback.aggregate({
      where: { articleId: article.id },
      _avg: { rating: true },
      _count: { rating: true }
    })

    const helpfulCount = await db.articleFeedback.count({
      where: {
        articleId: article.id,
        wasHelpful: true
      }
    })

    const notHelpfulCount = await db.articleFeedback.count({
      where: {
        articleId: article.id,
        wasHelpful: false
      }
    })

    return NextResponse.json({
      feedback,
      statistics: {
        averageRating: stats._avg.rating || 0,
        totalFeedback: stats._count.rating || 0,
        helpfulCount,
        notHelpfulCount,
        helpfulPercentage: stats._count.rating ? (helpfulCount / stats._count.rating) * 100 : 0
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching article feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
