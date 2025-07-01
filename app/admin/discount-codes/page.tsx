
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import DiscountCodeManagement from '@/components/discount/discount-code-management';

export const metadata = {
  title: 'Discount Code Management - SafePlay Admin',
  description: 'Manage promotional discount codes and campaigns'
};

export default async function DiscountCodesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || user.role !== UserRole.COMPANY_ADMIN) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <DiscountCodeManagement />
      </div>
    </div>
  );
}

