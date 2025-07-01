
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/db';
import { enhancedNavigationService } from '../../../../lib/services/enhanced-navigation-service';
import { NavigationMode } from '@prisma/client';

// POST /api/messaging/navigation - Generate navigation path
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      childId, 
      venueId, 
      targetLocation, 
      mode = 'WALKING',
      avoidCrowds = true,
      accessibilityNeeds = false,
      prioritizeSafety = true 
    } = body;

    if (!childId || !venueId || !targetLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, venueId, targetLocation' },
        { status: 400 }
      );
    }

    if (!Object.values(NavigationMode).includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid navigation mode' },
        { status: 400 }
      );
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: session.user.id,
      },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found or access denied' }, { status: 404 });
    }

    // Verify venue access
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { children: { some: { parentId: session.user.id } } }
        ]
      }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Access denied to venue' }, { status: 403 });
    }

    // Generate navigation path
    const result = await enhancedNavigationService.generateNavigationPath(
      session.user.id,
      childId,
      venueId,
      targetLocation,
      {
        mode: mode as NavigationMode,
        avoidCrowds,
        accessibilityNeeds,
        prioritizeSafety,
      }
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error generating navigation path:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/messaging/navigation - Get navigation history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const venueId = searchParams.get('venueId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {
      parentId: session.user.id,
    };

    if (childId) {
      where.childId = childId;
    }

    if (venueId) {
      where.venueId = venueId;
    }

    const navigationHistory = await prisma.navigationRequest.findMany({
      where,
      include: {
        child: {
          select: { id: true, firstName: true, lastName: true },
        },
        venue: {
          select: { id: true, name: true },
        },
        path: true,
      },
      orderBy: { requestedAt: 'desc' },
      take: limit,
    });

    const formattedHistory = navigationHistory.map(request => ({
      id: request.id,
      child: request.child,
      venue: request.venue,
      targetLocation: request.targetLocation,
      mode: request.mode,
      estimatedTime: request.estimatedTime,
      actualTime: request.actualTime,
      crowdFactor: request.crowdFactor,
      requestedAt: request.requestedAt,
      completedAt: request.completedAt,
      abandoned: request.abandoned,
      path: request.path ? {
        waypoints: request.path.waypoints,
        totalDistance: request.path.totalDistance,
        estimatedTime: request.path.estimatedTime,
        crowdAvoidance: request.path.crowdAvoidance,
        accessibilityMode: request.path.accessibilityMode,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      history: formattedHistory,
    });
  } catch (error: any) {
    console.error('Error getting navigation history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
