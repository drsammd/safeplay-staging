

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enhancedVerificationService } from '@/lib/services/enhanced-verification-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    const analytics = await enhancedVerificationService.getVerificationAnalytics(
      dateFrom,
      dateTo
    );

    return NextResponse.json({
      success: true,
      analytics: {
        ...analytics,
        period: {
          from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: dateTo || new Date()
        }
      }
    });

  } catch (error) {
    console.error('Verification analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

