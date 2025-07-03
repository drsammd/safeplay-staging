

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verificationId = params.id;

    // Get verification with analysis
    const verification = await prisma.identityVerification.findFirst({
      where: {
        id: verificationId,
        userId: session.user.id
      },
      include: {
        documentAnalysis: true
      }
    });

    if (!verification) {
      return NextResponse.json({ 
        error: 'Verification not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      verification: {
        id: verification.id,
        status: verification.status,
        documentType: verification.documentType,
        verificationMethod: verification.verificationMethod,
        confidence: verification.confidence,
        verificationNotes: verification.verificationNotes,
        rejectionReason: verification.rejectionReason,
        createdAt: verification.createdAt,
        verifiedAt: verification.verifiedAt
      },
      analysis: verification.documentAnalysis ? {
        confidence: verification.documentAnalysis.confidence,
        authenticityScore: verification.documentAnalysis.authenticityScore,
        qualityScore: verification.documentAnalysis.qualityScore,
        extractedFields: verification.documentAnalysis.extractedFields,
        fraudIndicators: verification.documentAnalysis.fraudIndicators,
        autoApproved: verification.documentAnalysis.autoApproved,
        autoRejected: verification.documentAnalysis.autoRejected,
        requiresManualReview: verification.documentAnalysis.requiresManualReview,
        reviewReason: verification.documentAnalysis.reviewReason,
        processedAt: verification.documentAnalysis.processedAt
      } : null
    });

  } catch (error) {
    console.error('Get verification analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

