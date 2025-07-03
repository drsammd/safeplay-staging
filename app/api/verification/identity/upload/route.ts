
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const uploadSchema = z.object({
  verificationType: z.enum(["BASIC_VERIFICATION", "ENHANCED_VERIFICATION", "MANUAL_REVIEW"]).default("BASIC_VERIFICATION"),
  documentType: z.enum([
    "DRIVERS_LICENSE", "PASSPORT", "NATIONAL_ID", "STATE_ID", 
    "MILITARY_ID", "STUDENT_ID", "BIRTH_CERTIFICATE", 
    "UTILITY_BILL", "BANK_STATEMENT", "OTHER"
  ]),
  documentNumber: z.string().optional(),
  documentCountry: z.string().optional(),
  documentState: z.string().optional(),
  documentExpiryDate: z.string().optional(), // ISO date string
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

    const formData = await request.formData();
    
    // Extract form fields
    const verificationType = formData.get('verificationType') as string;
    const documentType = formData.get('documentType') as string;
    const documentNumber = formData.get('documentNumber') as string;
    const documentCountry = formData.get('documentCountry') as string;
    const documentState = formData.get('documentState') as string;
    const documentExpiryDate = formData.get('documentExpiryDate') as string;

    // Extract files
    const documentFiles = formData.getAll('documentImages') as File[];
    const selfieFile = formData.get('selfieImage') as File;

    // Validate form data
    const validation = uploadSchema.safeParse({
      verificationType: verificationType || 'BASIC_VERIFICATION',
      documentType,
      documentNumber: documentNumber || undefined,
      documentCountry: documentCountry || undefined,
      documentState: documentState || undefined,
      documentExpiryDate: documentExpiryDate || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid form data", 
          details: validation.error.issues 
        }, 
        { status: 400 }
      );
    }

    if (documentFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one document image is required" }, 
        { status: 400 }
      );
    }

    // Check if user already has a pending verification
    const existingVerification = await prisma.identityVerification.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW']
        }
      }
    });

    if (existingVerification && existingVerification.resubmissionCount >= existingVerification.maxResubmissions) {
      return NextResponse.json(
        { error: "Maximum resubmission attempts reached" }, 
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'identity-verification', session.user.id);
    await mkdir(uploadDir, { recursive: true });

    // Process and save document images
    const documentUrls = [];
    for (let i = 0; i < documentFiles.length; i++) {
      const file = documentFiles[i];
      
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `File ${file.name} is not an image` }, 
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB` }, 
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process image with sharp (resize, optimize)
      const processedImage = await sharp(buffer)
        .resize(2000, 2000, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      const fileName = `document-${Date.now()}-${i}.jpg`;
      const filePath = join(uploadDir, fileName);
      
      await writeFile(filePath, processedImage);
      documentUrls.push(`/uploads/identity-verification/${session.user.id}/${fileName}`);
    }

    // Process selfie if provided
    let selfieUrl = null;
    if (selfieFile && selfieFile.size > 0) {
      if (!selfieFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: "Selfie must be an image" }, 
          { status: 400 }
        );
      }

      const bytes = await selfieFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const processedSelfie = await sharp(buffer)
        .resize(1000, 1000, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      const selfieFileName = `selfie-${Date.now()}.jpg`;
      const selfiePath = join(uploadDir, selfieFileName);
      
      await writeFile(selfiePath, processedSelfie);
      selfieUrl = `/uploads/identity-verification/${session.user.id}/${selfieFileName}`;
    }

    // Create or update identity verification record
    const verificationData = {
      userId: session.user.id,
      verificationType: validation.data.verificationType,
      documentType: validation.data.documentType,
      documentNumber: validation.data.documentNumber,
      documentCountry: validation.data.documentCountry,
      documentState: validation.data.documentState,
      documentExpiryDate: validation.data.documentExpiryDate ? new Date(validation.data.documentExpiryDate) : null,
      documentImages: documentUrls,
      selfieImageUrl: selfieUrl,
      status: 'SUBMITTED' as const,
      verificationMethod: 'MANUAL' as const,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      verificationMetadata: {
        uploadedAt: new Date().toISOString(),
        fileCount: documentFiles.length,
        hasSelfie: !!selfieUrl
      }
    };

    let verification;
    if (existingVerification) {
      // Update existing verification (resubmission)
      verification = await prisma.identityVerification.update({
        where: { id: existingVerification.id },
        data: {
          ...verificationData,
          resubmissionCount: existingVerification.resubmissionCount + 1,
          resubmissionAllowed: existingVerification.resubmissionCount + 1 < existingVerification.maxResubmissions
        }
      });
    } else {
      // Create new verification
      verification = await prisma.identityVerification.create({
        data: verificationData
      });
    }

    // Create system notification for admins
    await prisma.systemNotification.create({
      data: {
        type: 'VERIFICATION_REQUIRED',
        title: 'New Identity Verification Submission',
        message: `User ${session.user.email} has submitted identity verification documents for review.`,
        actionUrl: `/admin/verification/identity/${verification.id}`,
        actionText: 'Review Submission',
        priority: 'NORMAL',
        metadata: {
          userId: session.user.id,
          verificationId: verification.id,
          documentType: validation.data.documentType
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Identity verification documents uploaded successfully",
      verificationId: verification.id,
      status: verification.status
    });

  } catch (error) {
    console.error("Identity verification upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
