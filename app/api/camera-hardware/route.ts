
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cameraHardwareIntegrationService } from '@/lib/services/camera-hardware-integration-service';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/camera-hardware - Get camera hardware status and discovery
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'drivers', 'discovered', 'status'
    const cameraId = searchParams.get('cameraId');

    switch (action) {
      case 'drivers':
        const drivers = cameraHardwareIntegrationService.getAvailableDrivers();
        return NextResponse.json({
          success: true,
          drivers
        });

      case 'discovered':
        const discoveredCameras = cameraHardwareIntegrationService.getDiscoveredCameras();
        return NextResponse.json({
          success: true,
          discoveredCameras
        });

      case 'status':
        if (cameraId) {
          const status = cameraHardwareIntegrationService.getCameraStatus(cameraId);
          return NextResponse.json({
            success: true,
            cameraId,
            status
          });
        } else {
          const allStatuses = cameraHardwareIntegrationService.getAllCameraStatuses();
          return NextResponse.json({
            success: true,
            statuses: allStatuses
          });
        }

      default:
        // Get comprehensive hardware information
        return NextResponse.json({
          success: true,
          data: {
            drivers: cameraHardwareIntegrationService.getAvailableDrivers(),
            discoveredCameras: cameraHardwareIntegrationService.getDiscoveredCameras(),
            statuses: cameraHardwareIntegrationService.getAllCameraStatuses()
          }
        });
    }
  } catch (error) {
    console.error('Error getting camera hardware data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/camera-hardware - Connect, disconnect, or test cameras
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
    const { action, cameraId, connectionConfig } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    switch (action) {
      case 'connect':
        if (!cameraId || !connectionConfig) {
          return NextResponse.json(
            { error: 'Camera ID and connection config required' },
            { status: 400 }
          );
        }

        // Verify camera exists and user has access
        const camera = await prisma.camera.findFirst({
          where: {
            id: cameraId,
            OR: [
              { venue: { adminId: session.user.id } },
              { venue: { admin: { role: 'SUPER_ADMIN' } } }
            ]
          }
        });

        if (!camera && session.user.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ error: 'Camera not found or access denied' }, { status: 403 });
        }

        const connectResult = await cameraHardwareIntegrationService.connectCamera(
          cameraId,
          connectionConfig
        );

        return NextResponse.json({
          success: connectResult.success,
          message: connectResult.message,
          status: connectResult.status
        });

      case 'disconnect':
        if (!cameraId) {
          return NextResponse.json({ error: 'Camera ID required' }, { status: 400 });
        }

        const disconnectResult = await cameraHardwareIntegrationService.disconnectCamera(cameraId);

        return NextResponse.json({
          success: disconnectResult.success,
          message: disconnectResult.message
        });

      case 'test':
        const { ipAddress, port, username, password } = connectionConfig || {};
        
        if (!ipAddress) {
          return NextResponse.json({ error: 'IP address required for test' }, { status: 400 });
        }

        const testResult = await cameraHardwareIntegrationService.testCameraConfiguration(
          ipAddress,
          port || 554,
          username,
          password
        );

        return NextResponse.json({
          success: testResult.success,
          message: testResult.message,
          details: testResult.details
        });

      case 'calibrate':
        if (!cameraId) {
          return NextResponse.json({ error: 'Camera ID required' }, { status: 400 });
        }

        // Verify camera access
        const calibrationCamera = await prisma.camera.findFirst({
          where: {
            id: cameraId,
            OR: [
              { venue: { adminId: session.user.id } },
              { venue: { admin: { role: 'SUPER_ADMIN' } } }
            ]
          }
        });

        if (!calibrationCamera && session.user.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ error: 'Camera not found or access denied' }, { status: 403 });
        }

        const calibrationResult = await cameraHardwareIntegrationService.calibrateCamera(cameraId);

        return NextResponse.json({
          success: calibrationResult.success,
          calibrationData: calibrationResult.calibrationData,
          message: calibrationResult.success ? 'Camera calibration completed' : 'Camera calibration failed'
        });

      case 'install_driver':
        const { driverPackage } = body;
        
        if (!driverPackage) {
          return NextResponse.json({ error: 'Driver package required' }, { status: 400 });
        }

        const installResult = await cameraHardwareIntegrationService.installDriver(driverPackage);

        return NextResponse.json({
          success: installResult.success,
          message: installResult.message
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in camera hardware operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
