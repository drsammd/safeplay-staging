
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface DemoAccount {
  email: string;
  name: string;
  role: 'COMPANY_ADMIN' | 'VENUE_ADMIN' | 'PARENT';
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accounts }: { accounts: DemoAccount[] } = body;

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid accounts data provided',
        results: [],
        deletedCount: 0
      });
    }

    console.log('🚀 Starting force demo account creation...');

    // Step 1: Delete existing demo accounts
    const demoEmails = accounts.map(acc => acc.email.toLowerCase());
    
    const deleteResult = await prisma.user.deleteMany({
      where: {
        email: {
          in: demoEmails
        }
      }
    });

    console.log(`🗑️  Deleted ${deleteResult.count} existing demo accounts`);

    // Step 2: Create new demo accounts
    const results = [];
    
    for (const account of accounts) {
      try {
        console.log(`👤 Creating account: ${account.email}`);
        
        // Hash password using same method as NextAuth
        const hashedPassword = await bcrypt.hash(account.password, 12);
        
        const user = await prisma.user.create({
          data: {
            email: account.email.toLowerCase().trim(),
            name: account.name,
            role: account.role,
            password: hashedPassword,
            phoneVerified: true, // Make demo accounts fully verified
            identityVerified: true,
            verificationLevel: 'VERIFIED',
            twoFactorEnabled: false, // Disable 2FA for easy testing
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`✅ Successfully created: ${user.email} (${user.role})`);

        results.push({
          email: account.email,
          name: account.name,
          role: account.role,
          password: account.password,
          success: true
        });

      } catch (error) {
        console.error(`❌ Failed to create ${account.email}:`, error);
        
        results.push({
          email: account.email,
          name: account.name,
          role: account.role,
          password: account.password,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    console.log(`🎉 Demo account creation complete: ${successCount}/${accounts.length} successful`);

    return NextResponse.json({
      success: successCount > 0,
      results,
      deletedCount: deleteResult.count,
      message: `Created ${successCount} demo accounts, deleted ${deleteResult.count} existing accounts`
    });

  } catch (error) {
    console.error('❌ Force create demo accounts error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: [],
      deletedCount: 0
    });
  }
}
