"use client";

import ModernParentLayout from "./modern-parent-layout";

interface ParentLayoutProps {
  children: React.ReactNode;
}

export default function ParentLayout({ children }: ParentLayoutProps) {
  return <ModernParentLayout>{children}</ModernParentLayout>;
}
