
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const trafficPatternSchema = z.object({
  venueId: z.string(),
  zoneId: z.string().optional(),
  date: z.string().datetime(),
  hour: z.number().min(0).max(23),
  dayOfWeek: z.number().min(0).max(6),
  childCount: z.number().optional(),
  adultCount: z.number().optional(),
  totalOccupancy: z.number().optional(),
  peakOccupancy: z.number().optional(),
  averageDwellTime: z.number().optional(),
  entryCount: z.number().optional(),
  exitCount: z.number().optional(),
  throughTraffic: z.number().optional(),
  movementDensity: z.number().optional(),
  congestionLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  popularityScore: z.number().optional(),
  safetyIncidents: z.number().optional(),
  emergencyEvents: z.number().optional(),
  ageGroupDistribution: z.any().optional(),
  activityLevel: z.enum(['QUIET', 'NORMAL', 'BUSY', 'PEAK', 'OVERWHELMING']).optional(),
  weatherConditions: z.string().optional(),
  specialEvents: z.string().optional(),
  holidayFlag: z.boolean().optional(),
  schoolDayFlag: z.boolean().optional(),
  capacityUtilization: z.number().optional(),
  efficiency: z.number().optional(),
  bottlenecks: z.any().optional(),
  recommendations: z.any().optional(),
  metadata: z.any().optional()
});

// POST /api/analytics/traffic - Create traffic pattern record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = trafficPatternSchema.parse(body);

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

    // Check if record already exists for this venue/zone/date/hour
    const existingPattern = await prisma.trafficPattern.findFirst({
      where: {
        venueId: data.venueId,
        zoneId: data.zoneId,
        date: new Date(data.date),
        hour: data.hour
      }
    });

    let trafficPattern;
    if (existingPattern) {
      // Update existing record
      trafficPattern = await prisma.trafficPattern.update({
        where: { id: existingPattern.id },
        data: {
          ...data,
          date: new Date(data.date),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new record
      trafficPattern = await prisma.trafficPattern.create({
        data: {
          ...data,
          date: new Date(data.date),
          childCount: data.childCount || 0,
          adultCount: data.adultCount || 0,
          totalOccupancy: data.totalOccupancy || 0,
          peakOccupancy: data.peakOccupancy || 0,
          averageDwellTime: data.averageDwellTime || 0,
          entryCount: data.entryCount || 0,
          exitCount: data.exitCount || 0,
          throughTraffic: data.throughTraffic || 0,
          movementDensity: data.movementDensity || 0,
          congestionLevel: data.congestionLevel || 'LOW',
          popularityScore: data.popularityScore || 0,
          safetyIncidents: data.safetyIncidents || 0,
          emergencyEvents: data.emergencyEvents || 0,
          ageGroupDistribution: data.ageGroupDistribution || {},
          activityLevel: data.activityLevel || 'NORMAL',
          holidayFlag: data.holidayFlag || false,
          schoolDayFlag: data.schoolDayFlag ?? true,
          capacityUtilization: data.capacityUtilization || 0,
          efficiency: data.efficiency || 0
        }
      });
    }

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'TRAFFIC_PATTERN',
        category: 'OPERATIONAL',
        description: `Traffic pattern recorded for ${data.zoneId ? 'zone' : 'venue'}`,
        venueId: data.venueId,
        zoneId: data.zoneId,
        value: data.totalOccupancy,
        unit: 'people',
        metadata: {
          hour: data.hour,
          dayOfWeek: data.dayOfWeek,
          congestionLevel: data.congestionLevel || 'LOW',
          activityLevel: data.activityLevel || 'NORMAL'
        },
        tags: ['traffic', 'occupancy']
      }
    });

    return NextResponse.json(trafficPattern);
  } catch (error) {
    console.error('Error creating traffic pattern:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/traffic - Get traffic patterns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const zoneId = searchParams.get('zoneId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dayOfWeek = searchParams.get('dayOfWeek');
    const hour = searchParams.get('hour');
    const congestionLevel = searchParams.get('congestionLevel');
    const activityLevel = searchParams.get('activityLevel');
    const aggregation = searchParams.get('aggregation'); // hourly, daily, weekly
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
      // Non-admin users can only see their venue traffic
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.venueId = { in: userVenues.map(v => v.id) };
    }

    if (zoneId) where.zoneId = zoneId;
    if (dayOfWeek !== null) where.dayOfWeek = parseInt(dayOfWeek!);
    if (hour !== null) where.hour = parseInt(hour!);
    if (congestionLevel) where.congestionLevel = congestionLevel;
    if (activityLevel) where.activityLevel = activityLevel;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (aggregation) {
      // Return aggregated data
      return getAggregatedTrafficData(where, aggregation);
    }

    const [patterns, total] = await Promise.all([
      prisma.trafficPattern.findMany({
        where,
        include: {
          venue: { select: { name: true } },
          zone: { select: { name: true } }
        },
        orderBy: [{ date: 'desc' }, { hour: 'desc' }],
        take: limit,
        skip: offset
      }),
      prisma.trafficPattern.count({ where })
    ]);

    return NextResponse.json({
      patterns,
      total,
      limit,
      offset,
      hasMore: offset + patterns.length < total
    });
  } catch (error) {
    console.error('Error fetching traffic patterns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function for aggregated traffic data
async function getAggregatedTrafficData(where: any, aggregation: string) {
  let groupBy: any;
  let selectFields: any;

  switch (aggregation) {
    case 'hourly':
      groupBy = ['hour'];
      selectFields = {
        hour: true,
        _avg: {
          totalOccupancy: true,
          averageDwellTime: true,
          capacityUtilization: true,
          efficiency: true
        },
        _sum: {
          entryCount: true,
          exitCount: true,
          safetyIncidents: true,
          emergencyEvents: true
        },
        _count: true
      };
      break;

    case 'daily':
      groupBy = ['dayOfWeek'];
      selectFields = {
        dayOfWeek: true,
        _avg: {
          totalOccupancy: true,
          peakOccupancy: true,
          averageDwellTime: true,
          capacityUtilization: true,
          efficiency: true
        },
        _sum: {
          entryCount: true,
          exitCount: true,
          safetyIncidents: true,
          emergencyEvents: true
        },
        _count: true
      };
      break;

    case 'weekly':
      groupBy = ['date'];
      selectFields = {
        date: true,
        _avg: {
          totalOccupancy: true,
          peakOccupancy: true,
          averageDwellTime: true,
          capacityUtilization: true,
          efficiency: true
        },
        _sum: {
          entryCount: true,
          exitCount: true,
          safetyIncidents: true,
          emergencyEvents: true
        },
        _count: true
      };
      break;

    default:
      throw new Error('Invalid aggregation type');
  }

  const aggregatedData = await prisma.trafficPattern.groupBy({
    by: groupBy as any,
    where,
    ...selectFields
  });

  return NextResponse.json({
    aggregation,
    data: aggregatedData
  });
}
