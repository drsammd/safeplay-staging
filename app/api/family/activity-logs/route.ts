
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic"

// GET /api/family/activity-logs - Get family activity logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const actionType = url.searchParams.get('actionType')
    const resourceType = url.searchParams.get('resourceType')
    const impactLevel = url.searchParams.get('impactLevel')
    const targetId = url.searchParams.get('targetId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    let whereClause: any = {
      OR: [
        { familyOwnerId: session.user.id },
        { actorId: session.user.id },
        { targetId: session.user.id }
      ]
    }

    if (actionType) {
      whereClause.actionType = actionType.toUpperCase()
    }

    if (resourceType) {
      whereClause.resourceType = resourceType.toUpperCase()
    }

    if (impactLevel) {
      whereClause.impactLevel = impactLevel.toUpperCase()
    }

    if (targetId) {
      whereClause.targetId = targetId
    }

    if (startDate || endDate) {
      whereClause.timestamp = {}
      if (startDate) {
        whereClause.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.timestamp.lte = new Date(endDate)
      }
    }

    // Get total count
    const total = await prisma.familyActivityLog.count({
      where: whereClause
    })

    // Get activity logs
    const activityLogs = await prisma.familyActivityLog.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Get user details for actors and targets
    const userIds = new Set<string>()
    activityLogs.forEach(log => {
      userIds.add(log.familyOwnerId)
      userIds.add(log.actorId)
      if (log.targetId) userIds.add(log.targetId)
    })

    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(userIds) }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const userMap = new Map(users.map(user => [user.id, user]))

    // Enrich activity logs with user details
    const enrichedLogs = activityLogs.map(log => ({
      ...log,
      familyOwner: userMap.get(log.familyOwnerId),
      actor: userMap.get(log.actorId),
      target: log.targetId ? userMap.get(log.targetId) : null
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      activityLogs: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching family activity logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
