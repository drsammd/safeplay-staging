

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailVerificationService } from '@/lib/services/email-verification-service';
import { EmailVerificationPurpose } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, purpose = 'TWO_FACTOR' } = await request.json();

    if (!code) {
      return NextResponse.json({ 
        error: 'Verification code is required' 
      }, { status: 400 });
    }

    const result = await emailVerificationService.verifyCode(
      session.user.id,
      code,
      purpose as EmailVerificationPurpose
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId
    });

  } catch (error) {
    console.error('Verify email code API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

