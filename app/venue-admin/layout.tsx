
import { Metadata } from "next";
import Providers from "@/components/providers/session-provider";
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
  return (
    <Providers>
      <VenueAdminLayout>{children}</VenueAdminLayout>
    </Providers>
  );
}
