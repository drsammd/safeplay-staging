
import type { Metadata } from "next";
import { NO_INDEX_META_TAGS } from "@/lib/security-headers";

export const metadata: Metadata = {
  title: "SafePlay™ - Stakeholder Access",
  description: "Secure staging environment for authorized stakeholders",
  robots: NO_INDEX_META_TAGS.robots,
  other: {
    'googlebot': NO_INDEX_META_TAGS.googlebot,
    'X-Robots-Tag': NO_INDEX_META_TAGS['X-Robots-Tag']
  }
};

export default function StagingAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta httpEquiv="X-Robots-Tag" content="noindex, nofollow" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {children}
      </body>
    </html>
  );
}
