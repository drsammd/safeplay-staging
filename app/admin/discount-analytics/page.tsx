
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import DiscountAnalyticsDashboard from '@/components/discount/discount-analytics-dashboard';

export const metadata = {
  title: 'Discount Analytics - SafePlay Admin',
  description: 'Analyze discount code performance and ROI'
};

export default async function DiscountAnalyticsPage() {
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
        <DiscountAnalyticsDashboard />
      </div>
    </div>
  );
}

