
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'

export const dynamic = "force-dynamic"

// GET /api/support/knowledge-base/search - Advanced search for articles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const skip = (page - 1) * limit

    // Build base where clause for access control
    const whereClause: any = {
      status: 'PUBLISHED'
    }

    // Role-based filtering
    if (!session?.user || session.user.role === 'PARENT') {
      whereClause.isPublic = true
      
      if (session?.user) {
        whereClause.OR = [
          { requiredRole: null },
          { requiredRole: session.user.role }
        ]
      } else {
        whereClause.requiredRole = null
      }
    }

    // Category filter
    if (category) {
      whereClause.category = category
    }

    // Search across multiple fields
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
    
    const searchConditions = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
      { summary: { contains: query, mode: 'insensitive' } }
    ]

    // Note: searchKeywords is a JSON field and requires different query syntax
    // For now, we'll search in title, content, and summary only

    whereClause.AND = [
      { OR: searchConditions }
    ]

    const [articles, total] = await Promise.all([
      db.knowledgeBaseArticle.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          subCategory: true,
          slug: true,
          viewCount: true,
          helpfulVotes: true,
          notHelpfulVotes: true,
          avgRating: true,
          publishedAt: true,
          tags: true
        },
        orderBy: [
          { viewCount: 'desc' },
          { avgRating: 'desc' },
          { helpfulVotes: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.knowledgeBaseArticle.count({ where: whereClause })
    ])

    // Calculate relevance scores (simple implementation)
    const scoredArticles = articles.map(article => {
      let score = 0
      const queryLower = query.toLowerCase()
      
      // Title match (highest weight)
      if (article.title.toLowerCase().includes(queryLower)) {
        score += 10
      }
      
      // Summary match (medium weight)
      if (article.summary?.toLowerCase().includes(queryLower)) {
        score += 5
      }
      
      // Category match (low weight)
      if (article.category.toLowerCase().includes(queryLower)) {
        score += 2
      }
      
      // Popular articles boost
      score += Math.min(article.viewCount / 100, 5)
      score += (article.avgRating || 0) * 2
      
      return {
        ...article,
        relevanceScore: score
      }
    })

    // Sort by relevance score
    scoredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Track search analytics
    try {
      // We could store search queries for analytics
      // This is optional but useful for improving search
      await db.$executeRaw`
        INSERT OR IGNORE INTO search_analytics (query, results_count, user_id, created_at)
        VALUES (${query}, ${total}, ${session?.user?.id || null}, datetime('now'))
      `
    } catch (error) {
      // Search analytics table doesn't exist, that's OK
      console.log('Search analytics not available yet')
    }

    return NextResponse.json({
      articles: scoredArticles,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      suggestions: {
        // Could add search suggestions here based on popular searches
        relatedCategories: articles.map(a => a.category).filter((v, i, arr) => arr.indexOf(v) === i),
        popularTags: articles.flatMap(a => {
          try {
            return typeof a.tags === 'string' ? JSON.parse(a.tags) : []
          } catch {
            return []
          }
        }).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 5)
      }
    })

  } catch (error) {
    console.error('Error searching knowledge base:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
