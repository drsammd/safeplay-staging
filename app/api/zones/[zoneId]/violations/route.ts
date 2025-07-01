
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/[zoneId]/violations - Get violations for a zone
export async function GET(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'resolved' | 'unresolved'
    const severity = searchParams.get('severity');
    const violationType = searchParams.get('violationType');
    const daysBack = parseInt(searchParams.get('daysBack') || '30');

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    // Build filter conditions
    const whereClause: any = {
      zoneId,
      timestamp: {
        gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };

    if (status === 'resolved') {
      whereClause.isResolved = true;
    } else if (status === 'unresolved') {
      whereClause.isResolved = false;
    }

    if (severity) {
      whereClause.severity = severity;
    }

    if (violationType) {
      whereClause.violationType = violationType;
    }

    // Get total count for pagination
    const totalCount = await prisma.zoneViolation.count({ where: whereClause });

    // Get violations with pagination
    const violations = await prisma.zoneViolation.findMany({
      where: whereClause,
      orderBy: [
        { isResolved: 'asc' }, // Unresolved first
        { severity: 'desc' },  // High severity first
        { timestamp: 'desc' }   // Most recent first
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Get violation statistics
    const stats = await prisma.zoneViolation.groupBy({
      by: ['violationType', 'severity', 'isResolved'],
      where: {
        zoneId,
        timestamp: {
          gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        }
      },
      _count: true
    });

    // Calculate summary statistics
    const summary = {
      total: totalCount,
      unresolved: violations.filter(v => !v.isResolved).length,
      resolved: violations.filter(v => v.isResolved).length,
      bySeverity: stats.reduce((acc: any, stat) => {
        acc[stat.severity] = (acc[stat.severity] || 0) + stat._count;
        return acc;
      }, {}),
      byType: stats.reduce((acc: any, stat) => {
        acc[stat.violationType] = (acc[stat.violationType] || 0) + stat._count;
        return acc;
      }, {}),
      averageResolutionTime: await calculateAverageResolutionTime(zoneId, daysBack)
    };

    return NextResponse.json({
      violations,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      zoneInfo: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        venueId: zone.floorPlan.venueId
      }
    });

  } catch (error) {
    console.error('Error fetching violations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch violations' },
      { status: 500 }
    );
  }
}

// POST /api/zones/[zoneId]/violations - Create a new violation
export async function POST(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = params;
    const body = await request.json();

    // Verify zone exists and user has access
    const zone = await prisma.floorPlanZone.findUnique({
      where: { id: zoneId },
      include: {
        floorPlan: {
          include: { venue: true }
        },
        accessRules: {
          where: { isActive: true }
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    if (session.user.role === 'VENUE_ADMIN' && zone.floorPlan.venue.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to venue' }, { status: 403 });
    }

    const {
      violationType,
      severity,
      description,
      violatorId,
      violatorType,
      detectionMethod,
      confidence,
      ruleViolated,
      actionTaken,
      location,
      imageUrls,
      videoUrls,
      autoResolve
    } = body;

    // Validate required fields
    if (!violationType || !description || !ruleViolated) {
      return NextResponse.json({
        error: 'Missing required fields: violationType, description, ruleViolated'
      }, { status: 400 });
    }

    // Create violation with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the violation
      const violation = await tx.zoneViolation.create({
        data: {
          zoneId,
          violationType,
          severity: severity || 'MEDIUM',
          description,
          violatorId,
          violatorType: violatorType || 'CHILD',
          detectionMethod: detectionMethod || 'STAFF_REPORT',
          confidence,
          ruleViolated,
          actionTaken: actionTaken || 'ALERT',
          location,
          imageUrls: imageUrls || [],
          videoUrls: videoUrls || [],
          metadata: {
            reportedBy: session.user.id,
            reportedAt: new Date().toISOString()
          }
        }
      });

      // Determine appropriate actions based on severity and rule
      const actions = determineViolationActions(zone, violation, zone.accessRules);

      // Execute actions
      for (const action of actions) {
        await executeViolationAction(tx, violation, action, zone.floorPlan.venueId);
      }

      // Auto-resolve if specified and appropriate
      if (autoResolve && canAutoResolve(violation)) {
        await tx.zoneViolation.update({
          where: { id: violation.id },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: session.user.id,
            resolutionNotes: 'Auto-resolved violation',
            resolutionTime: 0 // Immediate resolution
          }
        });
      }

      return violation;
    });

    // Fetch the complete violation with zone info
    const completeViolation = await prisma.zoneViolation.findUnique({
      where: { id: result.id },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json({
      violation: completeViolation,
      message: 'Violation reported successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating violation:', error);
    return NextResponse.json(
      { error: 'Failed to create violation' },
      { status: 500 }
    );
  }
}

// Helper functions
async function calculateAverageResolutionTime(zoneId: string, daysBack: number): Promise<number> {
  const resolvedViolations = await prisma.zoneViolation.findMany({
    where: {
      zoneId,
      isResolved: true,
      resolutionTime: { not: null },
      timestamp: {
        gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    },
    select: { resolutionTime: true }
  });

  if (resolvedViolations.length === 0) return 0;

  const totalTime = resolvedViolations.reduce((sum, v) => sum + (v.resolutionTime || 0), 0);
  return Math.round(totalTime / resolvedViolations.length);
}

function determineViolationActions(zone: any, violation: any, accessRules: any[]): string[] {
  const actions = ['ALERT']; // Always alert
  
  // Find the violated rule
  const violatedRule = accessRules.find(rule => rule.id === violation.ruleViolated);
  
  if (violatedRule) {
    actions.push(violatedRule.violationAction);
  }
  
  // Add severity-based actions
  switch (violation.severity) {
    case 'CRITICAL':
    case 'EMERGENCY':
      actions.push('ESCALATE', 'CONTACT_STAFF');
      break;
    case 'HIGH':
      actions.push('CONTACT_STAFF');
      break;
    case 'MEDIUM':
      if (violation.violatorType === 'CHILD') {
        actions.push('CONTACT_PARENT');
      }
      break;
  }
  
  return [...new Set(actions)]; // Remove duplicates
}

async function executeViolationAction(tx: any, violation: any, action: string, venueId: string) {
  switch (action) {
    case 'ALERT':
      // Create enhanced alert
      await tx.enhancedAlert.create({
        data: {
          type: 'SAFETY',
          subType: 'ZONE_VIOLATION',
          title: `Zone Violation: ${violation.violationType}`,
          description: violation.description,
          severity: mapViolationSeverityToAlertSeverity(violation.severity),
          priority: 'HIGH',
          venueId,
          floorPlanZoneId: violation.zoneId,
          triggerData: {
            violationId: violation.id,
            violationType: violation.violationType,
            violatorId: violation.violatorId
          }
        }
      });
      break;
      
    case 'CONTACT_PARENT':
      // Implementation for parent notification
      break;
      
    case 'CONTACT_STAFF':
      // Implementation for staff notification
      break;
      
    case 'ESCALATE':
      // Implementation for escalation
      break;
      
    case 'CREATE_INCIDENT':
      // Implementation for incident creation
      break;
      
    default:
      // Log unknown action
      console.warn(`Unknown violation action: ${action}`);
  }
}

function canAutoResolve(violation: any): boolean {
  // Define which violations can be auto-resolved
  const autoResolvableTypes = [
    'NOISE_VIOLATION',
    'DRESS_CODE_VIOLATION',
    'FOOD_RESTRICTION'
  ];
  
  return autoResolvableTypes.includes(violation.violationType) && 
         violation.severity === 'LOW';
}

function mapViolationSeverityToAlertSeverity(violationSeverity: string): string {
  const mapping: { [key: string]: string } = {
    'LOW': 'LOW',
    'MEDIUM': 'MEDIUM',
    'HIGH': 'HIGH',
    'CRITICAL': 'CRITICAL',
    'EMERGENCY': 'CRITICAL'
  };
  
  return mapping[violationSeverity] || 'MEDIUM';
}
