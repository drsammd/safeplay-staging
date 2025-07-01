
import { NextRequest, NextResponse } from 'next/server';
import { 
  STAGING_PASSWORD, 
  createStakeholderSession, 
  STAKEHOLDER_SESSION_COOKIE,
  isRateLimited 
} from '@/lib/staging-auth';

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

    // Create session
    const sessionData = createStakeholderSession(request, rememberMe);
    
    console.log(`✅ Stakeholder authenticated for IP: ${ip}, Remember: ${rememberMe}`);

    // Set secure cookie
    const response = NextResponse.json({ success: true });
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours
    
    response.cookies.set(STAKEHOLDER_SESSION_COOKIE, sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/'
    });

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
