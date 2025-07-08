
"use client";

import { SessionProvider } from "next-auth/react";
import { DemoSessionProvider } from "./demo-session-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DemoSessionProvider>
        {children}
      </DemoSessionProvider>
    </SessionProvider>
  );
}
