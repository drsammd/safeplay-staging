
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CheckInOutType, CheckInMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST /api/check-in-out/bulk - Bulk check-in/out operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      children, // Array of child objects with childId, eventType, etc.
      venueId,
      method = 'STAFF_MANUAL',
      groupNotes,
      metadata,
    } = body;

    if (!children || !Array.isArray(children) || children.length === 0) {
      return NextResponse.json(
        { error: 'Children array is required and must not be empty' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const childData of children) {
      try {
        const { childId, eventType, qrCode, notes } = childData;

        // Verify child access permissions
        if (session.user.role === 'PARENT') {
          const child = await prisma.child.findFirst({
            where: { id: childId, parentId: session.user.id },
          });
          if (!child) {
            errors.push({
              childId,
              error: 'Child not found or access denied',
            });
            continue;
          }
        }

        // Create check-in/out event
        const checkInOutEvent = await prisma.checkInOutEvent.create({
          data: {
            childId,
            venueId,
            parentId: session.user.role === 'PARENT' ? session.user.id : childData.parentId,
            eventType,
            method,
            qrCode,
            authorizedBy: session.user.id,
            isAuthorized: true,
            notes: notes || groupNotes,
            metadata: {
              ...metadata,
              bulkOperation: true,
              groupId: `bulk_${Date.now()}`,
            },
          },
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Update child status
        const newStatus = eventType === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT';
        await prisma.child.update({
          where: { id: childId },
          data: { 
            status: newStatus,
            currentVenueId: eventType === 'CHECK_IN' ? venueId : null,
          },
        });

        results.push({
          success: true,
          childId,
          eventId: checkInOutEvent.id,
          childName: `${checkInOutEvent.child.firstName} ${checkInOutEvent.child.lastName}`,
        });
      } catch (error) {
        errors.push({
          childId: childData.childId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errorCount: errors.length,
      results,
      errors,
      message: `Bulk operation completed: ${results.length} successful, ${errors.length} failed`,
    });
  } catch (error) {
    console.error('Error in bulk check-in/out operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk check-in/out operation' },
      { status: 500 }
    );
  }
}
