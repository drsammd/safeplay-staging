
/**
 * SafePlay Authentication Debug Panel
 * Provides debugging interface for authentication issues
 * 
 * FEATURES:
 * - Real-time session status monitoring
 * - User context validation
 * - Session consistency checks
 * - Authentication troubleshooting
 */

'use client';

import { useState, useEffect } from 'react';
import { useSecureSession } from '@/components/providers/fixed-session-provider';

interface AuthDebugInfo {
  sessionValid: boolean;
  userContext: any;
  sessionData: any;
  validationErrors: string[];
  lastValidation: string;
}

export default function AuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo>({
    sessionValid: false,
    userContext: null,
    sessionData: null,
    validationErrors: [],
    lastValidation: ''
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const { data: session, status, user } = useSecureSession();

  useEffect(() => {
    validateSession();
  }, [session, status]);

  const validateSession = async () => {
    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      setDebugInfo({
        sessionValid: result.valid,
        userContext: result.user || null,
        sessionData: result.session || null,
        validationErrors: result.valid ? [] : [result.error || 'Unknown validation error'],
        lastValidation: new Date().toISOString()
      });

    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        sessionValid: false,
        validationErrors: [`Validation request failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        lastValidation: new Date().toISOString()
      }));
    }
  };

  const clearSession = () => {
    // Clear all session storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const testUserValidation = async () => {
    if (!user?.id || !user?.email) {
      alert('No user context available for validation');
      return;
    }

    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          operationContext: 'debug_panel_test'
        })
      });

      const result = await response.json();
      
      if (result.valid) {
        alert('User validation successful!');
      } else {
        alert(`User validation failed: ${result.error}`);
      }

    } catch (error) {
      alert(`Validation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
      >
        🔐 Auth Debug
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Authentication Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <strong>Session Status:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                status === 'authenticated' ? 'bg-green-100 text-green-800' : 
                status === 'loading' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {status}
              </span>
            </div>

            <div>
              <strong>Session Valid:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                debugInfo.sessionValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {debugInfo.sessionValid ? 'Valid' : 'Invalid'}
              </span>
            </div>

            {debugInfo.userContext && (
              <div>
                <strong>User Context:</strong>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(debugInfo.userContext, null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.validationErrors.length > 0 && (
              <div>
                <strong>Validation Errors:</strong>
                <ul className="text-xs text-red-600 mt-1">
                  {debugInfo.validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <strong>Last Validation:</strong>
              <span className="text-xs text-gray-600 ml-2">
                {debugInfo.lastValidation}
              </span>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={validateSession}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
              >
                Refresh
              </button>
              <button
                onClick={testUserValidation}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
              >
                Test User
              </button>
              <button
                onClick={clearSession}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
              >
                Clear Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
