
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verificationService } from "@/lib/services/verification-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
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

    const { code } = validation.data;

    const result = await verificationService.verifyPhoneCode(
      session.user.id,
      code
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      verificationLevel: result.verificationLevel
    });

  } catch (error) {
    console.error("Phone verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
