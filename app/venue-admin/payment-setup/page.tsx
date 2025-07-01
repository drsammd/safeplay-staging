
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import StripeConnectOnboarding from '@/components/venue/stripe-connect-onboarding';

export const metadata: Metadata = {
  title: 'Payment Setup | SafePlay Venue Admin',
  description: 'Set up Stripe Connect for revenue sharing',
};

export const dynamic = 'force-dynamic';

export default async function PaymentSetupPage() {
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

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Setup</h1>
        <p className="text-gray-600">
          Set up revenue sharing for {user.managedVenues[0].name}
        </p>
      </div>

      <StripeConnectOnboarding />
    </div>
  );
}
