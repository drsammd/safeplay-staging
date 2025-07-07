
"use client";

import Link from "next/link";
import { VersionTracker } from "@/components/version-tracker";

export function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-600">© 2025 mySafePlay™</span>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            Secure child tracking and safety platform
          </div>
        </div>
      </div>
      
      {/* Version Information */}
      <VersionTracker placement="footer" />
    </footer>
  );
}
