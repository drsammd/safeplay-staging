
"use client";

import ModernVenueAdminLayout from "./modern-venue-admin-layout";

interface VenueAdminLayoutProps {
  children: React.ReactNode;
}

export default function VenueAdminLayout({ children }: VenueAdminLayoutProps) {
  return <ModernVenueAdminLayout>{children}</ModernVenueAdminLayout>;
}
