
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

// GET - Get discount code analytics
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const codeId = searchParams.get('codeId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build where clause for usage history
    const usageWhere: any = {};
    if (Object.keys(dateFilter).length > 0) {
      usageWhere.appliedAt = dateFilter;
    }

    // Build where clause for discount codes
    const codeWhere: any = {};
    if (category) {
      codeWhere.category = category;
    }
    if (codeId) {
      codeWhere.id = codeId;
    }

    // Get overall statistics
    const [
      totalCodes,
      activeCodes,
      totalUsages,
      successfulUsages,
      totalRevenue,
      totalDiscount,
      topCodes,
      categoryStats,
      usagesByDate
    ] = await Promise.all([
      // Total codes
      prisma.discountCode.count({ where: codeWhere }),
      
      // Active codes
      prisma.discountCode.count({
        where: {
          ...codeWhere,
          status: 'ACTIVE',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      
      // Total usages
      prisma.discountCodeUsage.count({
        where: {
          ...usageWhere,
          discountCode: codeWhere
        }
      }),
      
      // Successful usages
      prisma.discountCodeUsage.count({
        where: {
          ...usageWhere,
          usageStatus: 'REDEEMED',
          discountCode: codeWhere
        }
      }),
      
      // Total revenue
      prisma.discountCodeUsage.aggregate({
        where: {
          ...usageWhere,
          usageStatus: 'REDEEMED',
          discountCode: codeWhere
        },
        _sum: {
          finalAmount: true
        }
      }),
      
      // Total discount given
      prisma.discountCodeUsage.aggregate({
        where: {
          ...usageWhere,
          usageStatus: 'REDEEMED',
          discountCode: codeWhere
        },
        _sum: {
          discountAmount: true
        }
      }),
      
      // Top performing codes
      prisma.discountCode.findMany({
        where: codeWhere,
        include: {
          usageHistory: {
            where: usageWhere,
            select: {
              usageStatus: true,
              discountAmount: true,
              finalAmount: true
            }
          }
        },
        take: 10
      }),
      
      // Category statistics
      prisma.discountCode.groupBy({
        by: ['category'],
        where: codeWhere,
        _count: {
          id: true
        },
        _sum: {
          currentUses: true
        }
      }),
      
      // Usage by date
      prisma.$queryRaw`
        SELECT 
          DATE(applied_at) as date,
          COUNT(*) as usages,
          SUM(CASE WHEN usage_status = 'REDEEMED' THEN 1 ELSE 0 END) as successful_usages,
          SUM(CASE WHEN usage_status = 'REDEEMED' THEN final_amount ELSE 0 END) as revenue,
          SUM(CASE WHEN usage_status = 'REDEEMED' THEN discount_amount ELSE 0 END) as discount
        FROM discount_code_usages dcu
        JOIN discount_codes dc ON dcu.discount_code_id = dc.id
        WHERE 1=1
          ${startDate ? 'AND applied_at >= $1' : ''}
          ${endDate ? 'AND applied_at <= $2' : ''}
          ${category ? 'AND dc.category = $3' : ''}
        GROUP BY DATE(applied_at)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    // Process top codes
    const topCodesWithStats = topCodes.map(code => {
      const successfulUsages = code.usageHistory.filter(u => u.usageStatus === 'REDEEMED');
      const revenue = successfulUsages.reduce((sum, u) => sum + (u.finalAmount || 0), 0);
      const discount = successfulUsages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);
      
      return {
        id: code.id,
        code: code.code,
        name: code.name,
        category: code.category,
        totalUsages: code.usageHistory.length,
        successfulUsages: successfulUsages.length,
        revenue,
        discount,
        conversionRate: code.usageHistory.length > 0 ? (successfulUsages.length / code.usageHistory.length) * 100 : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const analytics = {
      overview: {
        totalCodes,
        activeCodes,
        totalUsages,
        successfulUsages,
        totalRevenue: totalRevenue._sum.finalAmount || 0,
        totalDiscount: totalDiscount._sum.discountAmount || 0,
        conversionRate: totalUsages > 0 ? (successfulUsages / totalUsages) * 100 : 0,
        averageOrderValue: successfulUsages > 0 ? (totalRevenue._sum.finalAmount || 0) / successfulUsages : 0
      },
      topCodes: topCodesWithStats,
      categoryStats,
      usagesByDate: usagesByDate || [],
      trends: {
        // Calculate trends here if needed
        revenueGrowth: 0, // Calculate week-over-week or month-over-month growth
        usageGrowth: 0,
        newCodesThisMonth: 0
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching discount analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' }, 
      { status: 500 }
    );
  }
}

