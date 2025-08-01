/**
 * SafePlay Authentication Configuration - Clean & Simplified
 * v1.5.40-alpha.16 - Ground-up rebuild for stability
 * 
 * FIXES:
 * - Eliminated session provider conflicts
 * - Simplified authentication architecture
 * - Enhanced session validation with database verification
 * - Proper error handling and session persistence
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorVerified: { label: "2FA Verified", type: "text" }
      },
      async authorize(credentials, req) {
        const authId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🔐 CLEAN AUTH [${authId}]: Authorization attempt for: ${credentials?.email}`);

        if (!credentials?.email || !credentials?.password) {
          console.log(`❌ CLEAN AUTH [${authId}]: Missing credentials`);
          return null;
        }

        try {
          // Normalize email for consistent lookup
          const normalizedEmail = credentials.email.toLowerCase().trim();
          
          console.log(`🔍 CLEAN AUTH [${authId}]: Looking up user: ${normalizedEmail}`);
          
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              password: true,
              isActive: true,
              phoneVerified: true,
              identityVerified: true,
              twoFactorEnabled: true,
              verificationLevel: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true
            }
          });

          if (!user) {
            console.log(`❌ CLEAN AUTH [${authId}]: User not found: ${normalizedEmail}`);
            return null;
          }

          if (!user.isActive) {
            console.log(`❌ CLEAN AUTH [${authId}]: User account inactive: ${normalizedEmail}`);
            return null;
          }

          console.log(`✅ CLEAN AUTH [${authId}]: User found: ${user.email}, Role: ${user.role}`);

          // Validate password
          let isPasswordValid = false;
          
          try {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          } catch (bcryptError) {
            console.error(`❌ CLEAN AUTH [${authId}]: Password comparison failed:`, bcryptError);
            return null;
          }

          if (!isPasswordValid) {
            console.log(`❌ CLEAN AUTH [${authId}]: Invalid password for: ${normalizedEmail}`);
            return null;
          }

          // Check 2FA if enabled
          if (user.twoFactorEnabled && credentials.twoFactorVerified !== 'true') {
            console.log(`🔒 CLEAN AUTH [${authId}]: 2FA required for: ${normalizedEmail}`);
            throw new Error("2FA_REQUIRED");
          }

          // Update last login time
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() }
            });
          } catch (updateError) {
            console.warn(`⚠️ CLEAN AUTH [${authId}]: Failed to update last login:`, updateError);
            // Don't fail authentication for this
          }

          console.log(`✅ CLEAN AUTH [${authId}]: Authentication successful for: ${user.email}`);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phoneVerified: user.phoneVerified,
            identityVerified: user.identityVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            verificationLevel: user.verificationLevel,
          };
        } catch (error) {
          console.error(`❌ CLEAN AUTH [${authId}]: Authentication error:`, error);
          
          // Re-throw 2FA requirement error
          if (error instanceof Error && error.message === "2FA_REQUIRED") {
            throw error;
          }
          
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.phoneVerified = user.phoneVerified;
        token.identityVerified = user.identityVerified;
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.verificationLevel = user.verificationLevel;
      }
      return token;
    },
    session: async ({ session, token }) => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Always ensure we return a valid session object
      if (!session) {
        console.log(`🔍 CLEAN SESSION [${sessionId}]: No session provided, creating empty session`);
        return {
          user: {},
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        };
      }

      if (session?.user && token.sub) {
        try {
          const userId = token.sub as string;
          console.log(`🔍 CLEAN SESSION [${sessionId}]: Validating session for user: ${userId}`);
          
          // CRITICAL: Validate user exists and is active
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              phoneVerified: true,
              identityVerified: true,
              twoFactorEnabled: true,
              verificationLevel: true
            }
          });

          if (!user) {
            console.error(`❌ CLEAN SESSION [${sessionId}]: User not found in database: ${userId}`);
            // Return empty session instead of null to prevent CLIENT_FETCH_ERROR
            return {
              user: {},
              expires: session.expires
            };
          }

          if (!user.isActive) {
            console.error(`❌ CLEAN SESSION [${sessionId}]: User account inactive: ${user.email}`);
            // Return empty session instead of null to prevent CLIENT_FETCH_ERROR
            return {
              user: {},
              expires: session.expires
            };
          }

          console.log(`✅ CLEAN SESSION [${sessionId}]: Session validated for: ${user.email}`);
          
          // Use fresh user data from database
          session.user.id = user.id;
          session.user.email = user.email;
          session.user.name = user.name;
          session.user.role = user.role;
          session.user.phoneVerified = user.phoneVerified;
          session.user.identityVerified = user.identityVerified;
          session.user.twoFactorEnabled = user.twoFactorEnabled;
          session.user.verificationLevel = user.verificationLevel;
          
        } catch (error) {
          console.error(`❌ CLEAN SESSION [${sessionId}]: Session validation error:`, error);
          // Return empty session instead of null to prevent CLIENT_FETCH_ERROR
          return {
            user: {},
            expires: session.expires
          };
        }
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      console.log(`🔄 CLEAN REDIRECT: ${url} -> ${baseUrl}`);
      
      // Handle callback URLs
      if (url.includes("/api/auth/callback")) {
        return baseUrl;
      }
      
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Allow same-origin URLs
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (error) {
        console.error(`❌ CLEAN REDIRECT: URL parsing error:`, error);
      }
      
      return baseUrl;
    },
    signIn: async ({ user, account, profile, email, credentials }) => {
      console.log(`🔐 CLEAN SIGNIN: User sign in:`, {
        userId: user?.id,
        email: user?.email,
        role: user?.role
      });
      
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  events: {
    signIn: async ({ user, account, profile, isNewUser }) => {
      console.log(`📝 CLEAN SIGNIN EVENT: User signed in:`, {
        userId: user.id,
        email: user.email,
        isNewUser,
        role: user.role
      });

      // Update last login time
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });
        } catch (error) {
          console.error(`❌ CLEAN SIGNIN EVENT: Failed to update last login:`, error);
        }
      }
    },
    signOut: async ({ session, token }) => {
      console.log(`📝 CLEAN SIGNOUT EVENT: User signed out:`, {
        userId: token?.sub || session?.user?.id
      });
    }
  },
};


