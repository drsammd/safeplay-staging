
/**
 * SafePlay Demo Contamination Validation API
 * Validates individual accounts for contamination
 * 
 * FEATURES:
 * - Individual account validation
 * - Detailed contamination analysis
 * - Account cleanliness reports
 * - User-specific validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoAccountProtection } from "@/lib/demo-account-protection";
import { cleanAccountInitializer } from "@/lib/clean-account-initializer";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const validationId = `validate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 CONTAMINATION VALIDATION [${validationId}]: Starting account validation`);
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log(`🚨 CONTAMINATION VALIDATION [${validationId}]: Unauthorized access attempt`);
      return new NextResponse(JSON.stringify({
        error: 'Authentication required',
        validationId
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      console.log(`🚨 CONTAMINATION VALIDATION [${validationId}]: User not found: ${session.user.id}`);
      return new NextResponse(JSON.stringify({
        error: 'User not found',
        validationId
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ CONTAMINATION VALIDATION [${validationId}]: Validating user: ${user.email}`);

    // Check if this is a demo account
    const isDemoAccount = demoAccountProtection.isDemoAccount(user.email);
    const allowsDemoData = demoAccountProtection.allowsDemoData(user.email);

    // Validate contamination
    const hasNoContamination = await demoAccountProtection.validateNoContamination(
      user.id,
      user.email
    );

    // Validate account cleanliness
    const cleanlinessValidation = await cleanAccountInitializer.validateAccountCleanliness(
      user.id,
      user.email
    );

    // Get account data counts
    const childrenCount = await prisma.child.count({
      where: { parentId: user.id }
    });
    
    const familyMembersCount = await prisma.familyMember.count({
      where: { familyId: user.id }
    });
    
    const venuesCount = await prisma.venue.count({
      where: { adminId: user.id }
    });

    const subscriptionCount = await prisma.userSubscription.count({
      where: { userId: user.id }
    });

    const legalAgreementCount = await prisma.legalAgreement.count({
      where: { userId: user.id }
    });

    // Create validation report
    const report = {
      validationId,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      accountType: {
        isDemoAccount,
        allowsDemoData,
        expectedToHaveData: isDemoAccount && allowsDemoData,
        accountCategory: isDemoAccount ? 'DEMO' : 'REAL_USER'
      },
      dataCounts: {
        children: childrenCount,
        familyMembers: familyMembersCount,
        venues: venuesCount,
        subscriptions: subscriptionCount,
        legalAgreements: legalAgreementCount
      },
      validation: {
        hasNoContamination,
        cleanlinessValidation,
        isClean: cleanlinessValidation.isClean,
        hasRequiredData: subscriptionCount > 0 && legalAgreementCount > 0
      },
      status: 'UNKNOWN',
      issues: [] as string[],
      warnings: [] as string[]
    };

    // Determine overall status
    if (isDemoAccount) {
      if (allowsDemoData) {
        report.status = 'DEMO_ACCOUNT_WITH_DATA';
        report.warnings.push('Demo account - data expected');
      } else {
        report.status = 'DEMO_ACCOUNT_CLEAN';
        report.warnings.push('Demo account - intentionally clean');
      }
    } else {
      // Real user account
      if (hasNoContamination && cleanlinessValidation.isClean) {
        report.status = 'CLEAN';
      } else {
        report.status = 'CONTAMINATED';
        
        if (!hasNoContamination) {
          report.issues.push('Account has demo data contamination');
        }
        
        if (!cleanlinessValidation.isClean) {
          report.issues.push(...cleanlinessValidation.issues);
        }
      }
    }

    // Add warnings from cleanliness validation
    if (cleanlinessValidation.warnings.length > 0) {
      report.warnings.push(...cleanlinessValidation.warnings);
    }

    console.log(`📊 CONTAMINATION VALIDATION [${validationId}]: Validation completed`);
    console.log(`📊 CONTAMINATION VALIDATION [${validationId}]: Status: ${report.status}`);

    return new NextResponse(JSON.stringify({
      success: true,
      data: report
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`🚨 CONTAMINATION VALIDATION [${validationId}]: Validation error:`, error);
    
    return new NextResponse(JSON.stringify({
      error: 'Account validation failed',
      validationId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
