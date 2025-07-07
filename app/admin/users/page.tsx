
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import UserManagement from '@/components/admin/user-management';

export const metadata = {
  title: 'User Management - SafePlay Admin',
  description: 'Manage platform users, roles, and permissions'
};

export default async function UsersPage() {
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
        <UserManagement />
      </div>
    </div>
  );
}
