
/**
 * SafePlay Fixed Middleware
 * Addresses authentication middleware issues and improves security
 * 
 * FIXES:
 * - Better session validation
 * - Improved error handling
 * - Enhanced security headers
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    console.log(`🔒 FIXED MIDDLEWARE: ${req.method} ${req.url}`);
    
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Log authentication status
    if (token) {
      console.log(`✅ FIXED MIDDLEWARE: Authenticated user: ${token.email}`);
    } else {
      console.log(`❌ FIXED MIDDLEWARE: No authentication token`);
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow public paths
        if (pathname.startsWith('/api/auth/') || 
            pathname.startsWith('/auth/') ||
            pathname === '/' ||
            pathname.startsWith('/public/') ||
            pathname.startsWith('/_next/') ||
            pathname.startsWith('/api/health') ||
            pathname.startsWith('/api/version')) {
          return true;
        }

        // Require authentication for all other paths
        if (!token) {
          console.log(`🔒 FIXED MIDDLEWARE: Access denied to ${pathname} - no token`);
          return false;
        }

        console.log(`✅ FIXED MIDDLEWARE: Access granted to ${pathname} for user: ${token.email}`);
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/health|api/version|_next/static|_next/image|favicon.ico).*)',
  ],
};
