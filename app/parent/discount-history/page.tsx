
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import UserDiscountHistory from '@/components/discount/user-discount-history';

export const metadata = {
  title: 'Discount History - SafePlay',
  description: 'View your discount code usage history and savings'
};

export default async function DiscountHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user is a parent
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || user.role !== UserRole.PARENT) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <UserDiscountHistory />
      </div>
    </div>
  );
}

