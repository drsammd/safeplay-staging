
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import RevenueAnalytics from '@/components/venue/revenue-analytics';

export const metadata: Metadata = {
  title: 'Revenue Analytics | SafePlay Venue Admin',
  description: 'Track your venue revenue and earnings',
};

export const dynamic = 'force-dynamic';

export default async function RevenueAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user is venue admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      managedVenues: {
        include: {
          paymentSettings: true,
        },
      },
    },
  });

  if (!user || user.role !== 'VENUE_ADMIN') {
    redirect('/unauthorized');
  }

  if (user.managedVenues.length === 0) {
    redirect('/venue-admin');
  }

  const venue = user.managedVenues[0];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Revenue Analytics</h1>
        <p className="text-gray-600">
          Track earnings and revenue sharing for {venue.name}
        </p>
      </div>

      <RevenueAnalytics />
    </div>
  );
}
