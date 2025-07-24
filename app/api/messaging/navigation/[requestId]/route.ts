
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../lib/db';
import { enhancedNavigationService } from '../../../../../lib/services/enhanced-navigation-service';

// PUT /api/messaging/navigation/[requestId] - Update navigation progress
export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;
    const body = await request.json();
    const { currentZoneId, actualTime, completed = false, abandoned = false } = body;

    // Verify navigation request belongs to user
    const navigationRequest = await prisma.navigationRequest.findFirst({
      where: {
        id: requestId,
        parentId: session.user.id,
      },
    });

    if (!navigationRequest) {
      return NextResponse.json({ error: 'Navigation request not found' }, { status: 404 });
    }

    if (completed || abandoned) {
      // Complete or abandon navigation
      const finalActualTime = actualTime || 
        Math.round((Date.now() - new Date(navigationRequest.requestedAt).getTime()) / (1000 * 60));

      if (completed) {
        const result = await enhancedNavigationService.completeNavigation(
          requestId,
          finalActualTime
        );

        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }
      } else {
        // Mark as abandoned
        await prisma.navigationRequest.update({
          where: { id: requestId },
          data: {
            actualTime: finalActualTime,
            completedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Navigation marked as abandoned',
        });
      }
    } else if (currentZoneId) {
      // Update progress
      const result = await enhancedNavigationService.updateNavigationProgress(
        requestId,
        currentZoneId
      );

      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either currentZoneId or completion status required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating navigation progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/messaging/navigation/[requestId] - Get navigation details
export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;

    const navigationRequest = await prisma.navigationRequest.findFirst({
      where: {
        id: requestId,
        parentId: session.user.id,
      },
      include: {
        child: {
          select: { id: true, firstName: true, lastName: true },
        },
        venue: {
          select: { id: true, name: true },
        },
      },
    });

    if (!navigationRequest) {
      return NextResponse.json({ error: 'Navigation request not found' }, { status: 404 });
    }

    const formattedRequest = {
      id: navigationRequest.id,
      childId: navigationRequest.childId,
      venue: navigationRequest.venue,
      targetLocation: navigationRequest.toLocation,
      estimatedTime: navigationRequest.estimatedTime,
      actualTime: navigationRequest.actualTime,
      requestedAt: navigationRequest.requestedAt,
      completedAt: navigationRequest.completedAt,
    };

    return NextResponse.json({
      success: true,
      navigation: formattedRequest,
    });
  } catch (error: any) {
    console.error('Error getting navigation details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
