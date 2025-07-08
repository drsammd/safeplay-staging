

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
        console.log("🔍 AUTHORIZE called with:", credentials?.email);

        // Check for auto-signin token first (for stakeholder access)
        if (!credentials?.email && !credentials?.password) {
          try {
            const { decode } = await import('next-auth/jwt');
            const cookies = req.headers?.cookie;
            
            if (cookies) {
              const autoSigninMatch = cookies.match(/auto-signin-token=([^;]+)/);
              if (autoSigninMatch) {
                const autoSigninToken = autoSigninMatch[1];
                
                const tokenData = await decode({
                  token: autoSigninToken,
                  secret: process.env.NEXTAUTH_SECRET!
                });

                if (tokenData?.autoSignin && tokenData?.userId && tokenData?.email) {
                  // Check if token is not expired
                  if (!tokenData.exp || tokenData.exp > Math.floor(Date.now() / 1000)) {
                    console.log("✅ Auto-signin with stakeholder token for:", tokenData.email);
                    
                    // Fetch user from database
                    const user = await prisma.user.findUnique({
                      where: { id: tokenData.userId as string }
                    });

                    if (user) {
                      console.log("✅ Auto-signin successful for:", user.email);
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
                    }
                  } else {
                    console.log("⏰ Auto-signin token expired");
                  }
                } else {
                  console.log("❌ Invalid auto-signin token");
                }
              }
            }
          } catch (error) {
            console.error("❌ Auto-signin error:", error);
          }
        }

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

          // Special handling for demo accounts during stakeholder access
          const isDemoAccount = user.email === 'john@mysafeplay.ai' || user.email === 'parent@mysafeplay.ai';
          const isDemoPassword = credentials.password === 'demo-password';
          
          let isPasswordValid = false;
          
          if (isDemoAccount && isDemoPassword) {
            // Allow demo password for stakeholder presentations
            console.log("🎭 Demo account authentication for stakeholder access");
            isPasswordValid = true;
          } else {
            // Normal password validation
            isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );
          }

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            return null;
          }

          // Check if user has 2FA enabled
          if (user.twoFactorEnabled && credentials.twoFactorVerified !== 'true') {
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
      console.log("🔄 Redirect callback:", { url, baseUrl });
      
      // Handle role-based redirects after successful login
      if (url.includes("/api/auth/callback")) {
        // This is a callback from successful authentication
        return baseUrl;
      }
      
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`;
        console.log("✅ Relative redirect:", fullUrl);
        return fullUrl;
      }
      
      // Allow callback URLs on the same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          console.log("✅ Same origin redirect:", url);
          return url;
        }
      } catch (error) {
        console.error("❌ URL parsing error:", error);
      }
      
      console.log("🏠 Default redirect to baseUrl:", baseUrl);
      return baseUrl;
    },
    signIn: async ({ user, account, profile, email, credentials }) => {
      console.log("🔐 SignIn callback:", {
        userId: user?.id,
        email: user?.email,
        role: user?.role
      });
      
      // Always allow sign in if we reach this point
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
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

