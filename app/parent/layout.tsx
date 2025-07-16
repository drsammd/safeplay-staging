
import { Metadata } from "next";
import Providers from "@/components/providers/fixed-session-provider";
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
  return (
    <Providers>
      <ParentLayout>{children}</ParentLayout>
    </Providers>
  );
}
