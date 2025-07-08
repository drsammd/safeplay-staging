
"use client";

import { useState } from "react";
import { useEffectiveSession } from "@/components/providers/demo-session-provider";
import ModernSidebar from "@/components/navigation/modern-sidebar";
import ModernHeader from "@/components/navigation/modern-header";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle } from "lucide-react";

interface ModernParentLayoutProps {
  children: React.ReactNode;
}

export default function ModernParentLayout({ children }: ModernParentLayoutProps) {
  const { data: session, isDemoMode } = useEffectiveSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getVerificationPrompt = () => {
    if (!session?.user) return null;

    // Skip verification prompts in demo mode for stakeholder presentations
    if (isDemoMode) return null;

    const { phoneVerified, identityVerified, twoFactorEnabled, verificationLevel } = session.user;
    
    if (verificationLevel === 'FULL_VERIFIED') return null;
    
    let promptText = '';
    let urgency: 'low' | 'medium' | 'high' = 'low';
    
    if (!phoneVerified) {
      promptText = 'Verify your phone number for enhanced security';
      urgency = 'high';
    } else if (!identityVerified) {
      promptText = 'Complete identity verification to unlock all features';
      urgency = 'medium';
    } else if (!twoFactorEnabled) {
      promptText = 'Enable 2FA for maximum account protection';
      urgency = 'low';
    }

    if (!promptText) return null;

    return (
      <div className={`p-4 rounded-lg border mb-6 ${
        urgency === 'high' ? 'bg-orange-50 border-orange-200' :
        urgency === 'medium' ? 'bg-orange-50 border-orange-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className={`h-5 w-5 ${
              urgency === 'high' ? 'text-red-600' :
              urgency === 'medium' ? 'text-orange-600' :
              'text-blue-600'
            }`} />
            <div>
              <h3 className={`text-sm font-semibold ${
                urgency === 'high' ? 'text-orange-800' :
                urgency === 'medium' ? 'text-orange-800' :
                'text-blue-800'
              }`}>
                Security Enhancement Required
              </h3>
              <p className={`text-sm ${
                urgency === 'high' ? 'text-orange-700' :
                urgency === 'medium' ? 'text-orange-700' :
                'text-blue-700'
              }`}>
                {promptText}
              </p>
            </div>
          </div>
          <Link href="/verification">
            <Button size="sm" variant="outline" className="text-sm">
              Complete Now
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 beta-banner-responsive">
      {/* Sidebar */}
      <ModernSidebar 
        userRole="parent"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-72">
        <ModernHeader 
          userRole="parent"
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1">
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {getVerificationPrompt()}
              
              {/* Quick Security Status */}
              {session?.user && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Account Security Status</h3>
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-600">Phone:</span>
                            {session.user.phoneVerified ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-600">Identity:</span>
                            {session.user.identityVerified ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-600">2FA:</span>
                            {session.user.twoFactorEnabled ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-gray-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <VerificationBadge 
                      verificationLevel={session.user.verificationLevel || 'UNVERIFIED'}
                      size="sm"
                    />
                  </div>
                </div>
              )}

              {children}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
