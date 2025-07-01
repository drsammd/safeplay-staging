
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectService } from '@/lib/stripe/connect-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is venue admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { managedVenues: true }
    });

    if (!user || user.role !== 'VENUE_ADMIN') {
      return NextResponse.json({ error: 'Only venue admins can onboard' }, { status: 403 });
    }

    if (user.managedVenues.length === 0) {
      return NextResponse.json({ error: 'No venues found for this admin' }, { status: 404 });
    }

    const venue = user.managedVenues[0]; // Use first venue
    const { businessName, email } = await request.json();

    // Check if Connect account already exists
    const existingSettings = await prisma.venuePaymentSettings.findUnique({
      where: { venueId: venue.id }
    });

    let accountLink;

    if (existingSettings?.stripeConnectAccountId) {
      // Generate new onboarding link for existing account
      accountLink = await connectService.createOnboardingLink(venue.id);
    } else {
      // Create new Connect account
      const account = await connectService.createConnectAccount(
        venue.id,
        email || user.email,
        businessName || venue.name
      );

      // Generate onboarding link
      accountLink = await connectService.createOnboardingLink(venue.id);
    }

    return NextResponse.json({
      onboardingUrl: accountLink.url,
      accountId: existingSettings?.stripeConnectAccountId,
    });
  } catch (error) {
    console.error('Error creating Connect onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
