
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, X, Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  // Hide banner completely on staging-auth page
  if (pathname === '/staging-auth') return null;

  return (
    <div 
      className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 transition-all duration-300 ease-in-out" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0,
        width: '100vw',
        zIndex: 9999,
        margin: 0,
        padding: 0,
        height: isVisible ? '60px' : '0px',
        overflow: 'hidden'
      }}
    >
      <div className="w-full px-4 py-3" style={{ margin: 0, maxWidth: 'none' }}>
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Shield className="h-5 w-5 text-amber-600" />
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-amber-800 font-medium text-sm md:text-base flex-1">
              <span className="font-bold">BETA ENVIRONMENT:</span> This is a secure staging environment for authorized stakeholders only. 
              Features may be incomplete and data is for testing purposes.
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 p-2 flex-shrink-0 ml-4"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
