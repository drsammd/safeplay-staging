
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enhancedVerificationService } from '@/lib/services/enhanced-verification-service';
import { DocumentType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data for file uploads
    const formData = await request.formData();
    const documentType = formData.get('documentType') as DocumentType;
    const userAddress = formData.get('userAddress') as string;
    const riskTolerance = (formData.get('riskTolerance') as string) || 'MEDIUM';
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    
    // Get document images
    const documentImages: Buffer[] = [];
    const documentFiles = formData.getAll('documentImages') as File[];
    
    for (const file of documentFiles) {
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        documentImages.push(Buffer.from(arrayBuffer));
      }
    }

    // Get selfie image
    const selfieFile = formData.get('selfieImage') as File;
    let selfieBuffer: Buffer | undefined;
    
    if (selfieFile && selfieFile.size > 0) {
      const selfieArrayBuffer = await selfieFile.arrayBuffer();
      selfieBuffer = Buffer.from(selfieArrayBuffer);
    }

    // Validation
    if (documentImages.length === 0) {
      return NextResponse.json({ 
        error: 'At least one document image is required' 
      }, { status: 400 });
    }

    if (!selfieBuffer) {
      return NextResponse.json({ 
        error: 'Selfie image is required for enhanced verification' 
      }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ 
        error: 'Document type is required' 
      }, { status: 400 });
    }

    if (!userAddress || userAddress.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Valid address is required for enhanced verification' 
      }, { status: 400 });
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(riskTolerance)) {
      return NextResponse.json({ 
        error: 'Invalid risk tolerance. Must be LOW, MEDIUM, or HIGH' 
      }, { status: 400 });
    }

    // Validate file sizes (max 10MB per file)
    for (const image of documentImages) {
      if (image.length > 10 * 1024 * 1024) {
        return NextResponse.json({ 
          error: 'Document image must be less than 10MB' 
        }, { status: 400 });
      }
    }

    if (selfieBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Selfie image must be less than 10MB' 
      }, { status: 400 });
    }

    // Initiate enhanced verification
    const result = await enhancedVerificationService.initiateEnhancedIdentityVerification(
      session.user.id,
      documentType,
      documentImages,
      selfieBuffer,
      userAddress.trim(),
      metadata,
      riskTolerance as 'LOW' | 'MEDIUM' | 'HIGH'
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Enhanced verification failed' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
      autoApproved: result.autoApproved,
      autoRejected: result.autoRejected,
      requiresManualReview: result.requiresManualReview,
      confidence: result.confidence,
      reason: result.reason,
      
      // Phase 1.6 Enhanced Results
      overallVerificationScore: result.overallVerificationScore,
      scoringBreakdown: result.scoringBreakdown,
      addressComparison: result.addressComparison,
      faceComparison: result.faceComparison,
      recommendations: result.recommendations,
      riskFactors: result.riskFactors
    });

  } catch (error) {
    console.error('Enhanced identity verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
