

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      phoneVerified?: boolean;
      identityVerified?: boolean;
      twoFactorEnabled?: boolean;
      verificationLevel?: string;
    };
  }

  interface User {
    role: string;
    phoneVerified?: boolean;
    identityVerified?: boolean;
    twoFactorEnabled?: boolean;
    verificationLevel?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    phoneVerified?: boolean;
    identityVerified?: boolean;
    twoFactorEnabled?: boolean;
    verificationLevel?: string;
  }
}

