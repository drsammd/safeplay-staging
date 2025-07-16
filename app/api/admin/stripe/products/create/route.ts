
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

    console.log('✅ Admin authenticated, creating new pricing structure...');

    // Create the new 4-tier pricing structure
    const result = await productManagementService.createNewPricingStructure();

    console.log('🎉 Pricing structure created successfully!');
    console.log('📊 Products:', result.products.length);
    console.log('🔧 Environment variables generated:', Object.keys(result.envVariables).length);

    return NextResponse.json({
      success: true,
      message: 'New pricing structure created successfully',
      products: result.products,
      envVariables: result.envVariables,
      summary: {
        totalProducts: result.products.length,
        totalPrices: result.products.reduce((acc, p) => {
          return acc + (p.monthlyPriceId ? 1 : 0) + (p.yearlyPriceId ? 1 : 0) + (p.lifetimePriceId ? 1 : 0);
        }, 0),
        envVariablesCount: Object.keys(result.envVariables).length
      }
    });

  } catch (error) {
    console.error('❌ Error creating pricing structure:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create pricing structure',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
