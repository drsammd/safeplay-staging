
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectService } from '@/lib/stripe/connect-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get venue ID from query params or user's managed venues
    const { searchParams } = new URL(request.url);
    const venueIdParam = searchParams.get('venueId');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { managedVenues: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let venueId = venueIdParam;

    // If user is venue admin, use their venue
    if (user.role === 'VENUE_ADMIN') {
      if (user.managedVenues.length === 0) {
        return NextResponse.json({ error: 'No venues found' }, { status: 404 });
      }
      venueId = user.managedVenues[0].id;
    }

    // Company admins can check any venue
    if (user.role === 'SUPER_ADMIN' && !venueId) {
      return NextResponse.json({ error: 'Venue ID required for company admin' }, { status: 400 });
    }

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    const status = await connectService.checkAccountStatus(venueId);
    
    // Get earnings summary
    const earnings = await connectService.getVenueEarnings(venueId);

    return NextResponse.json({
      accountStatus: status,
      earnings,
    });
  } catch (error) {
    console.error('Error checking Connect status:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}
