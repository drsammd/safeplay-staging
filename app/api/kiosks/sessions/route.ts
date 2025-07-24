
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { KioskManager, KioskSession } from '../../../../utils/kiosk-manager';

// Mock kiosk sessions storage (in production, this would be in a database)
let kioskSessions: KioskSession[] = [
  {
    id: 'session-1',
    sessionId: 'SESSION_ABC123',
    kioskId: 'KIOSK_MAIN_001',
    sessionType: 'CHECK_IN',
    status: 'ACTIVE',
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    parentId: 'parent-1',
    childrenIds: ['child-1'],
    language: 'en',
    steps: [
      {
        id: 'welcome',
        name: 'WELCOME',
        title: 'Welcome to SafePlay',
        description: 'Welcome to our secure check-in system',
        type: 'WELCOME',
        required: true,
        completed: true,
      },
      {
        id: 'qr_scan',
        name: 'QR_SCAN',
        title: 'Scan QR Code',
        description: 'Please scan your child\'s QR code',
        type: 'QR_SCAN',
        required: true,
        completed: false,
      },
    ],
    currentStep: 'qr_scan',
    completedSteps: ['welcome'],
  },
  {
    id: 'session-2',
    sessionId: 'SESSION_DEF456',
    kioskId: 'KIOSK_EXIT_001',
    sessionType: 'CHECK_OUT',
    status: 'ACTIVE',
    startTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    parentId: 'parent-2',
    childrenIds: ['child-2', 'child-3'],
    language: 'en',
    steps: [
      {
        id: 'welcome',
        name: 'WELCOME',
        title: 'Welcome to SafePlay',
        description: 'Welcome to our secure check-out system',
        type: 'WELCOME',
        required: true,
        completed: true,
      },
      {
        id: 'qr_scan',
        name: 'QR_SCAN',
        title: 'Scan QR Code',
        description: 'Please scan your pickup authorization code',
        type: 'QR_SCAN',
        required: true,
        completed: true,
      },
      {
        id: 'confirmation',
        name: 'CONFIRMATION',
        title: 'Confirm Check-out',
        description: 'Please confirm the check-out details',
        type: 'CONFIRMATION',
        required: true,
        completed: false,
      },
    ],
    currentStep: 'confirmation',
    completedSteps: ['welcome', 'qr_scan'],
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
    const kioskId = searchParams.get('kioskId');
    const sessionType = searchParams.get('sessionType');

    let filteredSessions = kioskSessions;
    
    if (status) {
      filteredSessions = filteredSessions.filter(session => session.status === status);
    }
    
    if (kioskId) {
      filteredSessions = filteredSessions.filter(session => session.kioskId === kioskId);
    }
    
    if (sessionType) {
      filteredSessions = filteredSessions.filter(session => session.sessionType === sessionType);
    }

    // Calculate duration for active sessions
    filteredSessions = filteredSessions.map(session => ({
      ...session,
      duration: session.status === 'ACTIVE' 
        ? KioskManager.calculateSessionDuration(session)
        : session.duration,
    }));

    return NextResponse.json({
      success: true,
      kioskSessions: filteredSessions,
      total: filteredSessions.length,
    });
  } catch (error) {
    console.error('Error fetching kiosk sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kiosk sessions' },
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
      sessionType,
      parentId,
      childrenIds,
      language,
    } = body;

    // Validate required fields
    if (!kioskId || !sessionType) {
      return NextResponse.json(
        { error: 'Kiosk ID and session type are required' },
        { status: 400 }
      );
    }

    // Create new session
    const newSession = KioskManager.createSession(kioskId, sessionType, {
      parentId,
      childrenIds: childrenIds || [],
      language: language || 'en',
    });

    // Add kiosk information
    newSession.kioskId = kioskId;

    // Add to storage
    kioskSessions.push(newSession);

    console.log('Kiosk session created:', {
      sessionId: newSession.sessionId,
      kioskId,
      sessionType,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      session: newSession,
      message: 'Kiosk session created successfully',
    });
  } catch (error) {
    console.error('Error creating kiosk session:', error);
    return NextResponse.json(
      { error: 'Failed to create kiosk session' },
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
    const { sessionId, stepId, stepUpdates, status } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find session
    const sessionIndex = kioskSessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    let updatedSession = kioskSessions[sessionIndex];

    // Update session status
    if (status) {
      updatedSession.status = status;
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        updatedSession.endTime = new Date().toISOString();
        updatedSession.duration = KioskManager.calculateSessionDuration(updatedSession);
      }
    }

    // Update specific step
    if (stepId && stepUpdates) {
      updatedSession = KioskManager.updateSessionStep(updatedSession, stepId, stepUpdates);
    }

    kioskSessions[sessionIndex] = updatedSession;

    console.log('Kiosk session updated:', {
      sessionId,
      updates: { stepId, stepUpdates, status },
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Kiosk session updated successfully',
    });
  } catch (error) {
    console.error('Error updating kiosk session:', error);
    return NextResponse.json(
      { error: 'Failed to update kiosk session' },
      { status: 500 }
    );
  }
}
