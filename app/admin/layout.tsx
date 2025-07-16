
import { Metadata } from "next";
import Providers from "@/components/providers/fixed-session-provider";
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
  return (
    <Providers>
      <AdminLayout>{children}</AdminLayout>
    </Providers>
  );
}
