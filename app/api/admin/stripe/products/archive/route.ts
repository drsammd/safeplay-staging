
import { NextRequest, NextResponse } from 'next/server';
import { productManagementService } from '@/lib/stripe/product-management-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Checking admin authentication...');
    
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin role (SUPER_ADMIN or COMPANY_ADMIN)
    const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'COMPANY_ADMIN';
    if (!isAdmin) {
      console.log(`❌ Access denied for user: ${session.user.email} with role: ${session.user.role}`);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    console.log('✅ Admin authenticated, archiving products:', productIds);

    // Archive the specified products
    await productManagementService.archiveProducts(productIds);

    console.log('📦 Products archived successfully');

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${productIds.length} products`,
      archivedProducts: productIds
    });

  } catch (error) {
    console.error('❌ Error archiving products:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to archive products',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
