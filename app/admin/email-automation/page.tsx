
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EmailAutomationDashboard from '@/components/admin/email-automation-dashboard';

export const dynamic = "force-dynamic";

export default async function AdminEmailAutomationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmailAutomationDashboard />
    </div>
  );
}
