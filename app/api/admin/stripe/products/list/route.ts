
import { NextRequest, NextResponse } from 'next/server';
import { productManagementService } from '@/lib/stripe/product-management-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    console.log('✅ Admin authenticated, fetching Stripe products...');

    // Get all existing products from Stripe
    const products = await productManagementService.listExistingProducts();

    console.log('📋 Retrieved', products.length, 'products from Stripe');

    return NextResponse.json({
      success: true,
      products,
      summary: {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.active).length,
        inactiveProducts: products.filter(p => !p.active).length,
        totalPrices: products.reduce((acc, p) => acc + p.prices.length, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error listing products:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to list products',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
