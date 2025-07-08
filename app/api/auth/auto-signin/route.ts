
import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/parent';
    
    console.log('🔄 Auto-signin requested, checking for auto-signin token...');
    
    // Check for auto-signin token from staging-auth
    const autoSigninToken = request.cookies.get('auto-signin-token')?.value;
    
    if (autoSigninToken) {
      console.log('✅ Auto-signin token found, redirecting to signin with auto-login');
      
      // Create a special signin page that auto-submits
      const autoSigninUrl = `/auth/signin?auto=true&token=${autoSigninToken}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      
      return NextResponse.redirect(new URL(autoSigninUrl, request.url));
    } else {
      console.log('❌ No auto-signin token found, redirecting to normal signin');
      
      // Fallback to normal signin
      const signinUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      
      return NextResponse.redirect(new URL(signinUrl, request.url));
    }
  } catch (error) {
    console.error('❌ Auto-signin error:', error);
    
    // Fallback to normal signin on error
    const signinUrl = `/auth/signin?callbackUrl=/parent`;
    return NextResponse.redirect(new URL(signinUrl, request.url));
  }
}
