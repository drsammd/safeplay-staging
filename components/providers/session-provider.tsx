
"use client";

import { SessionProvider } from "next-auth/react";
import { DemoSessionProvider } from "./demo-session-provider";
import { useEffect, useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  // CRITICAL v1.5.31 FIX: Ensure client-side mounting to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatches by waiting for client-side mount
  if (!isMounted) {
    return <div>Loading...</div>;
  }

  return (
    <SessionProvider 
      // CRITICAL v1.5.31 FIX: Enhanced session configuration for better persistence
      refetchInterval={5 * 60} // Refetch every 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <DemoSessionProvider>
        {children}
      </DemoSessionProvider>
    </SessionProvider>
  );
}
