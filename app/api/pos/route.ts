
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TransactionType, PaymentMethod, PaymentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/pos - Get POS transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const memberId = searchParams.get('memberId');
    const transactionType = searchParams.get('transactionType') as TransactionType | null;
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      // Get member ID for this parent
      const membership = await prisma.membership.findFirst({
        where: { parentId: session.user.id },
        select: { memberId: true },
      });
      if (membership) {
        where.memberId = membership.memberId;
      }
    } else if (session.user.role === 'VENUE_ADMIN' && venueId) {
      where.venueId = venueId;
    }

    if (memberId) where.memberId = memberId;
    if (transactionType) where.transactionType = transactionType;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const transactions = await prisma.pOSTransaction.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        membership: {
          select: {
            id: true,
            memberId: true,
            parent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            packageType: true,
          },
        },
        checkInEvent: {
          select: {
            id: true,
            eventType: true,
            child: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        limit,
        offset,
        total: await prisma.pOSTransaction.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching POS transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch POS transactions' },
      { status: 500 }
    );
  }
}

// POST /api/pos - Create POS transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      venueId,
      memberId,
      membershipId,
      packageId,
      
      transactionType,
      items,
      amount,
      tax = 0,
      discount = 0,
      paymentMethod,
      promoCode,
      loyaltyPointsUsed = 0,
      terminalId,
      customerNotes,
      internalNotes,
    } = body;

    // Validate required fields
    if (!venueId || !transactionType || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: venueId, transactionType, amount, paymentMethod' },
        { status: 400 }
      );
    }

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Calculate promo discount
    let promoDiscount = 0;
    if (promoCode) {
      // In production, this would validate against a promo codes table
      promoDiscount = amount * 0.1; // 10% discount for demo
    }

    const totalAmount = amount + tax - discount - promoDiscount;

    // Calculate loyalty points earned (1 point per dollar spent)
    const loyaltyPointsEarned = Math.floor(totalAmount);

    // Create POS transaction
    const transaction = await prisma.pOSTransaction.create({
      data: {
        transactionId,
        venueId,
        memberId,
        membershipId,
        packageId,
        
        transactionType,
        amount,
        tax,
        discount,
        totalAmount,
        paymentMethod,
        paymentStatus: 'COMPLETED', // For demo purposes
        items,
        loyaltyPointsEarned,
        loyaltyPointsUsed,
        promoCode,
        promoDiscount,
        cashierId: session.user.id,
        terminalId,
        receiptNumber: `REC${Date.now()}`,
        customerNotes,
        internalNotes,
        processingTime: Math.floor(Math.random() * 3000) + 1000, // 1-4 seconds
      },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
          },
        },
        membership: {
          select: {
            memberId: true,
            parent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update membership loyalty points and spending if applicable
    if (membershipId) {
      await prisma.membership.update({
        where: { id: membershipId },
        data: {
          loyaltyPoints: { increment: loyaltyPointsEarned - loyaltyPointsUsed },
          totalSpent: { increment: totalAmount },
          visitCount: { increment: 1 },
          lastVisit: new Date(),
        },
      });

      // Update average spend per visit
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        select: { totalSpent: true, visitCount: true },
      });

      if (membership) {
        await prisma.membership.update({
          where: { id: membershipId },
          data: {
            averageSpendPerVisit: membership.totalSpent / membership.visitCount,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        transactionId: transaction.transactionId,
        totalAmount: transaction.totalAmount,
        paymentStatus: transaction.paymentStatus,
        receiptNumber: transaction.receiptNumber,
        loyaltyPointsEarned: transaction.loyaltyPointsEarned,
      },
      message: 'Transaction processed successfully',
    });
  } catch (error) {
    console.error('Error creating POS transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}
