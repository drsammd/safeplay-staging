
/**
 * SafePlay Fixed Session Provider
 * Replaces problematic DemoSessionProvider with secure session management
 * 
 * FIXES:
 * - Session contamination between account types
 * - Prevents demo session interference with normal authentication
 * - Ensures proper session isolation
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

interface SecureSessionContextType {
  data: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  user: any;
  clearSession: () => void;
  refreshSession: () => Promise<void>;
}

const SecureSessionContext = createContext<SecureSessionContextType>({
  data: null,
  status: 'unauthenticated',
  isLoading: true,
  user: null,
  clearSession: () => {},
  refreshSession: async () => {}
});

export function SecureSessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get NextAuth session
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();

  useEffect(() => {
    console.log('🔒 SECURE SESSION PROVIDER: Session state change:', {
      nextAuthStatus,
      hasSession: !!nextAuthSession,
      userEmail: nextAuthSession?.user?.email,
      timestamp: new Date().toISOString()
    });

    // Clear any existing demo session data that might cause contamination
    try {
      // Clear localStorage demo data
      localStorage.removeItem('mySafePlay_demoMode');
      localStorage.removeItem('mySafePlay_demoUser');
      localStorage.removeItem('mySafePlay_demoSession');
      
      // Clear sessionStorage demo data
      sessionStorage.removeItem('mySafePlay_demoMode');
      sessionStorage.removeItem('mySafePlay_demoUser');
      sessionStorage.removeItem('mySafePlay_demoSession');
    } catch (error) {
      console.warn('🔒 SECURE SESSION PROVIDER: Error clearing demo session data:', error);
    }

    // Update session data based on NextAuth session
    if (nextAuthStatus === 'loading') {
      setIsLoading(true);
      setSessionData(null);
    } else if (nextAuthStatus === 'authenticated' && nextAuthSession) {
      // Validate session data before using it
      if (nextAuthSession.user?.id && nextAuthSession.user?.email) {
        console.log('✅ SECURE SESSION PROVIDER: Valid session detected:', {
          userId: nextAuthSession.user.id,
          userEmail: nextAuthSession.user.email,
          role: nextAuthSession.user.role
        });
        
        setSessionData(nextAuthSession);
        setIsLoading(false);
      } else {
        console.error('❌ SECURE SESSION PROVIDER: Invalid session data:', nextAuthSession);
        setSessionData(null);
        setIsLoading(false);
      }
    } else {
      console.log('🔒 SECURE SESSION PROVIDER: No authenticated session');
      setSessionData(null);
      setIsLoading(false);
    }
  }, [nextAuthSession, nextAuthStatus, refreshTrigger]);

  const clearSession = () => {
    console.log('🔒 SECURE SESSION PROVIDER: Clearing session');
    setSessionData(null);
    setIsLoading(false);
    
    // Clear any stored session data
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.warn('🔒 SECURE SESSION PROVIDER: Error clearing storage:', error);
    }
  };

  const refreshSession = async () => {
    console.log('🔒 SECURE SESSION PROVIDER: Refreshing session');
    setIsLoading(true);
    setRefreshTrigger(prev => prev + 1);
    
    // Force NextAuth to refresh
    if (typeof window !== 'undefined') {
      const { getSession } = await import('next-auth/react');
      await getSession();
    }
  };

  const contextValue: SecureSessionContextType = {
    data: sessionData,
    status: isLoading ? 'loading' : (sessionData ? 'authenticated' : 'unauthenticated'),
    isLoading,
    user: sessionData?.user || null,
    clearSession,
    refreshSession
  };

  return (
    <SecureSessionContext.Provider value={contextValue}>
      {children}
    </SecureSessionContext.Provider>
  );
}

export function useSecureSession() {
  const context = useContext(SecureSessionContext);
  if (!context) {
    throw new Error('useSecureSession must be used within a SecureSessionProvider');
  }
  return context;
}

// Updated main provider that replaces the problematic DemoSessionProvider
export default function FixedSessionProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <SessionProvider>
      <SecureSessionProvider>
        {children}
      </SecureSessionProvider>
    </SessionProvider>
  );
}
