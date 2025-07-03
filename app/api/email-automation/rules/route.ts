
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationEngine } from '@/lib/services/email-automation-engine';
import { prisma } from '@/lib/db';
import { EmailTrigger, EmailPriority, UserSegmentType } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['COMPANY_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const trigger = searchParams.get('trigger') as EmailTrigger;
    const isActive = searchParams.get('isActive') === 'true' ? true : 
                    searchParams.get('isActive') === 'false' ? false : undefined;
    const search = searchParams.get('search') || undefined;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (trigger) where.trigger = trigger;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [rules, total] = await Promise.all([
      prisma.emailAutomationRule.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: {
            select: { id: true, name: true, subject: true }
          },
          emailSegment: {
            select: { id: true, name: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { executions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailAutomationRule.count({ where })
    ]);

    return NextResponse.json({
      rules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      trigger,
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

    // Validate required fields
    if (!name || !trigger || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate template exists
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' }, 
        { status: 400 }
      );
    }

    const rule = await emailAutomationEngine.createAutomationRule({
      name,
      description,
      trigger,
      triggerConditions: triggerConditions || {},
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
      stopConditions,
      createdBy: session.user.id
    });

    // Fetch the created rule with relations
    const createdRule = await prisma.emailAutomationRule.findUnique({
      where: { id: rule.id },
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

    return NextResponse.json(createdRule, { status: 201 });

  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' }, 
      { status: 500 }
    );
  }
}
