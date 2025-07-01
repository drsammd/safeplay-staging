
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/pos/refund - Process refund
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only venue admin or company admin can process refunds
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Only venue staff can process refunds' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      transactionId,
      refundAmount,
      refundReason,
      partialRefund = false,
      notes,
    } = body;

    if (!transactionId || !refundAmount || !refundReason) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, refundAmount, refundReason' },
        { status: 400 }
      );
    }

    // Find the original transaction
    const originalTransaction = await prisma.pOSTransaction.findUnique({
      where: { id: transactionId },
      include: {
        membership: {
          select: {
            id: true,
            loyaltyPoints: true,
            totalSpent: true,
          },
        },
      },
    });

    if (!originalTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (originalTransaction.refunded) {
      return NextResponse.json(
        { error: 'Transaction already refunded' },
        { status: 400 }
      );
    }

    if (refundAmount > originalTransaction.totalAmount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original transaction amount' },
        { status: 400 }
      );
    }

    // Update original transaction
    await prisma.pOSTransaction.update({
      where: { id: transactionId },
      data: {
        refunded: true,
        refundAmount,
        refundReason,
        refundedAt: new Date(),
      },
    });

    // Create refund transaction record
    const refundTransaction = await prisma.pOSTransaction.create({
      data: {
        transactionId: `REF${Date.now()}${Math.floor(Math.random() * 1000)}`,
        venueId: originalTransaction.venueId,
        memberId: originalTransaction.memberId,
        membershipId: originalTransaction.membershipId,
        transactionType: 'REFUND',
        amount: -refundAmount,
        totalAmount: -refundAmount,
        paymentMethod: originalTransaction.paymentMethod,
        paymentStatus: 'COMPLETED',
        items: {
          refundFor: originalTransaction.transactionId,
          originalAmount: originalTransaction.totalAmount,
          refundReason,
        },
        loyaltyPointsEarned: -Math.floor(refundAmount), // Deduct loyalty points
        cashierId: session.user.id,
        receiptNumber: `REF${Date.now()}`,
        internalNotes: notes,
        processingTime: 1000,
      },
    });

    // Update membership if applicable
    if (originalTransaction.membershipId && originalTransaction.membership) {
      const pointsToDeduct = Math.floor(refundAmount);
      const newLoyaltyPoints = Math.max(0, originalTransaction.membership.loyaltyPoints - pointsToDeduct);
      const newTotalSpent = Math.max(0, originalTransaction.membership.totalSpent - refundAmount);

      await prisma.membership.update({
        where: { id: originalTransaction.membershipId },
        data: {
          loyaltyPoints: newLoyaltyPoints,
          totalSpent: newTotalSpent,
        },
      });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refundTransaction.id,
        transactionId: refundTransaction.transactionId,
        refundAmount,
        receiptNumber: refundTransaction.receiptNumber,
      },
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
