
/**
 * SafePlay Stable Session Provider v1.5.40-alpha.13
 * 
 * FIXES:
 * - Eliminates infinite loop in session state management
 * - Prevents aggressive demo session clearing
 * - Provides stable session persistence
 * - Removes constant session state switching
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

interface StableSessionContextType {
  data: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  user: any;
  refreshSession: () => Promise<void>;
}

const StableSessionContext = createContext<StableSessionContextType>({
  data: null,
  status: 'unauthenticated',
  isLoading: true,
  user: null,
  refreshSession: async () => {}
});

function StableSessionProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSessionCheck, setLastSessionCheck] = useState<string>('');
  
  // Get NextAuth session - this is the single source of truth
  const nextAuthSession = useSession();

  useEffect(() => {
    // Only log when session actually changes, not on every render
    const currentSessionKey = `${nextAuthSession.status}-${nextAuthSession.data?.user?.id || 'none'}`;
    
    if (currentSessionKey !== lastSessionCheck) {
      console.log('🔐 STABLE SESSION: Session state change:', {
        status: nextAuthSession.status,
        hasSession: !!nextAuthSession.data,
        userEmail: nextAuthSession.data?.user?.email,
        userId: nextAuthSession.data?.user?.id,
        timestamp: new Date().toISOString()
      });
      
      setLastSessionCheck(currentSessionKey);
    }
    
    // Mark as initialized once we've had at least one session check
    if (!isInitialized && nextAuthSession.status !== 'loading') {
      setIsInitialized(true);
    }
  }, [nextAuthSession.status, nextAuthSession.data?.user?.id, lastSessionCheck, isInitialized]);

  const refreshSession = async () => {
    console.log('🔐 STABLE SESSION: Manual session refresh requested');
    
    if (typeof window !== 'undefined') {
      try {
        const { getSession } = await import('next-auth/react');
        await getSession();
        console.log('🔐 STABLE SESSION: Session refresh completed');
      } catch (error) {
        console.error('🔐 STABLE SESSION: Session refresh failed:', error);
      }
    }
  };

  const contextValue: StableSessionContextType = {
    data: nextAuthSession.data,
    status: nextAuthSession.status,
    isLoading: nextAuthSession.status === 'loading',
    user: nextAuthSession.data?.user || null,
    refreshSession
  };

  return (
    <StableSessionContext.Provider value={contextValue}>
      {children}
    </StableSessionContext.Provider>
  );
}

export function useStableSession() {
  const context = useContext(StableSessionContext);
  if (!context) {
    throw new Error('useStableSession must be used within a StableSessionProvider');
  }
  return context;
}

// Main provider that replaces all problematic session providers
export default function StableAuthProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatches
  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <SessionProvider
      // Reduce session checking frequency to prevent constant state changes
      refetchInterval={10 * 60} // 10 minutes instead of 5
      refetchOnWindowFocus={false} // Disable to prevent constant refetching
      refetchWhenOffline={false}
    >
      <StableSessionProvider>
        {children}
      </StableSessionProvider>
    </SessionProvider>
  );
}
