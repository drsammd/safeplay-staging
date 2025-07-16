
/**
 * SafePlay Session Validation API
 * Provides endpoint to validate session integrity and prevent contamination
 * 
 * FIXES:
 * - Session validation endpoint
 * - User context verification
 * - Authentication state checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { authSessionManager } from '@/lib/auth-session-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 SESSION VALIDATION API: Validating session...');
    
    const authContext = await authSessionManager.getAuthenticatedUser(request);
    
    if (!authContext) {
      console.log('❌ SESSION VALIDATION API: No valid authentication context');
      return NextResponse.json({ 
        valid: false, 
        error: 'No valid session found' 
      }, { status: 401 });
    }

    console.log('✅ SESSION VALIDATION API: Session validation successful:', {
      userId: authContext.user.id,
      email: authContext.user.email,
      role: authContext.user.role
    });

    return NextResponse.json({
      valid: true,
      user: {
        id: authContext.user.id,
        email: authContext.user.email,
        name: authContext.user.name,
        role: authContext.user.role,
        phoneVerified: authContext.user.phoneVerified,
        identityVerified: authContext.user.identityVerified,
        twoFactorEnabled: authContext.user.twoFactorEnabled,
        verificationLevel: authContext.user.verificationLevel,
      },
      session: {
        expires: authContext.session.expires,
        isValid: authContext.session.isValid,
        source: authContext.session.source
      },
      metadata: authContext.metadata
    });

  } catch (error) {
    console.error('❌ SESSION VALIDATION API: Error validating session:', error);
    
    return NextResponse.json({
      valid: false,
      error: 'Session validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 SESSION VALIDATION API: Detailed session validation...');
    
    const { userId, email, operationContext } = await request.json();
    
    if (!userId || !email) {
      return NextResponse.json({
        valid: false,
        error: 'Missing required validation parameters'
      }, { status: 400 });
    }

    // Validate user context
    const isValidUser = await authSessionManager.validateUserForStripe(userId, email, '');
    
    if (!isValidUser) {
      console.error('❌ SESSION VALIDATION API: User context validation failed');
      return NextResponse.json({
        valid: false,
        error: 'User context validation failed'
      }, { status: 400 });
    }

    // Validate session consistency
    const isConsistent = await authSessionManager.validateSessionConsistency(userId, operationContext || 'manual_validation');
    
    if (!isConsistent) {
      console.error('❌ SESSION VALIDATION API: Session consistency validation failed');
      return NextResponse.json({
        valid: false,
        error: 'Session consistency validation failed'
      }, { status: 400 });
    }

    console.log('✅ SESSION VALIDATION API: Detailed validation successful');
    
    return NextResponse.json({
      valid: true,
      userValidation: true,
      sessionConsistency: true,
      operationContext: operationContext || 'manual_validation'
    });

  } catch (error) {
    console.error('❌ SESSION VALIDATION API: Error in detailed validation:', error);
    
    return NextResponse.json({
      valid: false,
      error: 'Detailed session validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
