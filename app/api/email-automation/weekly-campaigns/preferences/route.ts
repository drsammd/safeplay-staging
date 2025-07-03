
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailAutomationEngine } from '@/lib/services/email-automation-engine';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Only admins can check other users' preferences
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.emailPreferences.findUnique({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      preferences: {
        weeklyTipsEnabled: preferences?.weeklyDigest ?? true,
        emailEnabled: preferences?.emailEnabled ?? true,
        marketingEnabled: preferences?.marketingEmails ?? true
      }
    });

  } catch (error) {
    console.error('Error fetching weekly campaign preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled, userId } = await request.json();
    const targetUserId = userId || session.user.id;

    // Only admins can update other users' preferences
    if (targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await emailAutomationEngine.updateWeeklyCampaignPreferences(
      targetUserId,
      enabled
    );

    return NextResponse.json({
      success: true,
      message: `Weekly tips ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Error updating weekly campaign preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
