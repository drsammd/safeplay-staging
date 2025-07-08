
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { decode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if user is already authenticated
    const session = await getServerSession(authOptions);
    if (session?.user) {
      console.log('✅ User already authenticated, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check for auto-signin token
    const autoSigninToken = request.cookies.get('auto-signin-token')?.value;
    
    if (!autoSigninToken) {
      console.log('❌ No auto-signin token found, redirecting to signin');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    try {
      // Decode and validate the auto-signin token
      const tokenData = await decode({
        token: autoSigninToken,
        secret: process.env.NEXTAUTH_SECRET!
      });

      if (!tokenData?.autoSignin || !tokenData?.userId || !tokenData?.email) {
        console.log('❌ Invalid auto-signin token structure');
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      // Check if token is not expired
      if (tokenData.exp && tokenData.exp <= Math.floor(Date.now() / 1000)) {
        console.log('⏰ Auto-signin token expired');
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: tokenData.userId as string }
      });

      if (!user) {
        console.log('❌ User not found for auto-signin token');
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      console.log('✅ Valid auto-signin token found for:', user.email);

      // Create a response that will redirect to NextAuth signin 
      // The existing authorize function will detect the auto-signin token
      const signinUrl = new URL('/api/auth/signin', request.url);
      signinUrl.searchParams.set('callbackUrl', '/');
      
      // Clear the auto-signin token since it's been used
      const response = NextResponse.redirect(signinUrl);
      response.cookies.delete('auto-signin-token');
      
      return response;

    } catch (error) {
      console.error('❌ Error decoding auto-signin token:', error);
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

  } catch (error) {
    console.error('❌ Auto-signin route error:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
