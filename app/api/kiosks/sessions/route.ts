
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { KioskSessionType, KioskSessionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/kiosks/sessions - Get kiosk sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kioskId = searchParams.get('kioskId');
    const sessionType = searchParams.get('sessionType') as KioskSessionType | null;
    const status = searchParams.get('status') as KioskSessionStatus | null;
    const parentId = searchParams.get('parentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      where.parentId = session.user.id;
    }

    if (kioskId) where.kioskId = kioskId;
    if (sessionType) where.sessionType = sessionType;
    if (status) where.status = status;
    if (parentId && session.user.role !== 'PARENT') where.parentId = parentId;

    const kioskSessions = await prisma.kioskSession.findMany({
      where,
      include: {
        kiosk: {
          select: {
            id: true,
            name: true,
            location: true,
            kioskType: true,
            venue: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
        checkInEvents: {
          take: 10,
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            eventType: true,
            timestamp: true,
            child: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      kioskSessions,
      pagination: {
        limit,
        offset,
        total: await prisma.kioskSession.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching kiosk sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kiosk sessions' },
      { status: 500 }
    );
  }
}

// POST /api/kiosks/sessions - Start new kiosk session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      kioskId,
      sessionType,
      childrenIds = [],
      language = 'en',
      accessibilityMode = false,
    } = body;

    if (!kioskId || !sessionType) {
      return NextResponse.json(
        { error: 'Missing required fields: kioskId, sessionType' },
        { status: 400 }
      );
    }

    // Verify kiosk exists and is online
    const kiosk = await prisma.checkInKiosk.findFirst({
      where: { kioskId },
    });

    if (!kiosk) {
      return NextResponse.json(
        { error: 'Kiosk not found' },
        { status: 404 }
      );
    }

    if (kiosk.status !== 'ONLINE' && kiosk.status !== 'IDLE') {
      return NextResponse.json(
        { error: 'Kiosk is not available' },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = `SES${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const kioskSession = await prisma.kioskSession.create({
      data: {
        kioskId: kiosk.id,
        sessionId,
        parentId: session.user.role === 'PARENT' ? session.user.id : null,
        childrenIds,
        sessionType,
        language,
        accessibilityMode,
        completedSteps: [],
        currentStep: 'WELCOME',
      },
      include: {
        kiosk: {
          select: {
            name: true,
            location: true,
            capabilities: true,
          },
        },
      },
    });

    // Update kiosk status to busy
    await prisma.checkInKiosk.update({
      where: { id: kiosk.id },
      data: { status: 'BUSY' },
    });

    return NextResponse.json({
      success: true,
      kioskSession: {
        id: kioskSession.id,
        sessionId: kioskSession.sessionId,
        sessionType: kioskSession.sessionType,
        currentStep: kioskSession.currentStep,
        kiosk: kioskSession.kiosk,
      },
      message: 'Kiosk session started successfully',
    });
  } catch (error) {
    console.error('Error starting kiosk session:', error);
    return NextResponse.json(
      { error: 'Failed to start kiosk session' },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosks/sessions - Update kiosk session
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      currentStep,
      completedSteps,
      status,
      errorEncountered,
      errorDetails,
      userSatisfaction,
      feedback,
      dataCollected,
      consentGiven,
      assistanceRequired,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (currentStep) updateData.currentStep = currentStep;
    if (completedSteps) updateData.completedSteps = completedSteps;
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED' || status === 'ABANDONED') {
        updateData.endTime = new Date();
        updateData.duration = Math.floor((Date.now() - new Date().getTime()) / 1000);
      }
    }
    if (errorEncountered !== undefined) updateData.errorEncountered = errorEncountered;
    if (errorDetails) updateData.errorDetails = errorDetails;
    if (userSatisfaction !== undefined) updateData.userSatisfaction = userSatisfaction;
    if (feedback) updateData.feedback = feedback;
    if (dataCollected) updateData.dataCollected = dataCollected;
    if (consentGiven) updateData.consentGiven = consentGiven;
    if (assistanceRequired !== undefined) updateData.assistanceRequired = assistanceRequired;

    // Increment interaction count
    updateData.totalInteractions = { increment: 1 };

    const kioskSession = await prisma.kioskSession.update({
      where: { sessionId },
      data: updateData,
      include: {
        kiosk: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If session ended, update kiosk status back to idle
    if (status === 'COMPLETED' || status === 'ABANDONED') {
      await prisma.checkInKiosk.update({
        where: { id: kioskSession.kiosk.id },
        data: { 
          status: 'IDLE',
          totalTransactions: { increment: 1 },
          dailyTransactions: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      kioskSession,
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
