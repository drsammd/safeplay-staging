
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { enhancedRekognitionService } from '@/lib/aws/rekognition-service';

export const dynamic = 'force-dynamic';

// GET /api/faces/collections - List face collections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    // Verify user access to venue
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedVenues: true
      }
    });

    if (!user?.managedVenues?.length && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Venue access required' }, { status: 403 });
    }

    const targetVenueId = venueId || user.managedVenues?.[0]?.id;
    if (!targetVenueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    // Get venue and its face collection
    const venue = await prisma.venue.findUnique({
      where: { id: targetVenueId },
      select: {
        id: true,
        name: true,
        faceCollectionId: true,
        faceRecognitionEnabled: true
      }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Get collection info from AWS if collection exists
    let collectionInfo = null;
    if (venue.faceCollectionId) {
      try {
        collectionInfo = await enhancedRekognitionService.getCollectionInfo(venue.faceCollectionId);
      } catch (error) {
        console.error('Error getting collection info:', error);
        collectionInfo = { 
          success: false, 
          error: 'AWS connection error',
          awsAvailable: false
        };
      }
    }

    // Get children with face registration status
    const children = await prisma.child.findMany({
      where: { currentVenueId: targetVenueId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        faceRecognitionEnabled: true,
        biometricId: true,
        createdAt: true
      },
      orderBy: { firstName: 'asc' }
    });

    return NextResponse.json({
      success: true,
      venue: {
        id: venue.id,
        name: venue.name,
        faceCollectionId: venue.faceCollectionId,
        faceRecognitionEnabled: venue.faceRecognitionEnabled
      },
      collection: collectionInfo || { success: false, error: 'No collection configured' },
      children: children.map(child => ({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        faceRegistered: !!child.biometricId,
        faceRecognitionEnabled: child.faceRecognitionEnabled,
        registeredAt: child.createdAt
      })),
      stats: {
        totalChildren: children.length,
        registeredFaces: children.filter(c => !!c.biometricId).length,
        enabledRecognition: children.filter(c => c.faceRecognitionEnabled).length
      }
    });

  } catch (error) {
    console.error('Error in faces/collections GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch face collections'
    }, { status: 500 });
  }
}

// POST /api/faces/collections - Create face collection for venue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { venueId } = await request.json();

    // Verify user access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedVenues: true
      }
    });

    if (!user?.managedVenues?.length && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Venue admin access required' }, { status: 403 });
    }

    const targetVenueId = venueId || user.managedVenues?.[0]?.id;
    if (!targetVenueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: targetVenueId }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Check if collection already exists
    if (venue.faceCollectionId) {
      return NextResponse.json({
        success: false,
        error: 'Face collection already exists for this venue'
      }, { status: 400 });
    }

    // Create face collection
    const collectionId = `safeplay-venue-${targetVenueId}`;
    
    try {
      const result = await enhancedRekognitionService.createCollection(collectionId);
      
      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to create AWS face collection'
        }, { status: 500 });
      }

      // Update venue with collection ID
      await prisma.venue.update({
        where: { id: targetVenueId },
        data: {
          faceCollectionId: collectionId,
          faceRecognitionEnabled: true
        }
      });

      return NextResponse.json({
        success: true,
        collectionId,
        message: 'Face collection created successfully'
      });

    } catch (error) {
      console.error('AWS face collection creation error:', error);
      
      if (error.name === 'AccessDeniedException') {
        return NextResponse.json({
          success: false,
          error: 'AWS permissions required. Please check setup guide.',
          awsPermissionsNeeded: true
        }, { status: 503 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'AWS service unavailable'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error in faces/collections POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create face collection'
    }, { status: 500 });
  }
}

// DELETE /api/faces/collections - Delete face collection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    // Verify admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    // Get venue
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue?.faceCollectionId) {
      return NextResponse.json({
        success: false,
        error: 'No face collection found for this venue'
      }, { status: 404 });
    }

    try {
      // Delete AWS collection
      const result = await enhancedRekognitionService.deleteCollection(venue.faceCollectionId);
      
      if (!result.success) {
        console.warn('AWS collection deletion failed:', result.error);
      }

      // Update venue (remove collection reference)
      await prisma.venue.update({
        where: { id: venueId },
        data: {
          faceCollectionId: null,
          faceRecognitionEnabled: false
        }
      });

      // Clear children biometric data
      await prisma.child.updateMany({
        where: { currentVenueId: venueId },
        data: {
          biometricId: null,
          faceRecognitionEnabled: false
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Face collection deleted successfully'
      });

    } catch (error) {
      console.error('AWS collection deletion error:', error);
      
      // Still update database even if AWS deletion fails
      await prisma.venue.update({
        where: { id: venueId },
        data: {
          faceCollectionId: null,
          faceRecognitionEnabled: false
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Face collection removed (AWS cleanup may have failed)',
        warning: 'Manual AWS cleanup may be required'
      });
    }

  } catch (error) {
    console.error('Error in faces/collections DELETE:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete face collection'
    }, { status: 500 });
  }
}
