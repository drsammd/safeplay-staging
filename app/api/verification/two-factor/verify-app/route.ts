
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { twoFactorService } from "@/lib/services/two-factor-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  token: z.string().length(6, "Authentication code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = verifySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }

    const { token } = validation.data;

    const result = await twoFactorService.verifyAuthenticatorSetup(
      session.user.id,
      token
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
      backupCodes: result.backupCodes
    });

  } catch (error) {
    console.error("2FA app verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
