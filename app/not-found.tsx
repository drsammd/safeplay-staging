"use client";

import Link from 'next/link';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function NotFound() {
  const commonPages = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Parent Dashboard', href: '/parent', icon: HelpCircle },
    { name: 'Venue Admin', href: '/venue-admin', icon: HelpCircle },
    { name: 'Contact Us', href: '/contact', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6">
            <img 
              src="/logos/safeplay_combined_logo.png" 
              alt="SafePlay" 
              className="h-16 mx-auto"
            />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            The page you're looking for doesn't exist or may have been moved. 
            Let's get you back to safety with SafePlay.
          </p>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search SafePlay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="Search for features, documentation, or help..." 
                className="flex-1"
              />
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {commonPages.map((page, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-12"
                  asChild
                >
                  <Link href={page.href}>
                    <page.icon className="h-4 w-4 mr-2" />
                    {page.name}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-0 shadow-lg bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <HelpCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you believe this is an error or need assistance, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/docs">
                    View Documentation
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Go Back */}
        <div className="text-center">
          <Button
            variant="default"
            size="lg"
            onClick={() => typeof window !== 'undefined' && window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
