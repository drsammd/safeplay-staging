
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { realTimeFaceRecognitionService } from '@/lib/services/real-time-face-recognition-service';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/real-time/face-recognition - Get real-time recognition status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const cameraId = searchParams.get('cameraId');

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

    if (cameraId) {
      // Get recent recognitions for specific camera
      const recentRecognitions = realTimeFaceRecognitionService.getRecentRecognitions(cameraId, 20);
      return NextResponse.json({
        success: true,
        cameraId,
        recentRecognitions,
        isActive: recentRecognitions.length > 0
      });
    } else {
      // Get all active streams for venue
      const activeStreams = realTimeFaceRecognitionService.getActiveStreams()
        .filter(stream => stream.venueId === venueId);
      
      const streamStatus = await Promise.all(
        activeStreams.map(async (stream) => {
          const recentRecognitions = realTimeFaceRecognitionService.getRecentRecognitions(stream.cameraId, 5);
          return {
            cameraId: stream.cameraId,
            isActive: stream.isActive,
            zone: stream.zone,
            frameRate: stream.frameRate,
            threshold: stream.recognitionThreshold,
            recentRecognitionCount: recentRecognitions.length,
            lastRecognition: recentRecognitions[recentRecognitions.length - 1]?.timestamp
          };
        })
      );

      return NextResponse.json({
        success: true,
        venueId,
        activeStreams: streamStatus,
        totalActiveStreams: activeStreams.length
      });
    }
  } catch (error) {
    console.error('Error getting real-time recognition status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/real-time/face-recognition - Configure camera for real-time recognition
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
    const {
      cameraId,
      venueId,
      action, // 'start', 'stop', 'simulate'
      frameRate = 1, // frames per second
      recognitionThreshold = 80,
      zone
    } = body;

    if (!cameraId || !venueId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: cameraId, venueId, action' },
        { status: 400 }
      );
    }

    // Verify camera exists and access permissions
    const camera = await prisma.camera.findFirst({
      where: {
        id: cameraId,
        venueId,
        OR: [
          { venue: { adminId: session.user.id } },
          { venue: { admin: { role: 'SUPER_ADMIN' } } }
        ]
      },
      include: { venue: true }
    });

    if (!camera && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Camera not found or access denied' }, { status: 403 });
    }

    switch (action) {
      case 'start':
        const configResult = await realTimeFaceRecognitionService.configureCameraStream({
          cameraId,
          streamUrl: camera?.streamUrl || `demo://camera-${cameraId}`,
          venueId,
          isActive: true,
          frameRate,
          recognitionThreshold,
          zone
        });

        if (!configResult.success) {
          return NextResponse.json({ error: configResult.message }, { status: 400 });
        }

        // Update camera recognition settings
        await prisma.camera.update({
          where: { id: cameraId },
          data: {
            isRecognitionEnabled: true,
            recognitionThreshold: recognitionThreshold / 100 // Convert to decimal
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Real-time face recognition started',
          cameraId,
          configuration: configResult
        });

      case 'stop':
        await realTimeFaceRecognitionService.stopCameraStream(cameraId);
        
        // Update camera recognition settings
        await prisma.camera.update({
          where: { id: cameraId },
          data: { isRecognitionEnabled: false }
        });

        return NextResponse.json({
          success: true,
          message: 'Real-time face recognition stopped',
          cameraId
        });

      case 'simulate':
        // Start demo simulation
        await realTimeFaceRecognitionService.simulateDemoRecognition(cameraId, venueId);
        
        return NextResponse.json({
          success: true,
          message: 'Demo recognition simulation triggered',
          cameraId
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error configuring real-time face recognition:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/real-time/face-recognition - Process video frame
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      cameraId,
      frameData, // base64 encoded image
      frameId,
      timestamp
    } = body;

    if (!cameraId || !frameData || !frameId) {
      return NextResponse.json(
        { error: 'Missing required fields: cameraId, frameData, frameId' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(frameData, 'base64');
    
    // Add frame to processing queue
    await realTimeFaceRecognitionService.addFrameToQueue({
      imageData: imageBuffer,
      timestamp: new Date(timestamp || Date.now()),
      cameraId,
      frameId,
      metadata: { source: 'api' }
    });

    return NextResponse.json({
      success: true,
      message: 'Frame added to processing queue',
      frameId,
      cameraId
    });
  } catch (error) {
    console.error('Error processing video frame:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
