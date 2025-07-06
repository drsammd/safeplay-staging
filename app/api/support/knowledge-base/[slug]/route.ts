
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  summary: z.string().optional(),
  category: z.enum([
    'GETTING_STARTED', 'TECHNICAL_SUPPORT', 'BILLING_PAYMENTS', 'CHILD_SAFETY',
    'VENUE_MANAGEMENT', 'MOBILE_APP', 'FACE_RECOGNITION', 'CAMERAS_HARDWARE',
    'ALERTS_NOTIFICATIONS', 'TROUBLESHOOTING', 'API_DOCUMENTATION',
    'BEST_PRACTICES', 'FAQ', 'POLICIES', 'UPDATES'
  ]).optional(),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  requiredRole: z.enum(['SUPER_ADMIN', 'VENUE_ADMIN', 'PARENT']).optional(),
  targetAudience: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional()
})

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  wasHelpful: z.boolean(),
  improvementSuggestions: z.string().optional()
})

// Generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Ensure unique slug
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await db.knowledgeBaseArticle.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// Check if user can access article
function canAccessArticle(article: any, userRole?: string) {
  if (!article.isPublic && !userRole) return false
  if (article.status !== 'PUBLISHED' && userRole !== 'SUPER_ADMIN' && userRole !== 'VENUE_ADMIN') return false
  if (article.requiredRole && (!userRole || userRole === 'PARENT' && article.requiredRole !== 'PARENT')) return false
  return true
}

// GET /api/support/knowledge-base/[slug] - Get article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const slug = params.slug

    const article = await db.knowledgeBaseArticle.findUnique({
      where: { slug },
      include: {
        feedback: {
          where: session?.user ? {} : { userId: null }, // Only show public feedback if not logged in
          select: {
            id: true,
            rating: true,
            comment: true,
            wasHelpful: true,
            improvementSuggestions: true,
            createdAt: true,
            userId: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check access permissions
    if (!canAccessArticle(article, session?.user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Increment view count
    await db.knowledgeBaseArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } }
    })

    return NextResponse.json(article)

  } catch (error) {
    console.error('Error fetching knowledge base article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

// PATCH /api/support/knowledge-base/[slug] - Update article (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'VENUE_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const slug = params.slug
    const body = await request.json()
    const validatedData = updateArticleSchema.parse(body)

    // Get current article
    const currentArticle = await db.knowledgeBaseArticle.findUnique({
      where: { slug }
    })

    if (!currentArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    // Handle title change (requires slug update)
    if (validatedData.title && validatedData.title !== currentArticle.title) {
      const baseSlug = generateSlug(validatedData.title)
      const newSlug = await ensureUniqueSlug(baseSlug, currentArticle.id)
      updateData.title = validatedData.title
      updateData.slug = newSlug
    }

    // Update other fields
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.summary !== undefined) updateData.summary = validatedData.summary
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.subCategory !== undefined) updateData.subCategory = validatedData.subCategory
    if (validatedData.tags !== undefined) updateData.tags = JSON.stringify(validatedData.tags)
    if (validatedData.searchKeywords !== undefined) updateData.searchKeywords = JSON.stringify(validatedData.searchKeywords)
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic
    if (validatedData.requiredRole !== undefined) updateData.requiredRole = validatedData.requiredRole
    if (validatedData.targetAudience !== undefined) updateData.targetAudience = JSON.stringify(validatedData.targetAudience)
    if (validatedData.metaDescription !== undefined) updateData.metaDescription = validatedData.metaDescription
    if (validatedData.metaKeywords !== undefined) updateData.metaKeywords = JSON.stringify(validatedData.metaKeywords)

    // Handle status changes
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      
      if (validatedData.status === 'PUBLISHED' && currentArticle.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date()
      }
      
      if (validatedData.status !== 'DRAFT') {
        updateData.lastReviewedAt = new Date()
        updateData.reviewedBy = session.user.id
      }
    }

    // Update version number
    updateData.version = currentArticle.version + 1

    const updatedArticle = await db.knowledgeBaseArticle.update({
      where: { slug },
      data: updateData
    })

    return NextResponse.json(updatedArticle)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating knowledge base article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

// DELETE /api/support/knowledge-base/[slug] - Delete article (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const slug = params.slug

    await db.knowledgeBaseArticle.delete({
      where: { slug }
    })

    return NextResponse.json({ message: 'Article deleted successfully' })

  } catch (error) {
    console.error('Error deleting knowledge base article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}
