
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Get all identity verification attempts for the user
    const verifications = await prisma.identityVerification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        verificationType: true,
        status: true,
        documentType: true,
        documentNumber: true,
        documentCountry: true,
        documentState: true,
        documentExpiryDate: true,
        verificationMethod: true,
        confidence: true,
        verificationNotes: true,
        rejectionReason: true,
        reviewedAt: true,
        verifiedAt: true,
        expiresAt: true,
        resubmissionAllowed: true,
        resubmissionCount: true,
        maxResubmissions: true,
        complianceFlags: true,
        fraudFlags: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const latestVerification = verifications[0];

    // Determine what actions are available
    const availableActions = [];
    
    if (!latestVerification) {
      availableActions.push('upload');
    } else {
      switch (latestVerification.status) {
        case 'REJECTED':
        case 'EXPIRED':
          if (latestVerification.resubmissionAllowed) {
            availableActions.push('resubmit');
          }
          break;
        case 'REQUIRES_RESUBMISSION':
          availableActions.push('resubmit');
          break;
        case 'PENDING':
        case 'SUBMITTED':
        case 'UNDER_REVIEW':
          // No actions available while under review
          break;
        case 'APPROVED':
          // Can view details, no upload needed
          break;
      }
    }

    return NextResponse.json({
      success: true,
      verifications,
      latestVerification,
      availableActions,
      summary: {
        totalAttempts: verifications.length,
        isVerified: latestVerification?.status === 'APPROVED',
        isPending: latestVerification?.status && ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(latestVerification.status),
        canResubmit: latestVerification?.resubmissionAllowed || false
      }
    });

  } catch (error) {
    console.error("Identity verification status error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
