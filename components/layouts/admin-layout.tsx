
"use client";

import ModernAdminLayout from "./modern-admin-layout";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <ModernAdminLayout>{children}</ModernAdminLayout>;
}
