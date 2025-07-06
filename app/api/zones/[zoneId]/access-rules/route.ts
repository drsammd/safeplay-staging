
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/zones/[zoneId]/access-rules - Get access rules for a zone
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

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

    const whereClause: any = { zoneId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const accessRules = await prisma.zoneAccessRule.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({
      accessRules,
      zoneInfo: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        venueId: zone.floorPlan.venueId
      }
    });

  } catch (error) {
    console.error('Error fetching access rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access rules' },
      { status: 500 }
    );
  }
}

// POST /api/zones/[zoneId]/access-rules - Create access rule
export async function POST(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { zoneId } = params;
    const body = await request.json();

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

    const {
      ruleType,
      userRole,
      ageRange,
      timeRestrictions,
      membershipRequired,
      staffEscortRequired,
      maxOccupancyTime,
      requiresPermission,
      permissionGrantedBy,
      priority,
      conditions,
      exceptions,
      violationAction
    } = body;

    // Validate required fields
    if (!ruleType || !violationAction) {
      return NextResponse.json({
        error: 'Missing required fields: ruleType, violationAction'
      }, { status: 400 });
    }

    // Create access rule
    const accessRule = await prisma.zoneAccessRule.create({
      data: {
        zoneId,
        ruleType,
        userRole,
        ageRange,
        timeRestrictions,
        membershipRequired: membershipRequired || false,
        staffEscortRequired: staffEscortRequired || false,
        maxOccupancyTime,
        requiresPermission: requiresPermission || false,
        permissionGrantedBy,
        priority: priority || 1,
        conditions,
        exceptions,
        violationAction,
        metadata: {
          createdBy: session.user.id,
          createdAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      accessRule,
      message: 'Access rule created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating access rule:', error);
    return NextResponse.json(
      { error: 'Failed to create access rule' },
      { status: 500 }
    );
  }
}
