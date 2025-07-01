
"use client";

import { useState } from "react";
import { AlertTriangle, X, Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="container mx-auto px-4">
        <Alert className="border-0 bg-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <AlertDescription className="text-amber-800 font-medium">
                <span className="font-bold">BETA ENVIRONMENT:</span> This is a secure staging environment for authorized stakeholders only. 
                Features may be incomplete and data is for testing purposes.
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
