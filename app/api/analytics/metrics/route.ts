
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const performanceMetricSchema = z.object({
  metricType: z.enum([
    'SAFETY_SCORE', 'RESPONSE_TIME', 'INCIDENT_RATE', 'CAMERA_UPTIME',
    'DETECTION_ACCURACY', 'PARENT_SATISFACTION', 'ENGAGEMENT_RATE',
    'OCCUPANCY_RATE', 'TRAFFIC_FLOW', 'OPERATIONAL_EFFICIENCY',
    'COST_PER_INCIDENT', 'RESOLUTION_TIME', 'COMPLIANCE_SCORE',
    'PERFORMANCE_INDEX', 'UTILIZATION_RATE', 'QUALITY_SCORE',
    'GROWTH_RATE', 'RETENTION_RATE', 'CONVERSION_RATE', 'CUSTOM_METRIC'
  ]),
  name: z.string(),
  description: z.string().optional(),
  venueId: z.string().optional(),
  category: z.enum([
    'SAFETY', 'SECURITY', 'OPERATIONAL', 'FINANCIAL', 'CUSTOMER',
    'QUALITY', 'PERFORMANCE', 'COMPLIANCE', 'EFFICIENCY', 'GROWTH'
  ]),
  value: z.number(),
  unit: z.string().optional(),
  target: z.number().optional(),
  threshold: z.any().optional(),
  period: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  calculationMethod: z.string().optional(),
  isKPI: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// POST /api/analytics/metrics - Create performance metric
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = performanceMetricSchema.parse(body);

    // Verify venue access if venueId is provided
    if (data.venueId) {
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
    }

    // Check for existing metric with same parameters
    const existingMetric = await prisma.performanceMetric.findFirst({
      where: {
        metricType: data.metricType,
        venueId: data.venueId,
        period: data.period,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd)
      }
    });

    let metric;
    if (existingMetric) {
      // Update existing metric
      metric = await prisma.performanceMetric.update({
        where: { id: existingMetric.id },
        data: {
          ...data,
          periodStart: new Date(data.periodStart),
          periodEnd: new Date(data.periodEnd),
          previousValue: existingMetric.value,
          changePercentage: existingMetric.value ? ((data.value - existingMetric.value) / existingMetric.value) * 100 : 0,
          lastCalculated: new Date(),
          tags: data.tags || []
        }
      });
    } else {
      // Create new metric
      metric = await prisma.performanceMetric.create({
        data: {
          ...data,
          periodStart: new Date(data.periodStart),
          periodEnd: new Date(data.periodEnd),
          tags: data.tags || [],
          dataPoints: 1,
          confidence: 1.0,
          status: 'NORMAL'
        }
      });
    }

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error creating performance metric:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/metrics - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const metricType = searchParams.get('metricType');
    const category = searchParams.get('category');
    const period = searchParams.get('period');
    const isKPI = searchParams.get('isKPI');
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
      // Non-admin users can only see their venue metrics
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.venueId = { in: userVenues.map(v => v.id) };
    }

    if (metricType) where.metricType = metricType;
    if (category) where.category = category;
    if (period) where.period = period;
    if (isKPI !== null) where.isKPI = isKPI === 'true';
    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) where.periodStart.gte = new Date(startDate);
      if (endDate) where.periodStart.lte = new Date(endDate);
    }

    const [metrics, total] = await Promise.all([
      prisma.performanceMetric.findMany({
        where,
        include: {
          venue: { select: { name: true } }
        },
        orderBy: { lastCalculated: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.performanceMetric.count({ where })
    ]);

    return NextResponse.json({
      metrics,
      total,
      limit,
      offset,
      hasMore: offset + metrics.length < total
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
