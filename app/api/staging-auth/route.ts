import { NextRequest, NextResponse } from 'next/server';
import { 
  STAGING_PASSWORD, 
  createStakeholderSession, 
  STAKEHOLDER_SESSION_COOKIE,
  isRateLimited 
} from '@/lib/staging-auth';
import { prisma } from '@/lib/db';
import { encode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password, rememberMe } = body;

    // Validate password
    if (!password || password !== STAGING_PASSWORD) {
      console.log(`❌ Stakeholder auth failed for IP: ${ip}`);
      return NextResponse.json(
        { success: false, message: 'Invalid access credentials.' },
        { status: 401 }
      );
    }

    // Create stakeholder session
    const sessionData = createStakeholderSession(request, rememberMe);
    
    console.log(`✅ Stakeholder authenticated for IP: ${ip}, Remember: ${rememberMe}`);

    // Auto-authenticate into demo account to eliminate double credential entry
    let demoUser;
    try {
      // Try both demo accounts for better flexibility
      demoUser = await prisma.user.findFirst({
        where: { 
          email: { 
            in: ['parent@mysafeplay.ai', 'john@mysafeplay.ai'] 
          }
        }
      });
      
      if (!demoUser) {
        console.log('⚠️ No demo users found, will require manual login');
      } else {
        console.log('✅ Found demo user for auto-authentication:', demoUser.email);
      }
    } catch (error) {
      console.error('❌ Error fetching demo user:', error);
    }

    // Set secure cookies
    const response = NextResponse.json({ 
      success: true, 
      autoAuthenticated: !!demoUser,
      redirectTo: demoUser ? '/parent' : '/',
      message: demoUser ? `Auto-authenticated as ${demoUser.name}` : 'Stakeholder access granted'
    });
    
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours
    
    // Set stakeholder session cookie
    response.cookies.set(STAKEHOLDER_SESSION_COOKIE, sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/'
    });

    // Auto-authenticate with NextAuth if demo user exists
    if (demoUser) {
      try {
        const tokenPayload = {
          sub: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          phoneVerified: demoUser.phoneVerified || false,
          identityVerified: demoUser.identityVerified || false,
          twoFactorEnabled: demoUser.twoFactorEnabled || false,
          verificationLevel: demoUser.verificationLevel || 'UNVERIFIED',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
        };

        const jwt = await encode({
          token: tokenPayload,
          secret: process.env.NEXTAUTH_SECRET!
        });

        // Set NextAuth session token with proper configuration
        response.cookies.set('next-auth.session-token', jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/'
        });

        // Also set legacy session token for compatibility
        response.cookies.set('__Secure-next-auth.session-token', jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/'
        });

        console.log('✅ Auto-authenticated stakeholder into demo account:', demoUser.email);
        console.log('✅ Session token set for auto-authentication');
      } catch (error) {
        console.error('❌ Error creating NextAuth session:', error);
        // Continue without failing the stakeholder auth
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Staging auth error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Logout endpoint
  const response = NextResponse.json({ success: true });
  response.cookies.delete(STAKEHOLDER_SESSION_COOKIE);
  return response;
}
