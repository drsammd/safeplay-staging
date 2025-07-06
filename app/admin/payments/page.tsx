
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import PaymentManagement from '@/components/admin/payment-management';

export const metadata: Metadata = {
  title: 'Payment Management | SafePlay Admin',
  description: 'Manage venue revenue sharing and subscription analytics',
};

export const dynamic = 'force-dynamic';

export default async function PaymentManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user is company admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="container mx-auto py-8">
      <PaymentManagement />
    </div>
  );
}
