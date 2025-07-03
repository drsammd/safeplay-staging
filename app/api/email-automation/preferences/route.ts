
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmailFrequency } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create email preferences for the user
    let preferences = await prisma.emailPreferences.findUnique({
      where: { userId: session.user.id }
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.emailPreferences.create({
        data: {
          userId: session.user.id,
          emailEnabled: true,
          marketingEmails: true,
          securityEmails: true,
          alertEmails: true,
          welcomeSequence: true,
          featureUpdates: true,
          eventReminders: true,
          weeklyDigest: false,
          monthlyReport: false,
          frequency: EmailFrequency.IMMEDIATE,
          timeZone: 'UTC',
          language: 'en'
        }
      });
    }

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      emailEnabled,
      marketingEmails,
      alertEmails,
      welcomeSequence,
      featureUpdates,
      eventReminders,
      weeklyDigest,
      monthlyReport,
      frequency,
      timeZone,
      preferredTime,
      language
    } = body;

    // Note: securityEmails cannot be disabled for safety reasons

    const preferences = await prisma.emailPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        emailEnabled,
        marketingEmails,
        alertEmails,
        welcomeSequence,
        featureUpdates,
        eventReminders,
        weeklyDigest,
        monthlyReport,
        frequency,
        timeZone,
        preferredTime,
        language,
        lastUpdated: new Date()
      },
      create: {
        userId: session.user.id,
        emailEnabled: emailEnabled !== false,
        marketingEmails: marketingEmails !== false,
        securityEmails: true,
        alertEmails: alertEmails !== false,
        welcomeSequence: welcomeSequence !== false,
        featureUpdates: featureUpdates !== false,
        eventReminders: eventReminders !== false,
        weeklyDigest: weeklyDigest || false,
        monthlyReport: monthlyReport || false,
        frequency: frequency || EmailFrequency.IMMEDIATE,
        timeZone: timeZone || 'UTC',
        preferredTime,
        language: language || 'en'
      }
    });

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update email preferences' }, 
      { status: 500 }
    );
  }
}
