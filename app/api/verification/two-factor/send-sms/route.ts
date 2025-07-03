
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { twoFactorService } from "@/lib/services/two-factor-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const sendSMSSchema = z.object({
  purpose: z.enum(["LOGIN", "SETUP", "DISABLE", "SENSITIVE_ACTION", "PASSWORD_RESET", "ACCOUNT_RECOVERY"]).optional().default("LOGIN"),
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
    const validation = sendSMSSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }

    const { purpose } = validation.data;

    const result = await twoFactorService.sendSMS2FACode(
      session.user.id,
      purpose
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "2FA code sent successfully",
      attemptId: result.attemptId
    });

  } catch (error) {
    console.error("SMS 2FA send error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
