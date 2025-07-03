

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webAuthnService } from '@/lib/services/webauthn-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await webAuthnService.getUserCredentials(session.user.id);

    return NextResponse.json({
      credentials
    });

  } catch (error) {
    console.error('Get WebAuthn credentials API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credentialId } = await request.json();
    if (!credentialId) {
      return NextResponse.json({ 
        error: 'Credential ID is required' 
      }, { status: 400 });
    }

    const result = await webAuthnService.removeCredential(
      session.user.id,
      credentialId
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
    console.error('Remove WebAuthn credential API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

