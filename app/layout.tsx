

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { BetaBanner } from "@/components/staging/beta-banner";
import { VersionTracker } from "@/components/version-tracker";
import { NO_INDEX_META_TAGS } from "@/lib/security-headers";
import StableAuthProvider from "@/components/providers/stable-session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "mySafePlay™ - Beta Environment",
  description: "Secure staging environment for authorized stakeholders - Real-time child tracking and safety with automated memory capture",
  robots: NO_INDEX_META_TAGS.robots,
  other: {
    'googlebot': NO_INDEX_META_TAGS.googlebot,
    'X-Robots-Tag': NO_INDEX_META_TAGS['X-Robots-Tag']
  },
  icons: {
    icon: '/logos/safeplay_combined_logo.png',
    shortcut: '/logos/safeplay_combined_logo.png',
    apple: '/logos/safeplay_combined_logo.png',
  }
};

export default function RootLayout({
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
        <link rel="icon" href="/logos/safeplay_combined_logo.png" />
        <link rel="apple-touch-icon" href="/logos/safeplay_combined_logo.png" />
        <VersionTracker placement="meta" />
      </head>
      <body>
        <ErrorBoundary level="global">
          <StableAuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <BetaBanner />
              <VersionTracker placement="console" />
              {children}
              <Toaster />
            </ThemeProvider>
          </StableAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

