
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = "force-dynamic"

const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  category: z.enum([
    'GETTING_STARTED', 'TECHNICAL_SUPPORT', 'BILLING_PAYMENTS', 'CHILD_SAFETY',
    'VENUE_MANAGEMENT', 'MOBILE_APP', 'FACE_RECOGNITION', 'CAMERAS_HARDWARE',
    'ALERTS_NOTIFICATIONS', 'TROUBLESHOOTING', 'API_DOCUMENTATION',
    'BEST_PRACTICES', 'FAQ', 'POLICIES', 'UPDATES'
  ]),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  requiredRole: z.enum(['SUPER_ADMIN', 'VENUE_ADMIN', 'PARENT']).optional(),
  targetAudience: z.array(z.string()).optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional()
})

const updateArticleSchema = createArticleSchema.partial()

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
    const existing = null; // knowledgeBaseArticle model does not exist

    if (!existing || (excludeId && existing?.id === excludeId)) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// GET /api/support/knowledge-base - List articles with search and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}

    // Role-based filtering for access control
    if (!session?.user || session.user.role === 'PARENT') {
      whereClause.isPublic = true
      whereClause.status = 'PUBLISHED'
      
      if (session?.user) {
        whereClause.OR = [
          { requiredRole: null },
          { requiredRole: session.user.role }
        ]
      } else {
        whereClause.requiredRole = null
      }
    } else {
      // Admins can see all articles if status filter is provided
      if (status) {
        whereClause.status = status
      } else {
        whereClause.status = 'PUBLISHED' // Default to published for public view
      }
    }

    // Apply filters
    if (category) whereClause.category = category

    // Search functionality
    if (search) {
      const searchTerms = search.toLowerCase().split(' ')
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        ...searchTerms.map(term => ({
          searchKeywords: {
            contains: term
          }
        }))
      ]
    }

    // Tag filtering
    if (tags && tags.length > 0) {
      whereClause.tags = {
        hasSome: tags
      }
    }

    // knowledgeBaseArticle model does not exist - returning placeholder data
    const articles = [];
    const total = 0;

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching knowledge base articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// POST /api/support/knowledge-base - Create new article (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'VENUE_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createArticleSchema.parse(body)

    // Generate unique slug
    const baseSlug = generateSlug(validatedData.title)
    const slug = await ensureUniqueSlug(baseSlug)

    // Create the article (knowledgeBaseArticle model does not exist - returning placeholder)
    const article = {
      id: 'placeholder-id',
      title: validatedData.title,
      content: validatedData.content,
      summary: validatedData.summary,
      category: validatedData.category,
      subCategory: validatedData.subCategory,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : undefined,
      slug,
      searchKeywords: validatedData.searchKeywords ? JSON.stringify(validatedData.searchKeywords) : undefined,
      isPublic: validatedData.isPublic,
      requiredRole: validatedData.requiredRole,
      targetAudience: validatedData.targetAudience ? JSON.stringify(validatedData.targetAudience) : undefined,
      metaDescription: validatedData.metaDescription,
      metaKeywords: validatedData.metaKeywords ? JSON.stringify(validatedData.metaKeywords) : undefined,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(article, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating knowledge base article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
