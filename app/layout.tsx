

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafePlay - Biometric Child Safety Platform",
  description: "Real-time child tracking and safety with automated memory capture",
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
        <link rel="icon" href="/logos/safeplay_combined_logo.png" />
        <link rel="apple-touch-icon" href="/logos/safeplay_combined_logo.png" />
      </head>
      <body>
        <ErrorBoundary level="global">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

