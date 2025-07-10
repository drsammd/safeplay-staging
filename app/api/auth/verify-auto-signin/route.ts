
import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Decode the auto-signin token
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!decoded || !decoded.autoSignin || !decoded.userId) {
      console.log('❌ Invalid auto-signin token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Auto-signin token expired');
      return NextResponse.json(
        { success: false, error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.log('❌ User not found for auto-signin token');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Auto-signin token verified for user:', user.email);

    // Return user info for auto-signin
    // Note: We don't return the actual password for security
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        // For demo users, we'll use a known password
        password: user.email.includes('mysafeplay.ai') ? 'demo123' : undefined,
      },
    });

  } catch (error) {
    console.error('❌ Auto-signin verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
