
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, dashboardUrl } = body;

    if (!role || !dashboardUrl) {
      return NextResponse.json({
        success: false,
        error: 'Role and dashboard URL are required'
      });
    }

    console.log('🚨 Creating emergency session for role:', role);

    // Find a demo user with the specified role
    const demoUser = await prisma.user.findFirst({
      where: {
        role: role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneVerified: true,
        identityVerified: true,
        twoFactorEnabled: true,
        verificationLevel: true
      }
    });

    if (!demoUser) {
      return NextResponse.json({
        success: false,
        error: `No demo user found with role: ${role}. Please create demo accounts first.`
      });
    }

    // Create a simple session object (this would normally be handled by NextAuth)
    const sessionData = {
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        phoneVerified: demoUser.phoneVerified,
        identityVerified: demoUser.identityVerified,
        twoFactorEnabled: demoUser.twoFactorEnabled,
        verificationLevel: demoUser.verificationLevel
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      sessionToken: `emergency_${Date.now()}_${Math.random().toString(36)}`
    };

    console.log('✅ Emergency session created:', {
      userId: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
      dashboardUrl
    });

    // In a real implementation, you would:
    // 1. Create a session record in the database
    // 2. Set secure HTTP-only cookies
    // 3. Return session information

    // For now, we'll return success and let the frontend handle the redirect
    return NextResponse.json({
      success: true,
      message: `Emergency session created for ${role}`,
      session: sessionData,
      redirectUrl: dashboardUrl,
      user: demoUser
    });

  } catch (error) {
    console.error('❌ Emergency session creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
