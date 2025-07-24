
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { KioskManager, KioskConfig } from '../../../utils/kiosk-manager';

// Mock kiosks storage (in production, this would be in a database)
let kiosks: any[] = [
  {
    id: 'kiosk-1',
    kioskId: 'KIOSK_MAIN_001',
    name: 'Main Entrance Kiosk',
    location: 'Main Entrance',
    kioskType: 'CHECK_IN_TERMINAL',
    status: 'ONLINE',
    lastHeartbeat: new Date().toISOString(),
    ipAddress: '192.168.1.100',
    uptimePercentage: 98.5,
    totalTransactions: 1247,
    dailyTransactions: 45,
    errorCount: 3,
    performanceScore: 94,
    cpuUsage: 35.2,
    memoryUsed: 2.8,
    diskUsage: 45.6,
    batteryLevel: 85,
    temperatureStatus: 'NORMAL',
    venue: {
      name: 'Demo Venue',
      address: '123 Demo Street',
    },
    stats: {
      totalEvents: 1247,
      todayEvents: 45,
      activeSessions: 2,
    },
    capabilities: ['QR_SCANNING', 'PHOTO_CAPTURE', 'TOUCHSCREEN', 'PRINTER'],
  },
  {
    id: 'kiosk-2',
    kioskId: 'KIOSK_EXIT_001',
    name: 'Exit Kiosk',
    location: 'Main Exit',
    kioskType: 'CHECK_OUT_TERMINAL',
    status: 'IDLE',
    lastHeartbeat: new Date().toISOString(),
    ipAddress: '192.168.1.101',
    uptimePercentage: 99.2,
    totalTransactions: 892,
    dailyTransactions: 32,
    errorCount: 1,
    performanceScore: 96,
    cpuUsage: 22.1,
    memoryUsed: 1.9,
    diskUsage: 38.2,
    temperatureStatus: 'NORMAL',
    venue: {
      name: 'Demo Venue',
      address: '123 Demo Street',
    },
    stats: {
      totalEvents: 892,
      todayEvents: 32,
      activeSessions: 0,
    },
    capabilities: ['QR_SCANNING', 'TOUCHSCREEN', 'PRINTER'],
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const kioskType = searchParams.get('type');

    let filteredKiosks = kiosks;
    
    if (status) {
      filteredKiosks = filteredKiosks.filter(kiosk => kiosk.status === status);
    }
    
    if (kioskType) {
      filteredKiosks = filteredKiosks.filter(kiosk => kiosk.kioskType === kioskType);
    }

    return NextResponse.json({
      success: true,
      kiosks: filteredKiosks,
      total: filteredKiosks.length,
    });
  } catch (error) {
    console.error('Error fetching kiosks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kiosks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      kioskId,
      name,
      location,
      kioskType,
      venueId,
      ipAddress,
      macAddress,
      capabilities,
    } = body;

    // Validate required fields
    if (!kioskId || !name || !location || !kioskType || !venueId) {
      return NextResponse.json(
        { error: 'Kiosk ID, name, location, type, and venue ID are required' },
        { status: 400 }
      );
    }

    // Check if kiosk ID already exists
    if (kiosks.find(k => k.kioskId === kioskId)) {
      return NextResponse.json(
        { error: 'Kiosk ID already exists' },
        { status: 400 }
      );
    }

    // Create kiosk configuration
    const kioskConfig = KioskManager.createKioskConfig({
      kioskId,
      name,
      location,
      kioskType,
      venueId,
      ipAddress,
      capabilities: capabilities || ['QR_SCANNING', 'TOUCHSCREEN', 'PHOTO_CAPTURE'],
    });

    // Validate configuration
    const validation = KioskManager.validateKioskConfig(kioskConfig);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid kiosk configuration', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate initial metrics
    const metrics = KioskManager.generateMetrics(kioskId);

    // Create kiosk record
    const kioskRecord = {
      id: kioskConfig.id,
      kioskId: kioskConfig.kioskId,
      name: kioskConfig.name,
      location: kioskConfig.location,
      kioskType: kioskConfig.kioskType,
      status: 'OFFLINE', // New kiosks start offline
      lastHeartbeat: null,
      ipAddress: kioskConfig.ipAddress,
      macAddress,
      uptimePercentage: 0,
      totalTransactions: 0,
      dailyTransactions: 0,
      errorCount: 0,
      performanceScore: 0,
      cpuUsage: 0,
      memoryUsed: 0,
      diskUsage: 0,
      batteryLevel: null,
      temperatureStatus: 'UNKNOWN',
      venue: {
        name: 'Demo Venue',
        address: '123 Demo Street',
      },
      stats: {
        totalEvents: 0,
        todayEvents: 0,
        activeSessions: 0,
      },
      capabilities: kioskConfig.capabilities,
      settings: kioskConfig.settings,
      createdAt: new Date().toISOString(),
    };

    // Add to storage
    kiosks.push(kioskRecord);

    console.log('Kiosk created:', {
      id: kioskConfig.id,
      kioskId,
      name,
      location,
      type: kioskType,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      kiosk: kioskRecord,
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { kioskId, status, systemMetrics, settings } = body;

    if (!kioskId) {
      return NextResponse.json(
        { error: 'Kiosk ID is required' },
        { status: 400 }
      );
    }

    // Find kiosk
    const kioskIndex = kiosks.findIndex(k => k.kioskId === kioskId);
    if (kioskIndex === -1) {
      return NextResponse.json(
        { error: 'Kiosk not found' },
        { status: 404 }
      );
    }

    const kiosk = kiosks[kioskIndex];

    // Update status
    if (status) {
      kiosk.status = status;
      kiosk.lastHeartbeat = new Date().toISOString();
    }

    // Update system metrics
    if (systemMetrics) {
      kiosk.cpuUsage = systemMetrics.cpuUsage || kiosk.cpuUsage;
      kiosk.memoryUsed = systemMetrics.memoryUsed || kiosk.memoryUsed;
      kiosk.diskUsage = systemMetrics.diskUsage || kiosk.diskUsage;
      kiosk.batteryLevel = systemMetrics.batteryLevel || kiosk.batteryLevel;
      kiosk.temperatureStatus = systemMetrics.temperatureStatus || kiosk.temperatureStatus;
      
      // Update performance score based on metrics
      const healthScore = KioskManager.isKioskHealthy({
        kioskId,
        timestamp: new Date().toISOString(),
        systemMetrics: {
          cpuUsage: kiosk.cpuUsage,
          memoryUsed: kiosk.memoryUsed,
          diskUsage: kiosk.diskUsage,
          temperature: 45,
          networkStatus: 'connected',
        },
        performanceMetrics: {
          responseTime: 200,
          errorRate: 2,
          uptime: kiosk.uptimePercentage,
          sessionsCompleted: kiosk.totalTransactions,
          sessionsErrored: kiosk.errorCount,
        },
        usageMetrics: {
          totalSessions: kiosk.totalTransactions,
          dailySessions: kiosk.dailyTransactions,
          averageSessionDuration: 180,
          peakUsageHours: [],
          mostUsedFeatures: [],
        },
      }) ? 95 : 75;
      
      kiosk.performanceScore = healthScore;
    }

    // Update settings
    if (settings) {
      kiosk.settings = { ...kiosk.settings, ...settings };
    }

    kiosks[kioskIndex] = kiosk;

    console.log('Kiosk updated:', {
      kioskId,
      updates: { status, systemMetrics: !!systemMetrics, settings: !!settings },
      userId: session.user.id,
      timestamp: new Date().toISOString(),
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
