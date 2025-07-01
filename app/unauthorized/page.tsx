
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Shield className="h-20 w-20 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-lg text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What happened?</h2>
          <p className="text-gray-600 mb-6">
            This page requires specific permissions that your account doesn't have. 
            Please contact an administrator if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go to Homepage</span>
            </Link>
            
            <Link
              href="/auth/signin"
              className="w-full btn-secondary flex items-center justify-center"
            >
              Sign in with different account
            </Link>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Need help? Contact support at support@safeplay.com</p>
        </div>
      </div>
    </div>
  );
}
