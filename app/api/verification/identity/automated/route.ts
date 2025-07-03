

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
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    
    // Get document images
    const documentImages: Buffer[] = [];
    const files = formData.getAll('documentImages') as File[];
    
    for (const file of files) {
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        documentImages.push(Buffer.from(arrayBuffer));
      }
    }

    if (documentImages.length === 0) {
      return NextResponse.json({ 
        error: 'At least one document image is required' 
      }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ 
        error: 'Document type is required' 
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

    // Initiate automated verification
    const result = await enhancedVerificationService.initiateAutomatedIdentityVerification(
      session.user.id,
      documentType,
      documentImages,
      metadata
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Verification failed' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
      autoApproved: result.autoApproved,
      autoRejected: result.autoRejected,
      requiresManualReview: result.requiresManualReview,
      confidence: result.confidence,
      reason: result.reason
    });

  } catch (error) {
    console.error('Automated identity verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

