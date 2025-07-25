
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CampaignStatus } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['SUPER_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
      include: {
        segment: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        approver: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' }, 
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
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      subject,
      content,
      emailSegmentId,
      segmentFilters,
      scheduledAt,
      isRecurring,
      recurrencePattern,
      priority,
      maxRecipients,
      rateLimitPerHour
    } = body;

    // Check if campaign exists and can be modified
    const existingCampaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (existingCampaign.status === CampaignStatus.SENDING) {
      return NextResponse.json(
        { error: 'Cannot modify running campaign' }, 
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id: params.id },
      data: {
        name,
        subject,
        content,
        emailSegmentId,
        segmentFilters,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isRecurring,
        recurrencePattern,
        priority,
        maxRecipients,
        rateLimitPerHour
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(campaign);

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' }, 
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
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if campaign can be deleted
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
      include: {}
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === CampaignStatus.SENDING) {
      return NextResponse.json(
        { error: 'Cannot delete running campaign' }, 
        { status: 400 }
      );
    }

    // Mark as cancelled instead of deleting (safer approach)
    await prisma.emailCampaign.update({
      where: { id: params.id },
      data: { 
        status: CampaignStatus.CANCELLED
      }
    });

    return NextResponse.json({ message: 'Campaign deleted successfully' });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' }, 
      { status: 500 }
    );
  }
}
