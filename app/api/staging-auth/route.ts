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
      demoUser: demoUser ? {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role
      } : null,
      redirectTo: '/', // Always redirect to home page
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

    // For single sign-on, we'll redirect to a special endpoint that auto-signs in
    if (demoUser) {
      try {
        // Store demo user info in a temporary secure token for auto-signin
        const autoSigninToken = await encode({
          token: {
            autoSignin: true,
            userId: demoUser.id,
            email: demoUser.email,
            exp: Math.floor(Date.now() / 1000) + (60 * 5) // 5 minutes expiry
          },
          secret: process.env.NEXTAUTH_SECRET!
        });

        // Set temporary auto-signin cookie
        response.cookies.set('auto-signin-token', autoSigninToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 5, // 5 minutes
          path: '/'
        });

        console.log('✅ Auto-signin token created for:', demoUser.email);
      } catch (error) {
        console.error('❌ Error creating auto-signin token:', error);
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
