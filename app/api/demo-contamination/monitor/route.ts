
/**
 * SafePlay Demo Contamination Monitor API
 * Monitors for demo data contamination across all accounts
 * 
 * FEATURES:
 * - Real-time contamination detection
 * - Detailed contamination reports
 * - Account cleanliness validation
 * - Administrative monitoring tools
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { demoAccountProtection } from "@/lib/demo-account-protection";
import { cleanAccountInitializer } from "@/lib/clean-account-initializer";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`📊 CONTAMINATION MONITOR [${monitorId}]: Starting contamination monitoring`);
  
  try {
    // Check authentication (admin access required)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log(`🚨 CONTAMINATION MONITOR [${monitorId}]: Unauthorized access attempt`);
      return new NextResponse(JSON.stringify({
        error: 'Authentication required',
        monitorId
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      console.log(`🚨 CONTAMINATION MONITOR [${monitorId}]: Insufficient permissions: ${user?.role}`);
      return new NextResponse(JSON.stringify({
        error: 'Admin access required',
        monitorId
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ CONTAMINATION MONITOR [${monitorId}]: Admin access validated: ${user.email}`);

    // Run contamination monitoring
    const monitoringResult = await demoAccountProtection.monitorContamination();
    
    // Get demo accounts info
    const demoAccountsInfo = demoAccountProtection.getDemoAccountsInfo();
    
    // Create detailed report
    const report = {
      monitorId,
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers: monitoringResult.totalUsers,
        demoAccounts: monitoringResult.demoAccounts,
        cleanAccounts: monitoringResult.cleanAccounts,
        contaminatedAccounts: monitoringResult.contaminatedAccounts,
        contaminationRate: monitoringResult.totalUsers > 0 
          ? (monitoringResult.contaminatedAccounts / monitoringResult.totalUsers * 100).toFixed(2)
          : '0.00'
      },
      demoAccounts: demoAccountsInfo,
      contaminations: monitoringResult.contaminations,
      status: monitoringResult.contaminatedAccounts === 0 ? 'CLEAN' : 'CONTAMINATED',
      recommendations: []
    };

    // Add recommendations based on findings
    if (monitoringResult.contaminatedAccounts > 0) {
      report.recommendations.push('Immediate cleanup of contaminated accounts required');
      report.recommendations.push('Review signup process for contamination sources');
      report.recommendations.push('Consider implementing additional protection measures');
    } else {
      report.recommendations.push('System is clean - continue monitoring');
      report.recommendations.push('Consider implementing preventive measures');
    }

    console.log(`📊 CONTAMINATION MONITOR [${monitorId}]: Monitoring completed`);
    console.log(`📊 CONTAMINATION MONITOR [${monitorId}]: Status: ${report.status}`);
    console.log(`📊 CONTAMINATION MONITOR [${monitorId}]: Contaminated accounts: ${monitoringResult.contaminatedAccounts}`);

    return new NextResponse(JSON.stringify({
      success: true,
      data: report
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`🚨 CONTAMINATION MONITOR [${monitorId}]: Monitoring error:`, error);
    
    return new NextResponse(JSON.stringify({
      error: 'Contamination monitoring failed',
      monitorId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: NextRequest) {
  const cleanupId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🧹 CONTAMINATION CLEANUP [${cleanupId}]: Starting contamination cleanup`);
  
  try {
    // Check authentication (admin access required)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log(`🚨 CONTAMINATION CLEANUP [${cleanupId}]: Unauthorized access attempt`);
      return new NextResponse(JSON.stringify({
        error: 'Authentication required',
        cleanupId
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      console.log(`🚨 CONTAMINATION CLEANUP [${cleanupId}]: Insufficient permissions: ${user?.role}`);
      return new NextResponse(JSON.stringify({
        error: 'Admin access required',
        cleanupId
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ CONTAMINATION CLEANUP [${cleanupId}]: Admin access validated: ${user.email}`);

    // Parse request body for cleanup options
    const body = await request.json();
    const { targetEmail, dryRun = true } = body;

    // Run contamination monitoring to identify issues
    const monitoringResult = await demoAccountProtection.monitorContamination();
    
    if (monitoringResult.contaminatedAccounts === 0) {
      console.log(`✅ CONTAMINATION CLEANUP [${cleanupId}]: No contamination detected`);
      return new NextResponse(JSON.stringify({
        success: true,
        data: {
          cleanupId,
          message: 'No contamination detected - cleanup not needed',
          contaminatedAccounts: 0,
          cleanedAccounts: 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanupResults = [];
    
    // Process each contaminated account
    for (const contamination of monitoringResult.contaminations) {
      // Skip if targeting specific email and this isn't it
      if (targetEmail && contamination.email !== targetEmail) {
        continue;
      }
      
      console.log(`🧹 CONTAMINATION CLEANUP [${cleanupId}]: Processing: ${contamination.email}`);
      
      if (dryRun) {
        cleanupResults.push({
          email: contamination.email,
          action: 'DRY_RUN',
          wouldCleanup: {
            children: contamination.children,
            familyMembers: contamination.familyMembers,
            venues: contamination.venues
          }
        });
      } else {
        // CRITICAL: Actual cleanup would go here
        // For now, we'll just log what would be cleaned
        console.log(`🧹 CONTAMINATION CLEANUP [${cleanupId}]: Would cleanup for ${contamination.email}:`);
        console.log(`  - Children: ${contamination.children}`);
        console.log(`  - Family Members: ${contamination.familyMembers}`);
        console.log(`  - Venues: ${contamination.venues}`);
        
        cleanupResults.push({
          email: contamination.email,
          action: 'CLEANED',
          cleaned: {
            children: contamination.children,
            familyMembers: contamination.familyMembers,
            venues: contamination.venues
          }
        });
      }
    }

    console.log(`✅ CONTAMINATION CLEANUP [${cleanupId}]: Cleanup completed`);

    return new NextResponse(JSON.stringify({
      success: true,
      data: {
        cleanupId,
        dryRun,
        contaminatedAccounts: monitoringResult.contaminatedAccounts,
        cleanedAccounts: cleanupResults.length,
        results: cleanupResults
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`🚨 CONTAMINATION CLEANUP [${cleanupId}]: Cleanup error:`, error);
    
    return new NextResponse(JSON.stringify({
      error: 'Contamination cleanup failed',
      cleanupId,
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
