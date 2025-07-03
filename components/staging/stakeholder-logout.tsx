
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StakeholderLogoutProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StakeholderLogout({
  variant = "ghost",
  size = "sm",
  showIcon = true,
  className = ""
}: StakeholderLogoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staging-auth', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Small delay for better UX
        setTimeout(() => {
          window.location.href = '/staging-auth';
        }, 500);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`text-gray-600 hover:text-red-600 hover:bg-red-50 ${className}`}
          disabled={isLoading}
        >
          {showIcon && <LogOut className="h-4 w-4 mr-2" />}
          Exit Beta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <AlertDialogTitle>Exit Beta Environment</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to exit the mySafePlay™ beta environment? 
            You'll need to re-enter your stakeholder credentials to access the application again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Exiting...</span>
              </div>
            ) : (
              "Exit Beta"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
