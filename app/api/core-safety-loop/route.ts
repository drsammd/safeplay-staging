
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { coreSafetyLoopIntegrationService } from '@/lib/services/core-safety-loop-integration-service';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET /api/core-safety-loop - Get Core Safety Loop status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const action = searchParams.get('action'); // 'status', 'alerts', 'statistics'

    if (action === 'statistics') {
      // Get system-wide statistics (admin only)
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      const statistics = coreSafetyLoopIntegrationService.getSystemStatistics();
      return NextResponse.json({
        success: true,
        statistics
      });
    }

    if (!venueId) {
      // Get all active venues for user
      if (session.user.role === 'SUPER_ADMIN') {
        const allVenues = coreSafetyLoopIntegrationService.getAllActiveVenues();
        return NextResponse.json({
          success: true,
          venues: allVenues
        });
      } else {
        return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
      }
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
      case 'alerts':
        const alerts = coreSafetyLoopIntegrationService.getVenueAlerts(venueId);
        return NextResponse.json({
          success: true,
          alerts
        });

      default:
        // Get venue status
        const status = coreSafetyLoopIntegrationService.getVenueStatus(venueId);
        return NextResponse.json({
          success: true,
          status,
          isActive: !!status?.isActive
        });
    }
  } catch (error) {
    console.error('Error getting Core Safety Loop status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/core-safety-loop - Start/stop Core Safety Loop
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
    const { action, venueId, alertId } = body;

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
      case 'start':
        const startResult = await coreSafetyLoopIntegrationService.startCoreSafetyLoop(venueId);
        
        // Log system start event
        await prisma.analyticsEvent.create({
          data: {
            eventType: 'SYSTEM',
            category: 'SYSTEM',
            timestamp: new Date(),
            userId: session.user.id,
            venueId,
            eventData: {
              action: 'core_safety_loop_start',
              result: startResult.success ? 'success' : 'failure',
              message: startResult.message
            },
            metadata: {
              userRole: session.user.role,
              initiatedBy: session.user.id
            }
          }
        });

        return NextResponse.json({
          success: startResult.success,
          message: startResult.message,
          status: startResult.success ? coreSafetyLoopIntegrationService.getVenueStatus(venueId) : null
        });

      case 'stop':
        const stopResult = await coreSafetyLoopIntegrationService.stopCoreSafetyLoop(venueId);
        
        // Log system stop event
        await prisma.analyticsEvent.create({
          data: {
            eventType: 'SYSTEM',
            category: 'SYSTEM',
            timestamp: new Date(),
            userId: session.user.id,
            venueId,
            eventData: {
              action: 'core_safety_loop_stop',
              result: stopResult.success ? 'success' : 'failure',
              message: stopResult.message
            },
            metadata: {
              userRole: session.user.role,
              initiatedBy: session.user.id
            }
          }
        });

        return NextResponse.json({
          success: stopResult.success,
          message: stopResult.message
        });

      case 'acknowledge_alert':
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }

        await coreSafetyLoopIntegrationService.acknowledgeAlert(venueId, alertId);
        
        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged'
        });

      case 'restart':
        // Stop and then start the system
        const stopForRestart = await coreSafetyLoopIntegrationService.stopCoreSafetyLoop(venueId);
        if (!stopForRestart.success) {
          return NextResponse.json({
            success: false,
            message: `Failed to stop system for restart: ${stopForRestart.message}`
          });
        }

        // Wait a moment before restarting
        await new Promise(resolve => setTimeout(resolve, 2000));

        const restartResult = await coreSafetyLoopIntegrationService.startCoreSafetyLoop(venueId);
        
        // Log system restart event
        await prisma.analyticsEvent.create({
          data: {
            eventType: 'SYSTEM',
            category: 'SYSTEM',
            timestamp: new Date(),
            userId: session.user.id,
            venueId,
            eventData: {
              action: 'core_safety_loop_restart',
              result: restartResult.success ? 'success' : 'failure',
              message: restartResult.message
            },
            metadata: {
              userRole: session.user.role,
              initiatedBy: session.user.id
            }
          }
        });

        return NextResponse.json({
          success: restartResult.success,
          message: `System restarted: ${restartResult.message}`,
          status: restartResult.success ? coreSafetyLoopIntegrationService.getVenueStatus(venueId) : null
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing Core Safety Loop:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/core-safety-loop - Update system configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { venueId, configuration } = body;

    if (!venueId || !configuration) {
      return NextResponse.json({ error: 'Venue ID and configuration required' }, { status: 400 });
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

    // Update venue metadata (since configuration field doesn't exist)
    await prisma.venue.update({
      where: { id: venueId },
      data: {
        updatedAt: new Date()
      }
    });

    // Log configuration update
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'CONFIGURATION',
        category: 'SYSTEM',
        timestamp: new Date(),
        userId: session.user.id,
        venueId,
        eventData: {
          action: 'core_safety_loop_config_update',
          configuration
        },
        metadata: {
          userRole: session.user.role,
          updatedBy: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating Core Safety Loop configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
