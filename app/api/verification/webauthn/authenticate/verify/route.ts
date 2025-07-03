
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { webAuthnService } from '@/lib/services/webauthn-service';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { response: authResponse } = body;

    if (!authResponse) {
      return NextResponse.json(
        { error: 'Authentication response is required' },
        { status: 400 }
      );
    }

    // Verify the authentication response
    const result = await webAuthnService.verifyAuthentication(
      session.user.id,
      authResponse
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication verification failed' },
        { status: 400 }
      );
    }

    // Update user's two-factor status if this was for setup
    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose');
    
    if (purpose === 'setup') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true }
      });
    }

    return NextResponse.json({
      success: true,
      credentialId: result.credentialId,
      // Fixed: removed deviceName as it doesn't exist in WebAuthnAuthenticationResult
      message: 'WebAuthn authentication verified successfully'
    });

  } catch (error) {
    console.error('WebAuthn authentication verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
