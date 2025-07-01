
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { KioskType, KioskStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/kiosks - Get kiosks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status') as KioskStatus | null;
    const kioskType = searchParams.get('kioskType') as KioskType | null;

    const where: any = {};

    if (session.user.role === 'VENUE_ADMIN') {
      // Verify venue access
      if (venueId) {
        const venue = await prisma.venue.findFirst({
          where: { id: venueId, adminId: session.user.id },
        });
        if (!venue) {
          return NextResponse.json(
            { error: 'Venue not found or access denied' },
            { status: 403 }
          );
        }
        where.venueId = venueId;
      }
    } else if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (status) where.status = status;
    if (kioskType) where.kioskType = kioskType;

    const kiosks = await prisma.checkInKiosk.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        _count: {
          select: {
            checkInEvents: true,
            kioskSessions: true,
            maintenanceLogs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate additional statistics
    const kiosksWithStats = await Promise.all(
      kiosks.map(async (kiosk) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEvents = await prisma.checkInOutEvent.count({
          where: {
            kioskId: kiosk.id,
            timestamp: { gte: today },
          },
        });

        const activeSessions = await prisma.kioskSession.count({
          where: {
            kioskId: kiosk.id,
            status: 'ACTIVE',
          },
        });

        return {
          ...kiosk,
          stats: {
            totalEvents: kiosk._count.checkInEvents,
            totalSessions: kiosk._count.kioskSessions,
            maintenanceLogs: kiosk._count.maintenanceLogs,
            todayEvents,
            activeSessions,
          },
        };
      })
    );

    return NextResponse.json({ kiosks: kiosksWithStats });
  } catch (error) {
    console.error('Error fetching kiosks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kiosks' },
      { status: 500 }
    );
  }
}

// POST /api/kiosks - Create new kiosk
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only venue admin or company admin can create kiosks
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Only venue administrators can create kiosks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      kioskId,
      name,
      venueId,
      location,
      kioskType,
      ipAddress,
      macAddress,
      hardware,
      software,
      capabilities = [],
    } = body;

    // Validate required fields
    if (!kioskId || !name || !venueId || !location || !kioskType) {
      return NextResponse.json(
        { error: 'Missing required fields: kioskId, name, venueId, location, kioskType' },
        { status: 400 }
      );
    }

    // Verify venue access for venue admin
    if (session.user.role === 'VENUE_ADMIN') {
      const venue = await prisma.venue.findFirst({
        where: { id: venueId, adminId: session.user.id },
      });
      if (!venue) {
        return NextResponse.json(
          { error: 'Venue not found or access denied' },
          { status: 403 }
        );
      }
    }

    // Check if kiosk ID already exists
    const existingKiosk = await prisma.checkInKiosk.findFirst({
      where: { kioskId },
    });

    if (existingKiosk) {
      return NextResponse.json(
        { error: 'Kiosk ID already exists' },
        { status: 400 }
      );
    }

    const kiosk = await prisma.checkInKiosk.create({
      data: {
        kioskId,
        name,
        venueId,
        location,
        kioskType,
        status: 'OFFLINE',
        ipAddress,
        macAddress,
        hardware,
        software,
        capabilities,
        configurationVersion: '1.0',
        nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      kiosk,
      message: 'Kiosk created successfully',
    });
  } catch (error) {
    console.error('Error creating kiosk:', error);
    return NextResponse.json(
      { error: 'Failed to create kiosk' },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosks - Update kiosk
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      kioskId,
      status,
      ipAddress,
      hardware,
      software,
      capabilities,
      configurationVersion,
      maintenanceNotes,
      performanceScore,
    } = body;

    if (!kioskId) {
      return NextResponse.json(
        { error: 'Kiosk ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      updateData.lastHeartbeat = new Date();
    }
    if (ipAddress) updateData.ipAddress = ipAddress;
    if (hardware) updateData.hardware = hardware;
    if (software) updateData.software = software;
    if (capabilities) updateData.capabilities = capabilities;
    if (configurationVersion) updateData.configurationVersion = configurationVersion;
    if (maintenanceNotes) updateData.maintenanceNotes = maintenanceNotes;
    if (performanceScore !== undefined) updateData.performanceScore = performanceScore;

    // Update system metrics if provided
    if (body.systemMetrics) {
      const { cpuUsage, memoryUsed, diskUsage, storageUsed, batteryLevel, temperatureStatus } = body.systemMetrics;
      if (cpuUsage !== undefined) updateData.cpuUsage = cpuUsage;
      if (memoryUsed !== undefined) updateData.memoryUsed = memoryUsed;
      if (diskUsage !== undefined) updateData.diskUsage = diskUsage;
      if (storageUsed !== undefined) updateData.storageUsed = storageUsed;
      if (batteryLevel !== undefined) updateData.batteryLevel = batteryLevel;
      if (temperatureStatus) updateData.temperatureStatus = temperatureStatus;
    }

    const kiosk = await prisma.checkInKiosk.update({
      where: { kioskId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      kiosk,
      message: 'Kiosk updated successfully',
    });
  } catch (error) {
    console.error('Error updating kiosk:', error);
    return NextResponse.json(
      { error: 'Failed to update kiosk' },
      { status: 500 }
    );
  }
}
