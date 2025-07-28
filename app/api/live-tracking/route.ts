
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { liveTrackingService } from '@/lib/services/live-tracking-service';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/live-tracking - Get live tracking data for venue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const action = searchParams.get('action'); // 'status', 'children', 'zones', 'statistics'

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    // Verify venue access
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { admin: { role: 'SUPER_ADMIN' } },
          // Parents can view if their children are at the venue
          { children: { some: { parentId: session.user.id } } }
        ]
      }
    });

    if (!venue && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (action) {
      case 'children':
        // Get child locations only
        const trackingData = liveTrackingService.getVenueTrackingData(venueId);
        return NextResponse.json({
          success: true,
          children: trackingData?.children || [],
          lastUpdated: trackingData?.lastUpdated
        });

      case 'zones':
        // Get zone occupancy only
        const zoneData = liveTrackingService.getVenueTrackingData(venueId);
        return NextResponse.json({
          success: true,
          zones: zoneData?.zones || [],
          lastUpdated: zoneData?.lastUpdated
        });

      case 'statistics':
        // Get tracking statistics
        const stats = liveTrackingService.getTrackingStatistics();
        return NextResponse.json({
          success: true,
          statistics: stats
        });

      default:
        // Get full venue tracking status
        const fullData = liveTrackingService.getVenueTrackingData(venueId);
        
        if (!fullData) {
          // Initialize tracking if not exists
          const initResult = await liveTrackingService.initializeVenueTracking(venueId);
          if (!initResult.success) {
            return NextResponse.json({ error: initResult.message }, { status: 400 });
          }
          
          const newData = liveTrackingService.getVenueTrackingData(venueId);
          return NextResponse.json({
            success: true,
            data: newData,
            initialized: true
          });
        }

        return NextResponse.json({
          success: true,
          data: fullData
        });
    }
  } catch (error) {
    console.error('Error getting live tracking data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/live-tracking - Initialize or update tracking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, venueId, childId, location, zone, confidence } = body;

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    // Verify venue access
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { admin: { role: 'SUPER_ADMIN' } }
        ]
      }
    });

    if (!venue && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (action) {
      case 'initialize':
        const initResult = await liveTrackingService.initializeVenueTracking(venueId);
        return NextResponse.json({
          success: initResult.success,
          message: initResult.message,
          data: initResult.success ? liveTrackingService.getVenueTrackingData(venueId) : null
        });

      case 'update_location':
        if (!childId || !zone) {
          return NextResponse.json(
            { error: 'Child ID and zone required for location update' },
            { status: 400 }
          );
        }

        await liveTrackingService.updateChildLocation(
          childId,
          venueId,
          zone,
          location || { x: 0, y: 0 },
          confidence || 0.9
        );

        return NextResponse.json({
          success: true,
          message: 'Child location updated',
          location: liveTrackingService.getChildLocation(childId)
        });

      case 'manual_checkin':
        if (!childId) {
          return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
        }

        // Create check-in event
        await prisma.checkInOutEvent.create({
          data: {
            childId,
            venueId,
            userId: session.user.id,
            eventType: 'CHECK_IN',
            method: 'MANUAL',
            verifiedBy: session.user.id,
            location: {
              area: 'Main Entrance',
              coordinates: { x: 0, y: 0 }
            }
          }
        });

        // Update child venue
        await prisma.child.update({
          where: { id: childId },
          data: { currentVenueId: venueId }
        });

        // Initialize location tracking
        await liveTrackingService.updateChildLocation(
          childId,
          venueId,
          'Entrance',
          { x: 0, y: 0 },
          1.0
        );

        return NextResponse.json({
          success: true,
          message: 'Child checked in manually',
          location: liveTrackingService.getChildLocation(childId)
        });

      case 'manual_checkout':
        if (!childId) {
          return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
        }

        // Create check-out event
        await prisma.checkInOutEvent.create({
          data: {
            childId,
            venueId,
            userId: session.user.id,
            eventType: 'CHECK_OUT',
            method: 'MANUAL',
            verifiedBy: session.user.id,
            location: {
              area: 'Main Exit',
              coordinates: { x: 0, y: 0 }
            }
          }
        });

        // Update child venue
        await prisma.child.update({
          where: { id: childId },
          data: { currentVenueId: null }
        });

        return NextResponse.json({
          success: true,
          message: 'Child checked out manually'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating live tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/live-tracking - Update child location from recognition
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childId, venueId, zone, coordinates, confidence, cameraId } = body;

    if (!childId || !venueId || !zone) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, venueId, zone' },
        { status: 400 }
      );
    }

    // Verify child access (parents can only update their own children)
    if (session.user.role === 'PARENT') {
      const child = await prisma.child.findFirst({
        where: { id: childId, parentId: session.user.id }
      });
      if (!child) {
        return NextResponse.json({ error: 'Child not found or access denied' }, { status: 403 });
      }
    }

    // Update child location
    await liveTrackingService.updateChildLocation(
      childId,
      venueId,
      zone,
      coordinates || { x: 0, y: 0 },
      confidence || 0.9,
      cameraId
    );

    const updatedLocation = liveTrackingService.getChildLocation(childId);

    return NextResponse.json({
      success: true,
      message: 'Child location updated from recognition',
      location: updatedLocation
    });
  } catch (error) {
    console.error('Error updating child location from recognition:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
