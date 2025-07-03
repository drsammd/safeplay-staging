
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verificationService } from "@/lib/services/verification-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const initiateSchema = z.object({
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
    const validation = initiateSchema.safeParse(body);
    
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

    const result = await verificationService.initiatePhoneVerification(
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
      message: "Verification code sent successfully",
      verificationId: result.verificationId
    });

  } catch (error) {
    console.error("Phone verification initiation error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
