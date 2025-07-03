
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { twoFactorService } from "@/lib/services/two-factor-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const setupSMSSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
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
    const validation = setupSMSSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }

    const { phoneNumber } = validation.data;

    const result = await twoFactorService.setupSMS2FA(
      session.user.id,
      phoneNumber
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "SMS two-factor authentication enabled successfully"
    });

  } catch (error) {
    console.error("SMS 2FA setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
