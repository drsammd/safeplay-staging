
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['COMPANY_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rule = await prisma.emailAutomationRule.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        emailSegment: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { executions: true }
        }
      }
    });
    
    if (!rule) {
      return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 });
    }

    return NextResponse.json(rule);

  } catch (error) {
    console.error('Error fetching automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rule' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      triggerConditions,
      templateId,
      delay,
      isActive,
      maxSends,
      sendOnWeekends,
      sendTimeStart,
      sendTimeEnd,
      timezone,
      userSegment,
      emailSegmentId,
      segmentFilters,
      priority,
      stopConditions
    } = body;

    // Validate template if provided
    if (templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
      });
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' }, 
          { status: 400 }
        );
      }
    }

    const rule = await prisma.emailAutomationRule.update({
      where: { id: params.id },
      data: {
        name,
        description,
        triggerConditions,
        templateId,
        delay,
        isActive,
        maxSends,
        sendOnWeekends,
        sendTimeStart,
        sendTimeEnd,
        timezone,
        userSegment,
        emailSegmentId,
        segmentFilters,
        priority,
        stopConditions
      },
      include: {
        template: {
          select: { id: true, name: true, subject: true }
        },
        emailSegment: {
          select: { id: true, name: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(rule);

  } catch (error) {
    console.error('Error updating automation rule:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update automation rule' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if rule has executions
    const executionCount = await prisma.emailAutomationExecution.count({
      where: { ruleId: params.id }
    });

    if (executionCount > 0) {
      // Deactivate instead of deleting
      await prisma.emailAutomationRule.update({
        where: { id: params.id },
        data: { isActive: false }
      });
      
      return NextResponse.json({ 
        message: 'Automation rule deactivated (has execution history)' 
      });
    } else {
      // Safe to delete
      await prisma.emailAutomationRule.delete({
        where: { id: params.id }
      });
      
      return NextResponse.json({ message: 'Automation rule deleted successfully' });
    }

  } catch (error) {
    console.error('Error deleting automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete automation rule' }, 
      { status: 500 }
    );
  }
}
