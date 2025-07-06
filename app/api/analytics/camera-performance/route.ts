
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const cameraPerformanceSchema = z.object({
  cameraId: z.string(),
  venueId: z.string(),
  date: z.string().datetime(),
  uptimePercentage: z.number().min(0).max(100).optional(),
  totalUptime: z.number().optional(),
  totalDowntime: z.number().optional(),
  detectionCount: z.number().optional(),
  faceDetectionCount: z.number().optional(),
  accurateDetections: z.number().optional(),
  falsePositives: z.number().optional(),
  avgConfidenceScore: z.number().min(0).max(1).optional(),
  alertsGenerated: z.number().optional(),
  coverageEffectiveness: z.number().min(0).max(100).optional(),
  dataTransmitted: z.number().optional(),
  storageUsed: z.number().optional(),
  maintenanceEvents: z.number().optional(),
  errorCount: z.number().optional(),
  lastCalibration: z.string().datetime().optional(),
  utilizationRate: z.number().min(0).max(100).optional(),
  criticalEvents: z.number().optional(),
  responseTime: z.number().optional(),
  metadata: z.any().optional()
});

// POST /api/analytics/camera-performance - Create camera performance record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = cameraPerformanceSchema.parse(body);

    // Verify venue and camera access
    const camera = await prisma.camera.findFirst({
      where: {
        id: data.cameraId,
        venueId: data.venueId,
        venue: {
          OR: [
            { adminId: session.user.id },
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        }
      },
      include: { venue: true }
    });

    if (!camera) {
      return NextResponse.json({ error: 'Camera not found or access denied' }, { status: 404 });
    }

    // Check if record already exists for this camera/date
    const existingPerformance = await prisma.cameraPerformance.findFirst({
      where: {
        cameraId: data.cameraId,
        date: new Date(data.date)
      }
    });

    // Calculate derived metrics
    const accuracyRate = (data.accurateDetections && data.detectionCount) 
      ? (data.accurateDetections / data.detectionCount) * 100 
      : 0;

    const performanceScore = calculatePerformanceScore({
      uptimePercentage: data.uptimePercentage || 0,
      accuracyRate,
      errorCount: data.errorCount || 0,
      responseTime: data.responseTime || 0,
      coverageEffectiveness: data.coverageEffectiveness || 0
    });

    let performance;
    if (existingPerformance) {
      // Update existing record
      performance = await prisma.cameraPerformance.update({
        where: { id: existingPerformance.id },
        data: {
          ...data,
          date: new Date(data.date),
          lastCalibration: data.lastCalibration ? new Date(data.lastCalibration) : undefined,
          accuracyRate,
          performanceScore,
          uptimePercentage: data.uptimePercentage || 0,
          totalUptime: data.totalUptime || 0,
          totalDowntime: data.totalDowntime || 0,
          detectionCount: data.detectionCount || 0,
          faceDetectionCount: data.faceDetectionCount || 0,
          accurateDetections: data.accurateDetections || 0,
          falsePositives: data.falsePositives || 0,
          avgConfidenceScore: data.avgConfidenceScore || 0,
          alertsGenerated: data.alertsGenerated || 0,
          coverageEffectiveness: data.coverageEffectiveness || 0,
          dataTransmitted: data.dataTransmitted || 0,
          storageUsed: data.storageUsed || 0,
          maintenanceEvents: data.maintenanceEvents || 0,
          errorCount: data.errorCount || 0,
          utilizationRate: data.utilizationRate || 0,
          criticalEvents: data.criticalEvents || 0,
          responseTime: data.responseTime || 0,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new record
      performance = await prisma.cameraPerformance.create({
        data: {
          cameraId: data.cameraId,
          venueId: data.venueId,
          date: new Date(data.date),
          lastCalibration: data.lastCalibration ? new Date(data.lastCalibration) : undefined,
          accuracyRate,
          performanceScore,
          uptimePercentage: data.uptimePercentage || 0,
          totalUptime: data.totalUptime || 0,
          totalDowntime: data.totalDowntime || 0,
          detectionCount: data.detectionCount || 0,
          faceDetectionCount: data.faceDetectionCount || 0,
          accurateDetections: data.accurateDetections || 0,
          falsePositives: data.falsePositives || 0,
          avgConfidenceScore: data.avgConfidenceScore || 0,
          alertsGenerated: data.alertsGenerated || 0,
          coverageEffectiveness: data.coverageEffectiveness || 0,
          dataTransmitted: data.dataTransmitted || 0,
          storageUsed: data.storageUsed || 0,
          maintenanceEvents: data.maintenanceEvents || 0,
          errorCount: data.errorCount || 0,
          utilizationRate: data.utilizationRate || 0,
          criticalEvents: data.criticalEvents || 0,
          responseTime: data.responseTime || 0,
          metadata: data.metadata
        }
      });
    }

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'PERFORMANCE_THRESHOLD',
        category: 'TECHNICAL',
        description: `Camera performance recorded: ${camera.name}`,
        venueId: data.venueId,
        cameraId: data.cameraId,
        value: performanceScore,
        unit: 'score',
        metadata: {
          uptimePercentage: data.uptimePercentage || 0,
          accuracyRate,
          errorCount: data.errorCount || 0,
          detectionCount: data.detectionCount || 0
        },
        tags: ['camera', 'performance', 'monitoring']
      }
    });

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Error creating camera performance record:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/camera-performance - Get camera performance data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const cameraId = searchParams.get('cameraId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minPerformanceScore = searchParams.get('minPerformanceScore');
    const maxPerformanceScore = searchParams.get('maxPerformanceScore');
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
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }

      where.venueId = venueId;
    } else if (session.user.role !== 'SUPER_ADMIN') {
      // Non-admin users can only see their venue camera performance
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.venueId = { in: userVenues.map(v => v.id) };
    }

    if (cameraId) where.cameraId = cameraId;
    if (minPerformanceScore) where.performanceScore = { gte: parseFloat(minPerformanceScore) };
    if (maxPerformanceScore) {
      where.performanceScore = {
        ...(where.performanceScore || {}),
        lte: parseFloat(maxPerformanceScore)
      };
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (aggregation) {
      // Return aggregated data
      return getAggregatedCameraPerformanceData(where, aggregation);
    }

    const [performanceRecords, total] = await Promise.all([
      prisma.cameraPerformance.findMany({
        where,
        include: {
          camera: { select: { name: true, model: true } },
          venue: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.cameraPerformance.count({ where })
    ]);

    return NextResponse.json({
      performanceRecords,
      total,
      limit,
      offset,
      hasMore: offset + performanceRecords.length < total
    });
  } catch (error) {
    console.error('Error fetching camera performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate performance score
function calculatePerformanceScore(data: {
  uptimePercentage: number;
  accuracyRate: number;
  errorCount: number;
  responseTime: number;
  coverageEffectiveness: number;
}): number {
  const weights = {
    uptime: 30,
    accuracy: 25,
    errors: 20,
    responseTime: 15,
    coverage: 10
  };

  let score = 0;

  // Uptime score (0-100)
  score += (data.uptimePercentage / 100) * weights.uptime;

  // Accuracy score (0-100)
  score += (data.accuracyRate / 100) * weights.accuracy;

  // Error score (inverse - fewer errors = higher score)
  const errorScore = Math.max(0, 100 - (data.errorCount * 10));
  score += (errorScore / 100) * weights.errors;

  // Response time score (inverse - lower response time = higher score, cap at 60 seconds)
  const responseScore = Math.max(0, 100 - (data.responseTime / 60) * 100);
  score += (responseScore / 100) * weights.responseTime;

  // Coverage effectiveness score (0-100)
  score += (data.coverageEffectiveness / 100) * weights.coverage;

  return Math.round(score);
}

// Helper function for aggregated camera performance data
async function getAggregatedCameraPerformanceData(where: any, aggregation: string) {
  let groupByFields: string[];
  
  switch (aggregation) {
    case 'daily':
      groupByFields = ['date'];
      break;
    case 'weekly':
      groupByFields = ['cameraId'];
      break;
    case 'monthly':
      groupByFields = ['cameraId'];
      break;
    default:
      throw new Error('Invalid aggregation type');
  }

  // Explicitly type the groupBy operation to avoid circular references
  const aggregatedData = await (prisma.cameraPerformance.groupBy as any)({
    by: groupByFields,
    where,
    _avg: {
      performanceScore: true,
      uptimePercentage: true,
      accuracyRate: true,
      avgConfidenceScore: true,
      coverageEffectiveness: true,
      utilizationRate: true,
      responseTime: true
    },
    _sum: {
      detectionCount: true,
      faceDetectionCount: true,
      accurateDetections: true,
      falsePositives: true,
      alertsGenerated: true,
      errorCount: true,
      maintenanceEvents: true,
      criticalEvents: true
    },
    _count: true
  });

  return NextResponse.json({
    aggregation,
    data: aggregatedData
  });
}
