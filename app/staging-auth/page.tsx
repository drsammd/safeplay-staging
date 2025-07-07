"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { VersionTracker, getVersionInfo } from "@/components/version-tracker";

export default function StagingAuthPage() {
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/staging-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          rememberMe
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check if user was auto-authenticated
        if (data.autoAuthenticated) {
          // Trigger NextAuth signin with empty credentials to use auto-signin token
          try {
            const { signIn } = await import('next-auth/react');
            const result = await signIn('credentials', {
              email: '',
              password: '',
              redirect: false
            });

            if (result?.ok) {
              console.log('✅ Auto-signin successful, redirecting to dashboard');
              setTimeout(() => {
                router.push(data.redirectTo || '/');
                router.refresh();
              }, 500);
            } else {
              console.log('⚠️ Auto-signin failed, redirecting anyway');
              setTimeout(() => {
                router.push(data.redirectTo || '/');
                router.refresh();
              }, 500);
            }
          } catch (error) {
            console.error('❌ Auto-signin error:', error);
            // Fallback to regular redirect
            setTimeout(() => {
              router.push(data.redirectTo || '/');
              router.refresh();
            }, 500);
          }
        } else {
          // Fallback to home page
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 500);
        }
      } else {
        setError(data.message || 'Invalid password. Please try again.');
        setAttempts(prev => prev + 1);
        setPassword("");
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0f4ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo and Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            margin: '0 auto 1.5rem',
            width: '128px',
            height: '128px',
            background: '#ffffff',
            borderRadius: '50%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/family-logo.png" 
              alt="mySafePlay Family-Centric Logo" 
              style={{
                width: '64px',
                height: '64px',
                objectFit: 'contain',
                borderRadius: '50%'
              }}
            />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            mySafePlay™
          </h1>
          <p style={{ color: '#6b7280' }}>Stakeholder Access Portal</p>
        </div>

        {/* Main Authentication Card */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
          padding: '2rem',
          border: 'none'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              margin: '0 auto 1rem',
              width: '64px',
              height: '64px',
              background: '#dbeafe',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock 
                size={32}
                color="#3b82f6"
                aria-label="Secure Access"
              />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Beta Environment Access
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              This is a secure staging environment for authorized stakeholders only.
              Please enter your access credentials to continue.
            </p>
          </div>

          {/* Security Notice */}
          <div style={{
            border: '1px solid #fbbf24',
            background: '#fffbeb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#92400e', fontSize: '0.875rem' }}>
              <strong>Confidential:</strong> This environment contains pre-release features. 
              Please do not share access credentials or discuss features publicly.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              border: '1px solid #ef4444',
              background: '#fef2f2',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>
            </div>
          )}

          {/* Rate Limit Warning */}
          {attempts >= 3 && (
            <div style={{
              border: '1px solid #ef4444',
              background: '#fef2f2',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                Multiple failed attempts detected. Please verify your credentials.
              </p>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="password" style={{ 
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Access Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter stakeholder password"
                  style={{
                    width: '100%',
                    height: '48px',
                    fontSize: '1rem',
                    padding: '0 3rem 0 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: '#ffffff'
                  }}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="remember" style={{ fontSize: '0.875rem', color: '#6b7280', cursor: 'pointer' }}>
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '1rem',
                fontWeight: '600',
                background: isLoading || !password.trim() 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !password.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.5rem'
                  }} />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>✅</span>
                  <span>Access mySafePlay™</span>
                </div>
              )}
            </button>
          </form>

          {/* Help Section */}
          <div style={{ 
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Need access credentials?
            </p>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              color: '#3b82f6'
            }}>
              <span style={{ marginRight: '0.5rem' }}>📧</span>
              <span>Contact your project manager</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            © 2025 mySafePlay™. Secure Beta Environment v{getVersionInfo().version}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.25rem' }}>
            Protected by enterprise-grade security measures
          </p>
        </div>
        <VersionTracker placement="console" />
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
