
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WorkflowType, WorkflowTrigger, WorkflowPriority } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/workflows - Get workflow automations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow venue admin or company admin to access workflows
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const workflowType = searchParams.get('workflowType') as WorkflowType | null;
    const isActive = searchParams.get('isActive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'VENUE_ADMIN') {
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
    }

    if (workflowType) where.workflowType = workflowType;
    if (isActive !== undefined) where.isActive = isActive;

    const workflows = await prisma.workflowAutomation.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        executions: {
          take: 5,
          orderBy: { startTime: 'desc' },
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            duration: true,
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      workflows,
      pagination: {
        limit,
        offset,
        total: await prisma.workflowAutomation.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create workflow automation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow venue admin or company admin to create workflows
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Only venue administrators can create workflows' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      venueId,
      workflowType,
      triggerEvent,
      triggerConditions,
      actions,
      priority = 'NORMAL',
      timeout = 300,
      retryAttempts = 3,
      businessRules,
      integrationSettings,
      testMode = false,
    } = body;

    // Validate required fields
    if (!name || !workflowType || !triggerEvent || !triggerConditions || !actions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, workflowType, triggerEvent, triggerConditions, actions' },
        { status: 400 }
      );
    }

    // Verify venue access for venue admin
    if (venueId && session.user.role === 'VENUE_ADMIN') {
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

    const workflow = await prisma.workflowAutomation.create({
      data: {
        name,
        description,
        venueId,
        workflowType,
        triggerEvent,
        triggerConditions,
        actions,
        priority,
        timeout,
        retryAttempts,
        businessRules,
        integrationSettings,
        testMode,
        createdBy: session.user.id,
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
      workflow,
      message: 'Workflow automation created successfully',
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow automation' },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows - Update workflow automation
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workflowId,
      isActive,
      triggerConditions,
      actions,
      priority,
      timeout,
      retryAttempts,
      businessRules,
      testMode,
    } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (isActive !== undefined) updateData.isActive = isActive;
    if (triggerConditions) updateData.triggerConditions = triggerConditions;
    if (actions) updateData.actions = actions;
    if (priority) updateData.priority = priority;
    if (timeout !== undefined) updateData.timeout = timeout;
    if (retryAttempts !== undefined) updateData.retryAttempts = retryAttempts;
    if (businessRules) updateData.businessRules = businessRules;
    if (testMode !== undefined) updateData.testMode = testMode;

    const workflow = await prisma.workflowAutomation.update({
      where: { id: workflowId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow automation updated successfully',
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow automation' },
      { status: 500 }
    );
  }
}
