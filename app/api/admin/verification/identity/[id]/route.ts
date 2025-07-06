

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enhancedVerificationService } from '@/lib/services/enhanced-verification-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verificationId = params.id;
    
    // Get verification details with user relation
    const verification = await enhancedVerificationService.getVerificationById(verificationId);
    
    if (!verification) {
      return NextResponse.json({ 
        error: 'Verification not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      verification,
      verificationHistory: [] // Add history if needed
    });

  } catch (error) {
    console.error('Get verification details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verificationId = params.id;
    const { decision, notes } = await request.json();

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      return NextResponse.json({ 
        error: 'Valid decision (APPROVE or REJECT) is required' 
      }, { status: 400 });
    }

    if (!notes || notes.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Review notes are required' 
      }, { status: 400 });
    }

    const result = await enhancedVerificationService.manualReviewOverride(
      verificationId,
      session.user.id,
      decision,
      notes.trim()
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${decision.toLowerCase()}d successfully`
    });

  } catch (error) {
    console.error('Manual verification review API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

