

import { Metadata } from "next";
import VenueAdminLayout from "@/components/layouts/venue-admin-layout";

export const metadata: Metadata = {
  title: "SafePlay - Venue Admin Dashboard",
  description: "Venue administration for SafePlay platform",
};

export default function VenueAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removed nested StableAuthProvider - using the one from main layout only
  return (
    <VenueAdminLayout>{children}</VenueAdminLayout>
  );
}
