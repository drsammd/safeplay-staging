
import Link from 'next/link';
import { WifiOff, RefreshCw, Home, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6">
            <img 
              src="/logos/safeplay_combined_logo.png" 
              alt="SafePlay" 
              className="h-16 mx-auto"
            />
          </div>
          <div className="mb-4 mx-auto h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Offline</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            SafePlay requires an internet connection to keep your children safe. 
            Please check your connection and try again.
          </p>
        </div>

        {/* Connection Status */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Signal className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                <strong>No Internet Connection</strong>
                <br />
                SafePlay's real-time safety features require an active internet connection.
                Some cached data may be available, but safety monitoring is currently unavailable.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Check your internet connection</h4>
                  <p className="text-sm text-gray-600">Make sure your WiFi or mobile data is enabled and working.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Try refreshing the page</h4>
                  <p className="text-sm text-gray-600">Sometimes a simple refresh can restore your connection.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Check your router or mobile signal</h4>
                  <p className="text-sm text-gray-600">Ensure your router is working or you have sufficient mobile signal strength.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => typeof window !== 'undefined' && window.location.reload()}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                <strong>Safety Notice:</strong> While offline, real-time child tracking and safety alerts are not available. 
                Please ensure internet connectivity is restored as soon as possible for full SafePlay protection.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            SafePlay v2.0 • Offline Mode
          </p>
        </div>
      </div>
    </div>
  );
}
