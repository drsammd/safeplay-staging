
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import SystemSettings from '@/components/admin/system-settings';

export const metadata = {
  title: 'System Settings - SafePlay Admin',
  description: 'Configure platform settings and system preferences'
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <SystemSettings />
      </div>
    </div>
  );
}
