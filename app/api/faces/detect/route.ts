
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { rekognitionService, s3Service, validateAWSConfig } from "@/lib/aws";

export const dynamic = "force-dynamic";

/**
 * POST /api/faces/detect
 * Detect faces in an uploaded image
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate AWS configuration
    const awsValidation = validateAWSConfig();
    if (!awsValidation.valid) {
      return NextResponse.json({ 
        error: "AWS configuration incomplete",
        details: awsValidation.errors 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const analyzeDetails = formData.get('analyzeDetails') === 'true';

    if (!file) {
      return NextResponse.json({ 
        error: "Image file is required" 
      }, { status: 400 });
    }

    // Validate image
    const imageValidation = s3Service.validateImage(file);
    if (!imageValidation.valid) {
      return NextResponse.json({ 
        error: "Invalid image file",
        details: imageValidation.errors 
      }, { status: 400 });
    }

    // Convert file to buffer for processing
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // Detect faces
    const detectionResult = await rekognitionService.detectFaces(imageBuffer);

    if (!detectionResult.success) {
      return NextResponse.json({ 
        error: detectionResult.error || "Face detection failed" 
      }, { status: 500 });
    }

    // Process detection results
    const processedFaces = detectionResult.faces.map((face, index) => ({
      id: `face-${index}`,
      boundingBox: face.BoundingBox,
      confidence: face.Confidence,
      attributes: analyzeDetails ? {
        emotions: face.Emotions?.map(emotion => ({
          type: emotion.Type,
          confidence: emotion.Confidence,
        })) || [],
        ageRange: face.AgeRange ? {
          low: face.AgeRange.Low,
          high: face.AgeRange.High,
        } : null,
        gender: face.Gender ? {
          value: face.Gender.Value,
          confidence: face.Gender.Confidence,
        } : null,
        smile: face.Smile ? {
          value: face.Smile.Value,
          confidence: face.Smile.Confidence,
        } : null,
        eyeglasses: face.Eyeglasses ? {
          value: face.Eyeglasses.Value,
          confidence: face.Eyeglasses.Confidence,
        } : null,
        sunglasses: face.Sunglasses ? {
          value: face.Sunglasses.Value,
          confidence: face.Sunglasses.Confidence,
        } : null,
        beard: face.Beard ? {
          value: face.Beard.Value,
          confidence: face.Beard.Confidence,
        } : null,
        mustache: face.Mustache ? {
          value: face.Mustache.Value,
          confidence: face.Mustache.Confidence,
        } : null,
        eyesOpen: face.EyesOpen ? {
          value: face.EyesOpen.Value,
          confidence: face.EyesOpen.Confidence,
        } : null,
        mouthOpen: face.MouthOpen ? {
          value: face.MouthOpen.Value,
          confidence: face.MouthOpen.Confidence,
        } : null,
        pose: face.Pose ? {
          roll: face.Pose.Roll,
          yaw: face.Pose.Yaw,
          pitch: face.Pose.Pitch,
        } : null,
        quality: face.Quality ? {
          brightness: face.Quality.Brightness,
          sharpness: face.Quality.Sharpness,
        } : null,
        landmarks: face.Landmarks?.map(landmark => ({
          type: landmark.Type,
          x: landmark.X,
          y: landmark.Y,
        })) || [],
      } : undefined,
    }));

    // Calculate summary statistics
    const summary = {
      totalFaces: detectionResult.faceCount,
      averageConfidence: detectionResult.faces.length > 0 
        ? detectionResult.faces.reduce((sum, face) => sum + face.Confidence, 0) / detectionResult.faces.length 
        : 0,
      highConfidenceFaces: detectionResult.faces.filter(face => face.Confidence >= 95).length,
      qualityAssessment: analyzeDetails ? {
        goodQuality: detectionResult.faces.filter(face => 
          face.Quality && face.Quality.Brightness > 50 && face.Quality.Sharpness > 50
        ).length,
        totalFaces: detectionResult.faces.length,
      } : undefined,
    };

    return NextResponse.json({
      success: true,
      faces: processedFaces,
      summary,
      metadata: {
        imageSize: file.size,
        imageType: file.type,
        processingTime: Date.now(), // This would be calculated properly in production
      },
    });
  } catch (error) {
    console.error("Error detecting faces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
