import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { 
  isValidStakeholderSession, 
  isBotRequest, 
  isRateLimited,
  BOT_USER_AGENTS 
} from "@/lib/staging-auth";
import { addSecurityHeaders } from "@/lib/security-headers";

// Stakeholder authentication middleware (runs FIRST)
function stakeholderAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get client IP for logging and rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  console.log("🛡️ Stakeholder Auth v0.5.1: Processing request:", { 
    pathname, 
    ip: ip.substring(0, 8) + "...", // Partial IP for privacy
    userAgent: userAgent.substring(0, 50) + "..." 
  });

  // Bot protection - Block known bots immediately
  if (isBotRequest(request)) {
    console.log("🤖 Stakeholder Auth: BLOCKING bot request:", userAgent);
    return new NextResponse('Forbidden', { 
      status: 403,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }

  // Rate limiting protection
  if (isRateLimited(ip)) {
    console.log("⚠️ Stakeholder Auth: RATE LIMITED:", ip);
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '300', // 5 minutes
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + 300000).toString(),
      }
    });
  }

  // Allow staging auth page and API
  if (pathname === '/staging-auth' || pathname.startsWith('/api/staging-auth')) {
    console.log("🛡️ Stakeholder Auth: Allowing staging auth access");
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Allow debug endpoints for diagnostics (no auth required)
  if (pathname.startsWith('/api/debug/')) {
    console.log("🔧 Stakeholder Auth: Allowing debug endpoint access:", pathname);
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Check stakeholder session for all other routes
  if (!isValidStakeholderSession(request)) {
    console.log("❌ Stakeholder Auth: DENYING access - no valid session, redirecting to staging auth");
    const redirectResponse = NextResponse.redirect(new URL('/staging-auth', request.url));
    return addSecurityHeaders(redirectResponse);
  }

  console.log("✅ Stakeholder Auth: Valid session found, proceeding to app");
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}



// Combined middleware - stakeholder auth first, then NextAuth
const combinedMiddleware = withAuth(
  function middleware(req) {
    // This will only run after NextAuth has validated the session
    // The stakeholder auth check happens first in the main middleware function
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    console.log("🛡️ NextAuth: Processing request:", { 
      pathname,
      hasToken: !!token,
      tokenRole: token?.role,
      tokenRoleType: typeof token?.role,
      tokenSub: token?.sub 
    });

    // Allow access to auth pages
    if (pathname.startsWith("/auth")) {
      console.log("🛡️ NextAuth: Allowing auth page access");
      return;
    }

    // Protect admin routes
    if (pathname.startsWith("/admin")) {
      console.log("🛡️ NextAuth: Checking admin access:", { 
        tokenRole: token?.role, 
        requiredRoles: ["COMPANY_ADMIN", "SUPER_ADMIN"],
        isMatch: token?.role === "COMPANY_ADMIN" || token?.role === "SUPER_ADMIN"
      });
      
      if (token?.role !== "COMPANY_ADMIN" && token?.role !== "SUPER_ADMIN") {
        console.log("❌ NextAuth: DENYING admin access - redirecting to unauthorized");
        return Response.redirect(new URL("/unauthorized", req.url));
      }
      console.log("✅ NextAuth: ALLOWING admin access");
    }

    // Protect venue admin routes
    if (pathname.startsWith("/venue-admin")) {
      console.log("🛡️ NextAuth: Checking venue admin access:", { 
        tokenRole: token?.role, 
        requiredRole: "VENUE_ADMIN" 
      });
      
      if (token?.role !== "VENUE_ADMIN") {
        console.log("❌ NextAuth: DENYING venue admin access");
        return Response.redirect(new URL("/unauthorized", req.url));
      }
      console.log("✅ NextAuth: ALLOWING venue admin access");
    }

    // Protect parent routes
    if (pathname.startsWith("/parent")) {
      console.log("🛡️ NextAuth: Checking parent access:", { 
        tokenRole: token?.role, 
        requiredRole: "PARENT" 
      });
      
      if (token?.role !== "PARENT") {
        console.log("❌ NextAuth: DENYING parent access");
        return Response.redirect(new URL("/unauthorized", req.url));
      }
      console.log("✅ NextAuth: ALLOWING parent access");
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (
          pathname === "/" || 
          pathname.startsWith("/auth") ||
          pathname === "/contact" ||
          pathname === "/faq" ||
          pathname === "/testimonials" ||
          pathname === "/staging-auth" ||
          pathname.startsWith("/api/staging-auth") ||
          pathname.startsWith("/api/debug/")
        ) {
          return true;
        }
        
        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export default function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED: Stakeholder authentication for testing
  // const stakeholderResponse = stakeholderAuthMiddleware(request);
  // if (stakeholderResponse.status !== 200) {
  //   return stakeholderResponse;
  // }

  // Run NextAuth middleware only
  // @ts-ignore - NextAuth middleware has complex typing
  return combinedMiddleware(request, {} as any);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logos|sections|backgrounds|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};