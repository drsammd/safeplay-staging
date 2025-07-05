
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface TestStep {
  step: string;
  status: 'success' | 'error' | 'info';
  message: string;
  data?: any;
}

export async function POST(request: Request) {
  const steps: TestStep[] = [];
  
  try {
    const body = await request.json();
    const { email, password } = body;

    steps.push({
      step: 'Input Validation',
      status: 'info',
      message: `Testing authentication for email: ${email}`
    });

    if (!email || !password) {
      steps.push({
        step: 'Input Validation',
        status: 'error',
        message: 'Email and password are required'
      });
      
      return NextResponse.json({
        success: false,
        steps,
        error: 'Missing email or password'
      });
    }

    // Step 1: Database Connection Test
    try {
      await prisma.$queryRaw`SELECT 1`;
      steps.push({
        step: 'Database Connection',
        status: 'success',
        message: 'Successfully connected to database'
      });
    } catch (dbError) {
      steps.push({
        step: 'Database Connection',
        status: 'error',
        message: `Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      });
      
      return NextResponse.json({
        success: false,
        steps,
        error: 'Database connection failed'
      });
    }

    // Step 2: Email Normalization  
    const normalizedEmail = email.toLowerCase().trim();
    steps.push({
      step: 'Email Normalization',
      status: 'info',
      message: `Normalized email: ${normalizedEmail}`,
      data: { original: email, normalized: normalizedEmail }
    });

    // Step 3: User Lookup
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          password: true,
          twoFactorEnabled: true,
          phoneVerified: true,
          identityVerified: true,
          verificationLevel: true,
          createdAt: true
        }
      });

      if (!user) {
        steps.push({
          step: 'User Lookup',
          status: 'error',
          message: `No user found with email: ${normalizedEmail}`
        });

        // Check if similar emails exist
        const similarUsers = await prisma.user.findMany({
          where: {
            email: {
              contains: normalizedEmail.split('@')[0]
            }
          },
          select: { email: true }
        });

        if (similarUsers.length > 0) {
          steps.push({
            step: 'Similar Emails Found',
            status: 'info',
            message: 'Found similar email addresses in database',
            data: { similarEmails: similarUsers.map(u => u.email) }
          });
        }

        return NextResponse.json({
          success: false,
          steps,
          error: 'User not found'
        });
      }

      steps.push({
        step: 'User Lookup',
        status: 'success',
        message: `Found user: ${user.name} (${user.role})`,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          phoneVerified: user.phoneVerified,
          identityVerified: user.identityVerified,
          createdAt: user.createdAt
        }
      });

    } catch (userError) {
      steps.push({
        step: 'User Lookup',
        status: 'error',
        message: `User lookup failed: ${userError instanceof Error ? userError.message : 'Unknown error'}`
      });
      
      return NextResponse.json({
        success: false,
        steps,
        error: 'User lookup failed'
      });
    }

    // Step 4: Password Validation
    try {
      if (!user.password) {
        steps.push({
          step: 'Password Check',
          status: 'error',
          message: 'User has no password set in database'
        });
        
        return NextResponse.json({
          success: false,
          steps,
          error: 'No password set for user'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        steps.push({
          step: 'Password Validation',
          status: 'error',
          message: 'Password does not match stored hash',
          data: {
            providedPasswordLength: password.length,
            storedHashPrefix: user.password.substring(0, 20) + '...'
          }
        });
        
        return NextResponse.json({
          success: false,
          steps,
          error: 'Invalid password'
        });
      }

      steps.push({
        step: 'Password Validation',
        status: 'success',
        message: 'Password successfully verified against stored hash'
      });

    } catch (passwordError) {
      steps.push({
        step: 'Password Validation',
        status: 'error',
        message: `Password validation failed: ${passwordError instanceof Error ? passwordError.message : 'Unknown error'}`
      });
      
      return NextResponse.json({
        success: false,
        steps,
        error: 'Password validation error'
      });
    }

    // Step 5: Two-Factor Check
    if (user.twoFactorEnabled) {
      steps.push({
        step: 'Two-Factor Authentication',
        status: 'info',
        message: 'User has 2FA enabled - would require additional verification in real login'
      });
    } else {
      steps.push({
        step: 'Two-Factor Authentication',
        status: 'success',
        message: 'No 2FA required for this user'
      });
    }

    // Step 6: Final Success
    steps.push({
      step: 'Authentication Complete',
      status: 'success',
      message: 'All authentication checks passed successfully'
    });

    // Return success with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      steps,
      message: 'Authentication successful'
    });

  } catch (error) {
    steps.push({
      step: 'System Error',
      status: 'error',
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });

    console.error('❌ Test auth error:', error);
    
    return NextResponse.json({
      success: false,
      steps,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
