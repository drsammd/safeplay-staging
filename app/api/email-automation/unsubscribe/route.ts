
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const userId = searchParams.get('user');

    if (!token) {
      return NextResponse.json({ error: 'Missing unsubscribe token' }, { status: 400 });
    }

    // Find user by unsubscribe token
    const preferences = await prisma.emailPreferences.findUnique({
      where: { unsubscribeToken: token },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!preferences) {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 404 });
    }

    // Validate user ID if provided (extra security)
    if (userId && preferences.userId !== userId) {
      return NextResponse.json({ error: 'Invalid unsubscribe request' }, { status: 400 });
    }

    // Return unsubscribe page data (this could render an HTML page in a real app)
    return NextResponse.json({
      user: preferences.user,
      preferences: {
        emailEnabled: preferences.emailEnabled,
        marketingEmails: preferences.marketingEmails,
        alertEmails: preferences.alertEmails,
        featureUpdates: preferences.featureUpdates,
        eventReminders: preferences.eventReminders,
        weeklyDigest: preferences.weeklyDigest,
        monthlyReport: preferences.monthlyReport
      },
      token
    });

  } catch (error) {
    console.error('Error handling unsubscribe:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, unsubscribeType, confirmGlobal } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing unsubscribe token' }, { status: 400 });
    }

    const preferences = await prisma.emailPreferences.findUnique({
      where: { unsubscribeToken: token },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!preferences) {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 404 });
    }

    let updateData: any = {};

    switch (unsubscribeType) {
      case 'marketing':
        updateData.marketingEmails = false;
        break;
      case 'alerts':
        updateData.alertEmails = false;
        break;
      case 'features':
        updateData.featureUpdates = false;
        break;
      case 'events':
        updateData.eventReminders = false;
        break;
      case 'digest':
        updateData.weeklyDigest = false;
        updateData.monthlyReport = false;
        break;
      case 'all':
        if (confirmGlobal) {
          updateData = {
            emailEnabled: false,
            marketingEmails: false,
            alertEmails: false,
            featureUpdates: false,
            eventReminders: false,
            weeklyDigest: false,
            monthlyReport: false,
            globalUnsubscribedAt: new Date()
          };
        } else {
          return NextResponse.json(
            { error: 'Global unsubscribe requires confirmation' }, 
            { status: 400 }
          );
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid unsubscribe type' }, { status: 400 });
    }

    const updatedPreferences = await prisma.emailPreferences.update({
      where: { unsubscribeToken: token },
      data: updateData
    });

    return NextResponse.json({
      message: 'Unsubscribe preferences updated successfully',
      user: preferences.user,
      unsubscribeType,
      globalUnsubscribe: unsubscribeType === 'all'
    });

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' }, 
      { status: 500 }
    );
  }
}
