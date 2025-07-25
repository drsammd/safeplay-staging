
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModernSidebar from "@/components/navigation/modern-sidebar";
import ModernHeader from "@/components/navigation/modern-header";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Shield, Activity, AlertCircle } from "lucide-react";

interface ModernVenueAdminLayoutProps {
  children: React.ReactNode;
}

export default function ModernVenueAdminLayout({ children }: ModernVenueAdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Authorization check
  useEffect(() => {
    const checkAuthorization = async () => {
      if (status === 'loading') return;

      if (!session?.user) {
        router.push('/auth/signin');
        return;
      }

      const userRole = session.user.role;
      
      // Allow VENUE_ADMIN, SUPER_ADMIN, and ADMIN roles
      if (!['VENUE_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
        router.push('/unauthorized');
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuthorization();
  }, [session, status, router]);

  // Show loading state while checking authorization
  if (status === 'loading' || isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {status === 'loading' ? 'Loading...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: '60px' }}>
      {/* Sidebar */}
      <ModernSidebar 
        userRole="venue-admin"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-72">
        <ModernHeader 
          userRole="venue-admin"
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1">
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Venue Status Overview */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Venue Status</p>
                      <p className="text-xs text-green-600 font-medium">Active & Operational</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Occupancy</p>
                      <p className="text-xs text-gray-500">123 / 500</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Safety Status</p>
                      <p className="text-xs text-green-600 font-medium">All Clear</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active Zones</p>
                      <p className="text-xs text-gray-500">8 / 10 Zones</p>
                    </div>
                  </div>
                </div>
              </div>

              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
