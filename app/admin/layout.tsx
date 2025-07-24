

import { Metadata } from "next";
import AdminLayout from "@/components/layouts/admin-layout";

export const metadata: Metadata = {
  title: "SafePlay - Company Admin Dashboard",
  description: "Company administration for SafePlay platform",
};

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removed nested StableAuthProvider - using the one from main layout only
  return (
    <AdminLayout>{children}</AdminLayout>
  );
}
