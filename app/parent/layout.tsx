

import { Metadata } from "next";
import ParentLayout from "@/components/layouts/parent-layout";

export const metadata: Metadata = {
  title: "SafePlay - Parent Dashboard",
  description: "Parent dashboard for child safety and memories",
};

export default function ParentLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removed nested StableAuthProvider - using the one from main layout only
  return (
    <ParentLayout>{children}</ParentLayout>
  );
}
