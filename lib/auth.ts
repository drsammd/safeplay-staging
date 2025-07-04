

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
      async authorize(credentials) {
        console.log("🔍 AUTHORIZE called with:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        try {
          // Normalize email to lowercase for case-insensitive lookup
          const normalizedEmail = credentials.email.toLowerCase().trim();
          
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          });

          if (!user) {
            console.log("❌ User not found");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            return null;
          }

          // Check if user has 2FA enabled
          if (user.twoFactorEnabled && !credentials.twoFactorVerified) {
            console.log("🔒 2FA required for user:", user.email);
            throw new Error("2FA_REQUIRED");
          }

          console.log("✅ Login successful for:", user.email, "Role:", user.role);
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
          console.error("❌ Auth error:", error);
          
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
      if (session?.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.phoneVerified = token.phoneVerified as boolean;
        session.user.identityVerified = token.identityVerified as boolean;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.verificationLevel = token.verificationLevel as string;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  events: {
    signIn: async ({ user, account, profile, isNewUser }) => {
      console.log("📝 Sign in event:", {
        userId: user.id,
        email: user.email,
        isNewUser,
        verificationLevel: user.verificationLevel
      });

      // Trigger email automations for new users
      if (isNewUser && user.id) {
        try {
          // Import dynamically to avoid circular dependencies
          const { emailAutomationEngine } = await import('@/lib/services/email-automation-engine');
          
          // Trigger welcome email automation
          await emailAutomationEngine.processTrigger({
            trigger: 'USER_SIGNUP',
            userId: user.id,
            metadata: {
              userEmail: user.email,
              userName: user.name,
              userRole: user.role,
              signupDate: new Date().toISOString()
            }
          });
          
          console.log("✅ Email automation triggered for new user:", user.id);
        } catch (error) {
          console.error("❌ Failed to trigger email automation:", error);
        }
      }
    },
  },
};

