
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAWSConfigStatus, validateAWSConfig, isDevelopmentMode } from "@/lib/aws";

export const dynamic = "force-dynamic";

/**
 * GET /api/aws/status
 * Get AWS configuration status for debugging
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users or in development mode
    if (!session?.user || (session.user.role !== "SUPER_ADMIN" && !isDevelopmentMode())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getAWSConfigStatus();
    const validation = validateAWSConfig();

    return NextResponse.json({
      aws: {
        ...status,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings || [],
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        developmentMode: isDevelopmentMode(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting AWS status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
