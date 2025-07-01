
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mb-6">
          <img 
            src="/logos/safeplay_combined_logo.png" 
            alt="SafePlay" 
            className="h-16 mx-auto"
          />
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">Loading SafePlay...</span>
        </div>
        
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Please wait while we prepare your secure child safety dashboard
        </p>
        
        <div className="mt-8">
          <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
