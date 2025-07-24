
/**
 * SafePlay Forgot Password API v1.5.40-alpha.13
 * 
 * FIXES:
 * - Creates missing forgot-password API endpoint
 * - Handles password reset request functionality
 * - Integrates with existing authentication system
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });

    // Always return success to prevent email enumeration
    // But only send email if user actually exists and is active
    if (user && user.isActive) {
      try {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExpiry
          }
        });

        // In a real application, you would send an email here
        // For now, we'll just log the reset token for testing
        console.log(`🔐 FORGOT PASSWORD: Reset token for ${user.email}: ${resetToken}`);
        console.log(`🔐 FORGOT PASSWORD: Reset link would be: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`);

        // TODO: Implement email sending
        // await sendPasswordResetEmail(user.email, user.name, resetToken);

      } catch (error) {
        console.error('🔐 FORGOT PASSWORD: Error generating reset token:', error);
        // Don't expose the error to the user
      }
    } else {
      console.log(`🔐 FORGOT PASSWORD: Password reset requested for non-existent or inactive user: ${normalizedEmail}`);
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive password reset instructions.'
    });

  } catch (error) {
    console.error('🔐 FORGOT PASSWORD: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
