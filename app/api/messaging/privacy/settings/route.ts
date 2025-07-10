
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../../lib/db';

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
          allowMediaSharing: true,
          allowFriendRequests: true,
          allowLocationSharing: false,
          allowActivitySharing: true,
          allowAnalytics: true,
          allowMarketing: false,
          allowThirdPartySharing: false,
          profileVisibility: 'FRIENDS',
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        allowMediaSharing: privacySettings.allowMediaSharing,
        allowFriendRequests: privacySettings.allowFriendRequests,
        allowLocationSharing: privacySettings.allowLocationSharing,
        allowActivitySharing: privacySettings.allowActivitySharing,
        allowAnalytics: privacySettings.allowAnalytics,
        profileVisibility: privacySettings.profileVisibility,
        allowMarketing: privacySettings.allowMarketing,
        dataRetentionPeriod: privacySettings.dataRetentionPeriod,
        allowThirdPartySharing: privacySettings.allowThirdPartySharing,
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
      allowMediaSharing,
      allowFriendRequests,
      allowLocationSharing,
      allowActivitySharing,
      allowAnalytics,
      allowMarketing,
      allowThirdPartySharing,
      profileVisibility,
      dataRetentionPeriod,
    } = body;

    // Validate profileVisibility if provided
    if (profileVisibility && !['PUBLIC', 'FRIENDS', 'PRIVATE'].includes(profileVisibility)) {
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
        allowMediaSharing: allowMediaSharing !== undefined ? allowMediaSharing : true,
        allowFriendRequests: allowFriendRequests !== undefined ? allowFriendRequests : true,
        allowLocationSharing: allowLocationSharing !== undefined ? allowLocationSharing : false,
        allowActivitySharing: allowActivitySharing !== undefined ? allowActivitySharing : true,
        allowAnalytics: allowAnalytics !== undefined ? allowAnalytics : true,
        allowMarketing: allowMarketing !== undefined ? allowMarketing : false,
        allowThirdPartySharing: allowThirdPartySharing !== undefined ? allowThirdPartySharing : false,
        profileVisibility: profileVisibility || 'FRIENDS',
        dataRetentionPeriod,
      },
      update: {
        ...(allowMediaSharing !== undefined && { allowMediaSharing }),
        ...(allowFriendRequests !== undefined && { allowFriendRequests }),
        ...(allowLocationSharing !== undefined && { allowLocationSharing }),
        ...(allowActivitySharing !== undefined && { allowActivitySharing }),
        ...(allowAnalytics !== undefined && { allowAnalytics }),
        ...(allowMarketing !== undefined && { allowMarketing }),
        ...(allowThirdPartySharing !== undefined && { allowThirdPartySharing }),
        ...(profileVisibility && { profileVisibility }),
        ...(dataRetentionPeriod !== undefined && { dataRetentionPeriod }),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        allowMediaSharing: updatedSettings.allowMediaSharing,
        allowFriendRequests: updatedSettings.allowFriendRequests,
        allowLocationSharing: updatedSettings.allowLocationSharing,
        allowActivitySharing: updatedSettings.allowActivitySharing,
        allowAnalytics: updatedSettings.allowAnalytics,
        profileVisibility: updatedSettings.profileVisibility,
        allowMarketing: updatedSettings.allowMarketing,
        dataRetentionPeriod: updatedSettings.dataRetentionPeriod,
        allowThirdPartySharing: updatedSettings.allowThirdPartySharing,
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
