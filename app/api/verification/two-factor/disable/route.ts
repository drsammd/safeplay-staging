
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { twoFactorService } from "@/lib/services/two-factor-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const result = await twoFactorService.disable2FA(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled successfully"
    });

  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
