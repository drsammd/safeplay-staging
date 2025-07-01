
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { permissionConsentService } from '../../../../lib/services/permission-consent-service';

// GET /api/messaging/permissions - Get pending permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingPermissions = await permissionConsentService.getPendingPermissions(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      permissions: pendingPermissions,
    });
  } catch (error: any) {
    console.error('Error getting pending permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/permissions - Request new permission
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mediaId, childId, parentId, requestType, context, expiresIn } = body;

    if (!mediaId || !childId || !parentId || !requestType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await permissionConsentService.requestMediaPermission({
      mediaId,
      childId,
      parentId,
      requestType,
      context,
      expiresIn,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error requesting permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
