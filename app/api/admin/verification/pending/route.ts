

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
        createdAt: verification.createdAt,
        documentAnalysis: verification.documentAnalysis ? {
          confidence: verification.documentAnalysis.confidence,
          authenticityScore: verification.documentAnalysis.authenticityScore,
          qualityScore: verification.documentAnalysis.qualityScore,
          fraudIndicators: verification.documentAnalysis.fraudIndicators,
          extractedFields: verification.documentAnalysis.extractedFields,
          reviewReason: verification.documentAnalysis.reviewReason,
          processedAt: verification.documentAnalysis.processedAt
        } : null
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

