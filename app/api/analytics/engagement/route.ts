
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const parentEngagementSchema = z.object({
  userId: z.string(),
  venueId: z.string().optional(),
  date: z.string().datetime(),
  sessionCount: z.number().optional(),
  totalSessionDuration: z.number().optional(),
  averageSessionDuration: z.number().optional(),
  photosViewed: z.number().optional(),
  photosShared: z.number().optional(),
  photosPurchased: z.number().optional(),
  notificationsReceived: z.number().optional(),
  notificationsRead: z.number().optional(),
  notificationResponseTime: z.number().optional(),
  checkInsInitiated: z.number().optional(),
  checkOutsInitiated: z.number().optional(),
  alertsReceived: z.number().optional(),
  alertsAcknowledged: z.number().optional(),
  emergencyContactsUpdated: z.number().optional(),
  profileUpdates: z.number().optional(),
  feedbackSubmitted: z.number().optional(),
  supportTicketsCreated: z.number().optional(),
  appRating: z.number().min(1).max(5).optional(),
  npsScore: z.number().min(0).max(10).optional(),
  featureUsage: z.any().optional(),
  deviceType: z.string().optional(),
  lastActiveAt: z.string().datetime().optional(),
  metadata: z.any().optional()
});

// POST /api/analytics/engagement - Create parent engagement record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = parentEngagementSchema.parse(body);

    // Verify user access (users can only create their own engagement records or admins can create any)
    if (data.userId !== session.user.id && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify venue access if venueId is provided
    if (data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: data.venueId,
          OR: [
            { adminId: session.user.id },
            session.user.role === 'COMPANY_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }
    }

    // Check if record already exists for this user/venue/date
    const existingEngagement = await prisma.parentEngagement.findFirst({
      where: {
        userId: data.userId,
        venueId: data.venueId,
        date: new Date(data.date)
      }
    });

    // Calculate engagement score
    const engagementScore = calculateEngagementScore({
      sessionCount: data.sessionCount || 0,
      averageSessionDuration: data.averageSessionDuration || 0,
      photosViewed: data.photosViewed || 0,
      notificationsRead: data.notificationsRead || 0,
      notificationsReceived: data.notificationsReceived || 0,
      alertsAcknowledged: data.alertsAcknowledged || 0,
      alertsReceived: data.alertsReceived || 0,
      checkInsInitiated: data.checkInsInitiated || 0,
      appRating: data.appRating,
      featureUsage: data.featureUsage || {}
    });

    // Calculate satisfaction score
    const satisfactionScore = calculateSatisfactionScore({
      appRating: data.appRating,
      npsScore: data.npsScore,
      notificationResponseTime: data.notificationResponseTime || 0,
      supportTicketsCreated: data.supportTicketsCreated || 0
    });

    let engagement;
    if (existingEngagement) {
      // Update existing record
      engagement = await prisma.parentEngagement.update({
        where: { id: existingEngagement.id },
        data: {
          ...data,
          date: new Date(data.date),
          lastActiveAt: data.lastActiveAt ? new Date(data.lastActiveAt) : undefined,
          engagementScore,
          satisfactionScore,
          retentionRisk: calculateRetentionRisk(engagementScore, satisfactionScore) as any,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new record
      engagement = await prisma.parentEngagement.create({
        data: {
          ...data,
          date: new Date(data.date),
          lastActiveAt: data.lastActiveAt ? new Date(data.lastActiveAt) : undefined,
          sessionCount: data.sessionCount || 0,
          totalSessionDuration: data.totalSessionDuration || 0,
          averageSessionDuration: data.averageSessionDuration || 0,
          photosViewed: data.photosViewed || 0,
          photosShared: data.photosShared || 0,
          photosPurchased: data.photosPurchased || 0,
          notificationsReceived: data.notificationsReceived || 0,
          notificationsRead: data.notificationsRead || 0,
          notificationResponseTime: data.notificationResponseTime || 0,
          checkInsInitiated: data.checkInsInitiated || 0,
          checkOutsInitiated: data.checkOutsInitiated || 0,
          alertsReceived: data.alertsReceived || 0,
          alertsAcknowledged: data.alertsAcknowledged || 0,
          emergencyContactsUpdated: data.emergencyContactsUpdated || 0,
          profileUpdates: data.profileUpdates || 0,
          feedbackSubmitted: data.feedbackSubmitted || 0,
          supportTicketsCreated: data.supportTicketsCreated || 0,
          featureUsage: data.featureUsage || {},
          engagementScore,
          satisfactionScore,
          retentionRisk: calculateRetentionRisk(engagementScore, satisfactionScore) as any
        }
      });
    }

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'PARENT_ENGAGEMENT',
        category: 'ENGAGEMENT',
        description: 'Parent engagement metrics updated',
        venueId: data.venueId || '',
        userId: data.userId,
        value: engagementScore,
        unit: 'score',
        metadata: {
          sessionCount: data.sessionCount || 0,
          photosViewed: data.photosViewed || 0,
          satisfactionScore,
          retentionRisk: calculateRetentionRisk(engagementScore, satisfactionScore)
        },
        tags: ['engagement', 'parent', 'metrics']
      }
    });

    return NextResponse.json(engagement);
  } catch (error) {
    console.error('Error creating parent engagement:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/engagement - Get parent engagement metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const retentionRisk = searchParams.get('retentionRisk');
    const minEngagementScore = searchParams.get('minEngagementScore');
    const maxEngagementScore = searchParams.get('maxEngagementScore');
    const aggregation = searchParams.get('aggregation'); // daily, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (venueId) {
      // Verify venue access
      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          OR: [
            { adminId: session.user.id },
            session.user.role === 'COMPANY_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }

      where.venueId = venueId;
    } else if (session.user.role !== 'COMPANY_ADMIN') {
      // Non-admin users can only see their own engagement or their venue's engagement
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.OR = [
        { userId: session.user.id },
        { venueId: { in: userVenues.map(v => v.id) } }
      ];
    }

    if (userId) {
      // Non-admin users can only access their own data
      if (userId !== session.user.id && session.user.role !== 'COMPANY_ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      where.userId = userId;
    }

    if (retentionRisk) where.retentionRisk = retentionRisk;
    if (minEngagementScore) where.engagementScore = { gte: parseFloat(minEngagementScore) };
    if (maxEngagementScore) {
      where.engagementScore = {
        ...(where.engagementScore || {}),
        lte: parseFloat(maxEngagementScore)
      };
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (aggregation) {
      // Return aggregated data
      return getAggregatedEngagementData(where, aggregation);
    }

    const [engagementMetrics, total] = await Promise.all([
      prisma.parentEngagement.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          venue: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.parentEngagement.count({ where })
    ]);

    return NextResponse.json({
      engagementMetrics,
      total,
      limit,
      offset,
      hasMore: offset + engagementMetrics.length < total
    });
  } catch (error) {
    console.error('Error fetching parent engagement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate engagement score
function calculateEngagementScore(data: any): number {
  const weights = {
    sessionCount: 10,
    sessionDuration: 5,
    photosViewed: 3,
    notificationReadRate: 15,
    alertResponseRate: 20,
    checkInActivity: 10,
    appRating: 25,
    featureUsage: 12
  };

  let score = 0;
  let maxScore = 0;

  // Session activity
  score += Math.min(data.sessionCount * weights.sessionCount, 100);
  maxScore += 100;

  // Session duration (cap at 30 minutes for max score)
  score += Math.min((data.averageSessionDuration / 30) * weights.sessionDuration, weights.sessionDuration);
  maxScore += weights.sessionDuration;

  // Photo engagement
  score += Math.min(data.photosViewed * weights.photosViewed, 50);
  maxScore += 50;

  // Notification engagement
  const notificationReadRate = data.notificationsReceived > 0 
    ? (data.notificationsRead / data.notificationsReceived) * 100 
    : 0;
  score += (notificationReadRate / 100) * weights.notificationReadRate;
  maxScore += weights.notificationReadRate;

  // Alert response rate
  const alertResponseRate = data.alertsReceived > 0 
    ? (data.alertsAcknowledged / data.alertsReceived) * 100 
    : 0;
  score += (alertResponseRate / 100) * weights.alertResponseRate;
  maxScore += weights.alertResponseRate;

  // Check-in activity
  score += Math.min(data.checkInsInitiated * weights.checkInActivity, 30);
  maxScore += 30;

  // App rating
  if (data.appRating) {
    score += (data.appRating / 5) * weights.appRating;
  }
  maxScore += weights.appRating;

  // Feature usage diversity
  const featureCount = Object.keys(data.featureUsage).length;
  score += Math.min(featureCount * weights.featureUsage, 60);
  maxScore += 60;

  return Math.round((score / maxScore) * 100);
}

// Helper function to calculate satisfaction score
function calculateSatisfactionScore(data: any): number {
  const weights = {
    appRating: 40,
    npsScore: 30,
    responseTime: 20,
    supportTickets: 10
  };

  let score = 0;
  let maxScore = 0;

  // App rating
  if (data.appRating) {
    score += (data.appRating / 5) * weights.appRating;
  }
  maxScore += weights.appRating;

  // NPS score
  if (data.npsScore !== undefined) {
    score += (data.npsScore / 10) * weights.npsScore;
  }
  maxScore += weights.npsScore;

  // Response time (lower is better, cap at 60 minutes)
  const responseTimeScore = Math.max(0, 1 - (data.notificationResponseTime / 60));
  score += responseTimeScore * weights.responseTime;
  maxScore += weights.responseTime;

  // Support tickets (fewer is better)
  const supportScore = Math.max(0, 1 - (data.supportTicketsCreated / 5));
  score += supportScore * weights.supportTickets;
  maxScore += weights.supportTickets;

  return Math.round((score / maxScore) * 100);
}

// Helper function to calculate retention risk
function calculateRetentionRisk(engagementScore: number, satisfactionScore: number): string {
  const combinedScore = (engagementScore + satisfactionScore) / 2;

  if (combinedScore >= 80) return 'LOW';
  if (combinedScore >= 60) return 'MEDIUM';
  if (combinedScore >= 40) return 'HIGH';
  return 'CRITICAL';
}

// Helper function for aggregated engagement data
async function getAggregatedEngagementData(where: any, aggregation: string) {
  let groupBy: any;
  let selectFields: any;

  switch (aggregation) {
    case 'daily':
      groupBy = ['date'];
      break;
    case 'weekly':
      // Group by week (simplified - would need more complex logic for proper week grouping)
      groupBy = ['date'];
      break;
    case 'monthly':
      // Group by month (simplified - would need more complex logic for proper month grouping)
      groupBy = ['date'];
      break;
    default:
      throw new Error('Invalid aggregation type');
  }

  selectFields = {
    date: true,
    _avg: {
      engagementScore: true,
      satisfactionScore: true,
      sessionCount: true,
      averageSessionDuration: true,
      photosViewed: true,
      notificationResponseTime: true
    },
    _sum: {
      totalSessionDuration: true,
      photosViewed: true,
      photosPurchased: true,
      checkInsInitiated: true,
      alertsReceived: true,
      alertsAcknowledged: true
    },
    _count: true
  };

  const aggregatedData = await prisma.parentEngagement.groupBy({
    by: groupBy as any,
    where,
    ...selectFields
  });

  return NextResponse.json({
    aggregation,
    data: aggregatedData
  });
}
