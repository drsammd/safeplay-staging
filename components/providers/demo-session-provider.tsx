
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface DemoUser {
  id: string
  email: string
  name: string
  role: string
  isDemo: boolean
}

interface DemoSession {
  user: DemoUser
  expires: string
}

interface DemoSessionContextType {
  isDemoMode: boolean
  demoSession: DemoSession | null
  effectiveSession: any // The session to use (demo or NextAuth)
  isLoading: boolean
}

const DemoSessionContext = createContext<DemoSessionContextType>({
  isDemoMode: false,
  demoSession: null,
  effectiveSession: null,
  isLoading: true
})

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get NextAuth session as fallback
  const nextAuthSession = useSession()

  useEffect(() => {
    // Check if we're in demo mode
    const checkDemoMode = () => {
      try {
        const demoModeFlag = sessionStorage.getItem('mySafePlay_demoMode')
        const demoSessionData = sessionStorage.getItem('mySafePlay_demoSession')
        
        if (demoModeFlag === 'true' && demoSessionData) {
          const parsedDemoSession = JSON.parse(demoSessionData)
          
          // Check if demo session is still valid
          const expiryTime = new Date(parsedDemoSession.expires).getTime()
          const currentTime = new Date().getTime()
          
          if (currentTime < expiryTime) {
            console.log('🎭 Demo mode session active:', parsedDemoSession.user.email)
            setIsDemoMode(true)
            setDemoSession(parsedDemoSession)
          } else {
            console.log('🎭 Demo session expired, clearing demo mode')
            clearDemoMode()
          }
        } else {
          setIsDemoMode(false)
          setDemoSession(null)
        }
      } catch (error) {
        console.error('Error checking demo mode:', error)
        clearDemoMode()
      } finally {
        setIsLoading(false)
      }
    }

    checkDemoMode()
    
    // Check demo mode periodically
    const interval = setInterval(checkDemoMode, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])

  const clearDemoMode = () => {
    sessionStorage.removeItem('mySafePlay_demoMode')
    sessionStorage.removeItem('mySafePlay_demoUser')
    sessionStorage.removeItem('mySafePlay_demoSession')
    setIsDemoMode(false)
    setDemoSession(null)
  }

  // Determine the effective session to use
  const effectiveSession = isDemoMode && demoSession ? {
    user: demoSession.user,
    expires: demoSession.expires
  } : nextAuthSession.data

  const contextValue: DemoSessionContextType = {
    isDemoMode,
    demoSession,
    effectiveSession,
    isLoading: isLoading || nextAuthSession.status === 'loading'
  }

  return (
    <DemoSessionContext.Provider value={contextValue}>
      {children}
    </DemoSessionContext.Provider>
  )
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext)
  if (!context) {
    throw new Error('useDemoSession must be used within a DemoSessionProvider')
  }
  return context
}

// Custom hook that provides unified session access
export function useEffectiveSession() {
  const { effectiveSession, isLoading, isDemoMode } = useDemoSession()
  
  return {
    data: effectiveSession,
    status: isLoading ? 'loading' : (effectiveSession ? 'authenticated' : 'unauthenticated'),
    isDemoMode
  }
}
