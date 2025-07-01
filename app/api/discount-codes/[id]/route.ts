
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { discountService, stripe } from '@/lib/stripe/discount-service';
import { UserRole, DiscountCodeStatus } from '@prisma/client';

// GET - Get specific discount code
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== UserRole.COMPANY_ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const discountCode = await prisma.discountCode.findUnique({
      where: { id: params.id },
      include: {
        usageHistory: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { validatedAt: 'desc' }
        },
        _count: {
          select: {
            usageHistory: true
          }
        }
      }
    });

    if (!discountCode) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Calculate analytics
    const successfulUsages = discountCode.usageHistory.filter(u => u.usageStatus === 'REDEEMED');
    const totalRevenue = successfulUsages.reduce((sum, u) => sum + (u.finalAmount || 0), 0);
    const totalDiscount = successfulUsages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);

    const enrichedCode = {
      ...discountCode,
      analytics: {
        totalUsages: discountCode._count.usageHistory,
        successfulUsages: successfulUsages.length,
        totalRevenue,
        totalDiscount,
        averageOrderValue: successfulUsages.length > 0 ? totalRevenue / successfulUsages.length : 0,
        conversionRate: discountCode.clickCount > 0 ? (successfulUsages.length / discountCode.clickCount) * 100 : 0,
        isExpired: discountCode.expiresAt ? new Date() > discountCode.expiresAt : false,
        isExhausted: discountCode.maxUses ? discountCode.currentUses >= discountCode.maxUses : false
      }
    };

    return NextResponse.json(enrichedCode);

  } catch (error) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount code' }, 
      { status: 500 }
    );
  }
}

// PUT - Update discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== UserRole.COMPANY_ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();

    // Get existing discount code
    const existingCode = await prisma.discountCode.findUnique({
      where: { id: params.id }
    });

    if (!existingCode) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Update discount code
    const updatedCode = await prisma.discountCode.update({
      where: { id: params.id },
      data: {
        ...data,
        lastModifiedBy: session.user.id,
        updatedAt: new Date()
      }
    });

    // Update Stripe objects if needed
    try {
      if (data.status === DiscountCodeStatus.INACTIVE && updatedCode.stripePromotionCodeId) {
        // Deactivate Stripe promotion code
        await stripe.promotionCodes.update(updatedCode.stripePromotionCodeId, {
          active: false
        });
      }
    } catch (stripeError) {
      console.error('Error updating Stripe objects:', stripeError);
    }

    return NextResponse.json(updatedCode);

  } catch (error) {
    console.error('Error updating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to update discount code' }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== UserRole.COMPANY_ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const discountCode = await prisma.discountCode.findUnique({
      where: { id: params.id },
      include: { usageHistory: true }
    });

    if (!discountCode) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Check if code has been used
    if (discountCode.usageHistory.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete discount code that has been used. Set status to inactive instead.' }, 
        { status: 400 }
      );
    }

    // Delete Stripe objects first
    try {
      if (discountCode.stripePromotionCodeId) {
        await stripe.promotionCodes.update(discountCode.stripePromotionCodeId, {
          active: false
        });
      }
    } catch (stripeError) {
      console.error('Error deactivating Stripe promotion code:', stripeError);
    }

    // Delete discount code
    await prisma.discountCode.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Discount code deleted successfully' });

  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount code' }, 
      { status: 500 }
    );
  }
}

