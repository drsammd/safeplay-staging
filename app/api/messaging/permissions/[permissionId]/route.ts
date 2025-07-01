
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { permissionConsentService } from '../../../../../lib/services/permission-consent-service';

// PUT /api/messaging/permissions/[permissionId] - Respond to permission request
export async function PUT(
  request: NextRequest,
  { params }: { params: { permissionId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { permissionId } = params;
    const body = await request.json();
    const { granted, reason, conditions, expiresAt } = body;

    if (typeof granted !== 'boolean') {
      return NextResponse.json(
        { error: 'granted field is required and must be boolean' },
        { status: 400 }
      );
    }

    const result = await permissionConsentService.processConsentDecision(
      permissionId,
      session.user.id,
      {
        granted,
        reason,
        conditions,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing consent decision:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messaging/permissions/[permissionId] - Revoke permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { permissionId: string } }
) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { permissionId } = params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    const result = await permissionConsentService.revokePermission(
      permissionId,
      session.user.id,
      reason || undefined
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error revoking permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
