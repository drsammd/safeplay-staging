
import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { signIn } from 'next-auth/react';

export async function POST(request: NextRequest) {
  try {
    // Get the auto-signin token from cookies
    const autoSigninToken = request.cookies.get('auto-signin-token')?.value;
    
    if (!autoSigninToken) {
      return NextResponse.json({ success: false, error: 'No auto-signin token found' }, { status: 401 });
    }

    // Decode the token
    const tokenData = await decode({
      token: autoSigninToken,
      secret: process.env.NEXTAUTH_SECRET!
    });

    if (!tokenData || !tokenData.autoSignin || !tokenData.userId) {
      return NextResponse.json({ success: false, error: 'Invalid auto-signin token' }, { status: 401 });
    }

    // Check if token is expired
    if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ success: false, error: 'Auto-signin token expired' }, { status: 401 });
    }

    // Return the user info for frontend to handle signin
    const response = NextResponse.json({ 
      success: true, 
      user: {
        email: tokenData.email,
        userId: tokenData.userId
      }
    });

    // Clear the auto-signin token as it's single use
    response.cookies.set('auto-signin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('❌ Auto-signin error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
