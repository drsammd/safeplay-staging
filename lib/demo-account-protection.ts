
/**
 * SafePlay Demo Account Protection System
 * Prevents demo data contamination in production accounts
 * 
 * FEATURES:
 * - Strict demo account identification
 * - Prevention of demo data injection into real accounts
 * - Validation and monitoring for contamination
 * - Clean account initialization for new users
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from './db';

export interface DemoAccountInfo {
  email: string;
  name: string;
  role: string;
  isDemoAccount: boolean;
  allowsDemoData: boolean;
  description: string;
}

export class DemoAccountProtection {
  private static instance: DemoAccountProtection;
  
  // CRITICAL: These are the ONLY accounts that should have demo data
  private readonly DEMO_ACCOUNTS: Record<string, DemoAccountInfo> = {
    'admin@mysafeplay.ai': {
      email: 'admin@mysafeplay.ai',
      name: 'Sarah Mitchell',
      role: 'SUPER_ADMIN',
      isDemoAccount: true,
      allowsDemoData: true,
      description: 'Demo super admin account'
    },
    'parent@mysafeplay.ai': {
      email: 'parent@mysafeplay.ai', 
      name: 'Emily Johnson',
      role: 'PARENT',
      isDemoAccount: true,
      allowsDemoData: true,
      description: 'Demo parent account with children and family data'
    },
    'venue@mysafeplay.ai': {
      email: 'venue@mysafeplay.ai',
      name: 'John Smith', 
      role: 'VENUE_ADMIN',
      isDemoAccount: true,
      allowsDemoData: true,
      description: 'Demo venue admin account with venue data'
    },
    'john@mysafeplay.ai': {
      email: 'john@mysafeplay.ai',
      name: 'John Doe',
      role: 'PARENT',
      isDemoAccount: true,
      allowsDemoData: false, // Intentionally clean for security demo
      description: 'Demo parent account (intentionally clean for security enhancement demo)'
    }
  };

  public static getInstance(): DemoAccountProtection {
    if (!DemoAccountProtection.instance) {
      DemoAccountProtection.instance = new DemoAccountProtection();
    }
    return DemoAccountProtection.instance;
  }

  /**
   * CRITICAL: Check if an account is allowed to have demo data
   */
  public isDemoAccount(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    return this.DEMO_ACCOUNTS[normalizedEmail]?.isDemoAccount || false;
  }

  /**
   * CRITICAL: Check if an account is allowed to have demo data
   */
  public allowsDemoData(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    return this.DEMO_ACCOUNTS[normalizedEmail]?.allowsDemoData || false;
  }

  /**
   * CRITICAL: Validate that no demo data exists for non-demo accounts
   */
  public async validateNoContamination(userId: string, email: string): Promise<boolean> {
    const validationId = `validate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔍 DEMO PROTECTION [${validationId}]: Validating contamination for: ${email}`);
    
    try {
      const isDemoAccount = this.isDemoAccount(email);
      
      if (isDemoAccount) {
        console.log(`✅ DEMO PROTECTION [${validationId}]: Demo account - validation passed`);
        return true;
      }

      // Check for contamination in non-demo accounts
      const childrenCount = await prisma.child.count({
        where: { parentId: userId }
      });
      
      const familyMembersCount = await prisma.familyMember.count({
        where: { familyId: userId }
      });
      
      const venuesCount = await prisma.venue.count({
        where: { adminId: userId }
      });

      const hasContamination = childrenCount > 0 || familyMembersCount > 0 || venuesCount > 0;
      
      if (hasContamination) {
        console.error(`🚨 DEMO PROTECTION [${validationId}]: CONTAMINATION DETECTED!`);
        console.error(`🚨 DEMO PROTECTION [${validationId}]: ${email} has: Children=${childrenCount}, Family=${familyMembersCount}, Venues=${venuesCount}`);
        return false;
      }

      console.log(`✅ DEMO PROTECTION [${validationId}]: No contamination detected`);
      return true;

    } catch (error) {
      console.error(`❌ DEMO PROTECTION [${validationId}]: Validation error:`, error);
      return false;
    }
  }

  /**
   * CRITICAL: Ensure clean account initialization for new users
   */
  public async ensureCleanAccount(userId: string, email: string): Promise<boolean> {
    const cleanupId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🧹 DEMO PROTECTION [${cleanupId}]: Ensuring clean account for: ${email}`);
    
    try {
      const isDemoAccount = this.isDemoAccount(email);
      
      if (isDemoAccount) {
        console.log(`✅ DEMO PROTECTION [${cleanupId}]: Demo account - no cleanup needed`);
        return true;
      }

      // For non-demo accounts, ensure they have no demo data
      const childrenCount = await prisma.child.count({
        where: { parentId: userId }
      });
      
      const familyMembersCount = await prisma.familyMember.count({
        where: { familyId: userId }
      });
      
      const venuesCount = await prisma.venue.count({
        where: { adminId: userId }
      });

      if (childrenCount > 0 || familyMembersCount > 0 || venuesCount > 0) {
        console.error(`🚨 DEMO PROTECTION [${cleanupId}]: CRITICAL - Demo data found in non-demo account!`);
        console.error(`🚨 DEMO PROTECTION [${cleanupId}]: This should never happen for: ${email}`);
        
        // Log the contamination for investigation
        await this.logContamination(userId, email, {
          children: childrenCount,
          familyMembers: familyMembersCount,
          venues: venuesCount
        });
        
        return false;
      }

      console.log(`✅ DEMO PROTECTION [${cleanupId}]: Account is clean`);
      return true;

    } catch (error) {
      console.error(`❌ DEMO PROTECTION [${cleanupId}]: Cleanup error:`, error);
      return false;
    }
  }

  /**
   * CRITICAL: Prevent demo data injection into non-demo accounts
   */
  public async preventDemoDataInjection(userId: string, email: string, dataType: string): Promise<boolean> {
    const preventionId = `prevent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🛡️ DEMO PROTECTION [${preventionId}]: Preventing demo data injection for: ${email}`);
    console.log(`🛡️ DEMO PROTECTION [${preventionId}]: Data type: ${dataType}`);
    
    try {
      const isDemoAccount = this.isDemoAccount(email);
      const allowsDemoData = this.allowsDemoData(email);
      
      if (isDemoAccount && allowsDemoData) {
        console.log(`✅ DEMO PROTECTION [${preventionId}]: Demo account - allowing demo data`);
        return true;
      }

      if (isDemoAccount && !allowsDemoData) {
        console.log(`❌ DEMO PROTECTION [${preventionId}]: Demo account but demo data not allowed`);
        return false;
      }

      // For non-demo accounts, NEVER allow demo data
      console.log(`❌ DEMO PROTECTION [${preventionId}]: Non-demo account - BLOCKING demo data injection`);
      return false;

    } catch (error) {
      console.error(`❌ DEMO PROTECTION [${preventionId}]: Prevention error:`, error);
      return false;
    }
  }

  /**
   * CRITICAL: Log contamination incidents for investigation
   */
  private async logContamination(userId: string, email: string, contamination: {
    children: number;
    familyMembers: number;
    venues: number;
  }): Promise<void> {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`🚨 CONTAMINATION LOG [${logId}]: Recording contamination incident`);
    console.error(`🚨 CONTAMINATION LOG [${logId}]: User: ${email} (${userId})`);
    console.error(`🚨 CONTAMINATION LOG [${logId}]: Contamination:`, contamination);
    console.error(`🚨 CONTAMINATION LOG [${logId}]: Timestamp: ${new Date().toISOString()}`);
    
    // In a production system, this would be logged to a monitoring system
    // For now, we'll log to console and potentially save to database
  }

  /**
   * CRITICAL: Get all demo accounts info
   */
  public getDemoAccountsInfo(): DemoAccountInfo[] {
    return Object.values(this.DEMO_ACCOUNTS);
  }

  /**
   * CRITICAL: Monitor for contamination across all accounts
   */
  public async monitorContamination(): Promise<{
    totalUsers: number;
    demoAccounts: number;
    cleanAccounts: number;
    contaminatedAccounts: number;
    contaminations: Array<{
      email: string;
      children: number;
      familyMembers: number;
      venues: number;
    }>;
  }> {
    const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📊 DEMO PROTECTION [${monitorId}]: Starting contamination monitoring`);
    
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      const results = {
        totalUsers: users.length,
        demoAccounts: 0,
        cleanAccounts: 0,
        contaminatedAccounts: 0,
        contaminations: [] as Array<{
          email: string;
          children: number;
          familyMembers: number;
          venues: number;
        }>
      };

      for (const user of users) {
        const isDemoAccount = this.isDemoAccount(user.email);
        
        if (isDemoAccount) {
          results.demoAccounts++;
          continue;
        }

        // Check for contamination
        const childrenCount = await prisma.child.count({
          where: { parentId: user.id }
        });
        
        const familyMembersCount = await prisma.familyMember.count({
          where: { familyId: user.id }
        });
        
        const venuesCount = await prisma.venue.count({
          where: { adminId: user.id }
        });

        const hasContamination = childrenCount > 0 || familyMembersCount > 0 || venuesCount > 0;
        
        if (hasContamination) {
          results.contaminatedAccounts++;
          results.contaminations.push({
            email: user.email,
            children: childrenCount,
            familyMembers: familyMembersCount,
            venues: venuesCount
          });
        } else {
          results.cleanAccounts++;
        }
      }

      console.log(`📊 DEMO PROTECTION [${monitorId}]: Monitoring complete`);
      console.log(`📊 DEMO PROTECTION [${monitorId}]: Results:`, results);
      
      return results;

    } catch (error) {
      console.error(`❌ DEMO PROTECTION [${monitorId}]: Monitoring error:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const demoAccountProtection = DemoAccountProtection.getInstance();
