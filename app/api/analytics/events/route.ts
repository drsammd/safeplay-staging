
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const analyticsEventSchema = z.object({
  eventType: z.enum([
    'CHILD_ENTRY', 'CHILD_EXIT', 'CHILD_MOVEMENT', 'ALERT_GENERATED', 
    'ALERT_RESOLVED', 'INCIDENT_REPORTED', 'INCIDENT_RESOLVED', 
    'CAMERA_STATUS_CHANGE', 'SYSTEM_ERROR', 'USER_ACTION', 
    'PARENT_ENGAGEMENT', 'PHOTO_CAPTURED', 'PHOTO_PURCHASED', 
    'CHECK_IN', 'CHECK_OUT', 'EMERGENCY_ACTIVATION', 'STAFF_RESPONSE',
    'PERFORMANCE_THRESHOLD', 'CAPACITY_REACHED', 'TRAFFIC_PATTERN',
    'SECURITY_EVENT', 'MAINTENANCE_EVENT', 'COMPLIANCE_EVENT',
    'BUSINESS_METRIC', 'CUSTOM_EVENT'
  ]),
  category: z.enum([
    'SAFETY', 'SECURITY', 'OPERATIONAL', 'PERFORMANCE', 'ENGAGEMENT',
    'BUSINESS', 'TECHNICAL', 'COMPLIANCE', 'ANALYTICS', 'USER_BEHAVIOR',
    'SYSTEM_HEALTH', 'MAINTENANCE'
  ]),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  venueId: z.string(),
  childId: z.string().optional(),
  userId: z.string().optional(),
  cameraId: z.string().optional(),
  zoneId: z.string().optional(),
  alertId: z.string().optional(),
  sessionId: z.string().optional(),
  deviceId: z.string().optional(),
  location: z.any().optional(),
  metadata: z.any().optional(),
  tags: z.array(z.string()).optional(),
  timestamp: z.string().datetime().optional()
});

// POST /api/analytics/events - Create analytics event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = analyticsEventSchema.parse(body);

    // Verify venue access
    const venue = await prisma.venue.findFirst({
      where: {
        id: data.venueId,
        OR: [
          { adminId: session.user.id },
          session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
        ]
      }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        tags: data.tags || [],
        processedAt: new Date()
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating analytics event:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/events - Get analytics events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const eventType = searchParams.get('eventType');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }

      where.venueId = venueId;
    } else if (session.user.role !== 'SUPER_ADMIN') {
      // Non-admin users can only see their venue events
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.venueId = { in: userVenues.map(v => v.id) };
    }

    if (eventType) where.eventType = eventType;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        include: {
          venue: { select: { name: true } },
          child: { select: { firstName: true, lastName: true } },
          user: { select: { name: true } },
          camera: { select: { name: true } },
          zone: { select: { name: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.analyticsEvent.count({ where })
    ]);

    return NextResponse.json({
      events,
      total,
      limit,
      offset,
      hasMore: offset + events.length < total
    });
  } catch (error) {
    console.error('Error fetching analytics events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
