
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../lib/db';
import { ConsentPreference } from '@prisma/client';

// GET /api/messaging/privacy/settings - Get privacy settings
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let privacySettings = await prisma.privacySettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if none exist
    if (!privacySettings) {
      privacySettings = await prisma.privacySettings.create({
        data: {
          userId: session.user.id,
          mediaShareConsent: ConsentPreference.ASK_EACH_TIME,
          friendConnectionsVisible: true,
          showInCommunitySearch: true,
          allowDirectMessages: true,
          shareLocationData: true,
          profileVisibility: 'friends',
          anonymousReporting: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        mediaShareConsent: privacySettings.mediaShareConsent,
        friendConnectionsVisible: privacySettings.friendConnectionsVisible,
        showInCommunitySearch: privacySettings.showInCommunitySearch,
        allowDirectMessages: privacySettings.allowDirectMessages,
        shareLocationData: privacySettings.shareLocationData,
        profileVisibility: privacySettings.profileVisibility,
        communicationPrefs: privacySettings.communicationPrefs,
        dataRetentionDays: privacySettings.dataRetentionDays,
        anonymousReporting: privacySettings.anonymousReporting,
        updatedAt: privacySettings.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/messaging/privacy/settings - Update privacy settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mediaShareConsent,
      friendConnectionsVisible,
      showInCommunitySearch,
      allowDirectMessages,
      shareLocationData,
      profileVisibility,
      communicationPrefs,
      dataRetentionDays,
      anonymousReporting,
    } = body;

    // Validate mediaShareConsent if provided
    if (mediaShareConsent && !Object.values(ConsentPreference).includes(mediaShareConsent)) {
      return NextResponse.json(
        { error: 'Invalid media share consent preference' },
        { status: 400 }
      );
    }

    // Validate profileVisibility if provided
    if (profileVisibility && !['public', 'friends', 'private'].includes(profileVisibility)) {
      return NextResponse.json(
        { error: 'Invalid profile visibility setting' },
        { status: 400 }
      );
    }

    // Update settings
    const updatedSettings = await prisma.privacySettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        mediaShareConsent: mediaShareConsent || ConsentPreference.ASK_EACH_TIME,
        friendConnectionsVisible: friendConnectionsVisible !== undefined ? friendConnectionsVisible : true,
        showInCommunitySearch: showInCommunitySearch !== undefined ? showInCommunitySearch : true,
        allowDirectMessages: allowDirectMessages !== undefined ? allowDirectMessages : true,
        shareLocationData: shareLocationData !== undefined ? shareLocationData : true,
        profileVisibility: profileVisibility || 'friends',
        communicationPrefs,
        dataRetentionDays,
        anonymousReporting: anonymousReporting !== undefined ? anonymousReporting : true,
      },
      update: {
        ...(mediaShareConsent && { mediaShareConsent }),
        ...(friendConnectionsVisible !== undefined && { friendConnectionsVisible }),
        ...(showInCommunitySearch !== undefined && { showInCommunitySearch }),
        ...(allowDirectMessages !== undefined && { allowDirectMessages }),
        ...(shareLocationData !== undefined && { shareLocationData }),
        ...(profileVisibility && { profileVisibility }),
        ...(communicationPrefs !== undefined && { communicationPrefs }),
        ...(dataRetentionDays !== undefined && { dataRetentionDays }),
        ...(anonymousReporting !== undefined && { anonymousReporting }),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        mediaShareConsent: updatedSettings.mediaShareConsent,
        friendConnectionsVisible: updatedSettings.friendConnectionsVisible,
        showInCommunitySearch: updatedSettings.showInCommunitySearch,
        allowDirectMessages: updatedSettings.allowDirectMessages,
        shareLocationData: updatedSettings.shareLocationData,
        profileVisibility: updatedSettings.profileVisibility,
        communicationPrefs: updatedSettings.communicationPrefs,
        dataRetentionDays: updatedSettings.dataRetentionDays,
        anonymousReporting: updatedSettings.anonymousReporting,
        updatedAt: updatedSettings.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
