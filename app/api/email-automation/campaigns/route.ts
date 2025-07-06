
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationService } from '@/lib/services/email-automation-service';
import { prisma } from '@/lib/db';
import { EmailCampaignType, EmailCampaignStatus, EmailPriority, UserSegmentType } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['SUPER_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as EmailCampaignStatus;
    const campaignType = searchParams.get('campaignType') as EmailCampaignType;
    const search = searchParams.get('search') || undefined;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (campaignType) where.campaignType = campaignType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: {
            select: { id: true, name: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          },
          approver: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { emailLogs: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailCampaign.count({ where })
    ]);

    return NextResponse.json({
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      subject,
      templateId,
      customContent,
      campaignType,
      targetSegment,
      emailSegmentId,
      segmentFilters,
      scheduledAt,
      isRecurring,
      recurrencePattern,
      priority,
      trackOpens,
      trackClicks,
      sendImmediately,
      maxRecipients,
      rateLimitPerHour
    } = body;

    // Validate required fields
    if (!name || !campaignType || (!templateId && !customContent)) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate template exists if templateId provided
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

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        description,
        subject,
        templateId,
        customContent,
        campaignType,
        status: EmailCampaignStatus.DRAFT,
        targetSegment,
        emailSegmentId,
        segmentFilters,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isRecurring: isRecurring || false,
        recurrencePattern,
        priority: priority || EmailPriority.NORMAL,
        trackOpens: trackOpens !== false,
        trackClicks: trackClicks !== false,
        sendImmediately: sendImmediately || false,
        maxRecipients,
        rateLimitPerHour: rateLimitPerHour || 1000,
        createdBy: session.user.id
      },
      include: {
        template: true,
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(campaign, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' }, 
      { status: 500 }
    );
  }
}
