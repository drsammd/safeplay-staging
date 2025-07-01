
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    console.log("🛡️ Middleware: Processing request:", { 
      pathname,
      hasToken: !!token,
      tokenRole: token?.role,
      tokenRoleType: typeof token?.role,
      tokenSub: token?.sub 
    });

    // Allow access to auth pages
    if (pathname.startsWith("/auth")) {
      console.log("🛡️ Middleware: Allowing auth page access");
      return;
    }

    // Protect admin routes
    if (pathname.startsWith("/admin")) {
      console.log("🛡️ Middleware: Checking admin access:", { 
        tokenRole: token?.role, 
        requiredRole: "COMPANY_ADMIN",
        isMatch: token?.role === "COMPANY_ADMIN",
        strictEqual: token?.role !== "COMPANY_ADMIN" 
      });
      
      if (token?.role !== "COMPANY_ADMIN") {
        console.log("❌ Middleware: DENYING admin access - redirecting to unauthorized");
        return Response.redirect(new URL("/unauthorized", req.url));
      }
      console.log("✅ Middleware: ALLOWING admin access");
    }

    // Protect venue admin routes
    if (pathname.startsWith("/venue-admin")) {
      console.log("🛡️ Middleware: Checking venue admin access:", { 
        tokenRole: token?.role, 
        requiredRole: "VENUE_ADMIN" 
      });
      
      if (token?.role !== "VENUE_ADMIN") {
        console.log("❌ Middleware: DENYING venue admin access");
        return Response.redirect(new URL("/unauthorized", req.url));
      }
      console.log("✅ Middleware: ALLOWING venue admin access");
    }

    // Protect parent routes
    if (pathname.startsWith("/parent")) {
      console.log("🛡️ Middleware: Checking parent access:", { 
        tokenRole: token?.role, 
        requiredRole: "PARENT" 
      });
      
      if (token?.role !== "PARENT") {
        console.log("❌ Middleware: DENYING parent access");
        return Response.redirect(new URL("/unauthorized", req.url));
      }
      console.log("✅ Middleware: ALLOWING parent access");
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
          pathname === "/testimonials"
        ) {
          return true;
        }
        
        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logos|sections|backgrounds|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};
