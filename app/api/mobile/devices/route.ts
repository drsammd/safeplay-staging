
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get user's mobile devices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devices = await db.mobileDevice.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: {
        lastSeen: 'desc'
      }
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Error fetching mobile devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Register a new mobile device
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, deviceToken, deviceType, platform, appVersion, osVersion, notificationSettings } = body;

    if (!deviceId || !deviceType || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if device already exists and update it, otherwise create new
    const existingDevice = await db.mobileDevice.findUnique({
      where: { deviceId }
    });

    let device;
    if (existingDevice) {
      device = await db.mobileDevice.update({
        where: { deviceId },
        data: {
          userId: session.user.id,
          pushToken: deviceToken || existingDevice.pushToken,
          platform,
          appVersion: appVersion || existingDevice.appVersion,
          osVersion: osVersion || existingDevice.osVersion,
          lastSeen: new Date(),
          isActive: true
        }
      });
    } else {
      device = await db.mobileDevice.create({
        data: {
          userId: session.user.id,
          deviceId,
          pushToken: deviceToken,
          deviceName: deviceType || `${platform} Device`,
          platform,
          appVersion,
          osVersion,
          lastSeen: new Date()
        }
      });
    }

    return NextResponse.json({ device });
  } catch (error) {
    console.error('Error registering mobile device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update device settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, deviceToken, pushNotificationsEnabled, offlineDataEnabled, locationPermission, cameraPermission, notificationSettings } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const device = await db.mobileDevice.update({
      where: {
        deviceId,
        userId: session.user.id
      },
      data: {
        pushToken: deviceToken !== undefined ? deviceToken : undefined,
        lastSeen: new Date()
      }
    });

    return NextResponse.json({ device });
  } catch (error) {
    console.error('Error updating mobile device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
