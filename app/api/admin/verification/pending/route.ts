

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enhancedVerificationService } from '@/lib/services/enhanced-verification-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const pendingReviews = await enhancedVerificationService.getPendingManualReviews(limit);

    return NextResponse.json({
      success: true,
      pendingReviews: pendingReviews.map(verification => ({
        id: verification.id,
        userId: verification.userId,
        user: verification.user,
        documentType: verification.documentType,
        status: verification.status,
        submittedAt: verification.submittedAt,
        verificationScore: verification.verificationScore,
        rejectionReason: verification.rejectionReason,
        reviewedAt: verification.reviewedAt,
        reviewedBy: verification.reviewedBy,
        documentImages: verification.documentImages,
        selfieImage: verification.selfieImage,
        metadata: verification.metadata
      }))
    });

  } catch (error) {
    console.error('Get pending verifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

