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
      demoUser = await prisma.user.findUnique({
        where: { email: 'parent@mysafeplay.ai' }
      });
      
      if (!demoUser) {
        console.log('⚠️ Demo user not found, will require manual login');
      }
    } catch (error) {
      console.error('❌ Error fetching demo user:', error);
    }

    // Set secure cookies
    const response = NextResponse.json({ 
      success: true, 
      autoAuthenticated: !!demoUser,
      redirectTo: demoUser ? '/parent' : '/'
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
        const jwt = await encode({
          token: {
            sub: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
            phoneVerified: demoUser.phoneVerified,
            identityVerified: demoUser.identityVerified,
            twoFactorEnabled: demoUser.twoFactorEnabled,
            verificationLevel: demoUser.verificationLevel,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
          },
          secret: process.env.NEXTAUTH_SECRET!
        });

        response.cookies.set('next-auth.session-token', jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/'
        });

        console.log('✅ Auto-authenticated stakeholder into demo account:', demoUser.email);
      } catch (error) {
        console.error('❌ Error creating NextAuth session:', error);
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
