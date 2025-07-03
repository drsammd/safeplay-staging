

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pushNotificationService } from '@/lib/services/push-notification-service';
import { PushNotificationPlatform } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deviceToken, platform, deviceInfo } = await request.json();

    if (!deviceToken || !platform) {
      return NextResponse.json({ 
        error: 'Device token and platform are required' 
      }, { status: 400 });
    }

    const result = await pushNotificationService.registerDevice(
      session.user.id,
      deviceToken,
      platform as PushNotificationPlatform,
      deviceInfo
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Register push device API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

