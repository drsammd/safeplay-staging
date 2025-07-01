
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import FloorPlanManagement from '@/components/floor-plan/floor-plan-management';

export default async function VenueFloorPlansPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
    redirect('/unauthorized');
  }

  // Get venue for venue admin
  let venue = null;
  if (session.user.role === 'VENUE_ADMIN') {
    venue = await prisma.venue.findFirst({
      where: { adminId: session.user.id },
      select: { id: true, name: true, address: true }
    });

    if (!venue) {
      redirect('/unauthorized');
    }
  }

  // For company admin, we'll handle venue selection in the component
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Enhanced Header with Better Visibility */}
      <div className="mb-8 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-8 border border-white/20">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Floor Plan & Camera Management
        </h1>
        <p className="text-lg text-gray-700 mb-4 font-medium">
          Manage your venue floor plans and optimize camera placement for comprehensive safety coverage.
        </p>
        {venue && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Currently Managing: <span className="font-bold ml-1">{venue.name}</span>
              <span className="text-blue-600 mx-2">•</span>
              <span className="text-blue-700">{venue.address}</span>
            </p>
          </div>
        )}
      </div>

      {/* Content Container with Better Background */}
      <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 overflow-hidden">
        <FloorPlanManagement 
          venueId={venue?.id} 
          userRole={session.user.role}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
