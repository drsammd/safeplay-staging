
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/db';
import { enhancedRekognitionService } from '../../../../lib/aws/rekognition-service';
import { permissionConsentService } from '../../../../lib/services/permission-consent-service';

// POST /api/messaging/media-sharing - Upload and tag media
export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      mediaType, 
      fileUrl, 
      thumbnailUrl, 
      fileSize, 
      duration, 
      venueId, 
      autoTag = true,
      requestPermissions = true 
    } = body;

    // Validate required fields
    if (!fileUrl || !mediaType || !venueId) {
      return NextResponse.json(
        { error: 'Missing required fields: fileUrl, mediaType, venueId' },
        { status: 400 }
      );
    }

    // Verify user access to venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { children: { some: { parentId: session.user.id } } }
        ]
      }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Access denied to venue' }, { status: 403 });
    }

    // Create media record
    const media = await prisma.sharedMedia.create({
      data: {
        title,
        description,
        mediaType,
        fileUrl,
        thumbnailUrl,
        fileSize,
        duration,
        capturedAt: new Date(),
        venueId,
        uploadedById: session.user.id,
        taggedChildren: [],
        facialTagsConfirmed: false,
      },
    });

    let taggedChildren: string[] = [];
    let permissionResults: any[] = [];

    // Auto-tag children using facial recognition if enabled
    if (autoTag && (mediaType === 'PHOTO' || mediaType === 'VIDEO')) {
      try {
        // Get all children in venue for facial recognition
        const venueChildren = await prisma.child.findMany({
          where: {
            currentVenueId: venueId,
            faceRecognitionEnabled: true,
          },
          include: {
            faceCollection: true,
          },
        });

        const childCollectionIds = venueChildren
          .filter(child => child.faceCollection?.awsCollectionId)
          .map(child => child.faceCollection!.awsCollectionId);

        if (childCollectionIds.length > 0) {
          // Download media file for processing
          const response = await fetch(fileUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Tag children using enhanced Rekognition service
          const taggingResult = await enhancedRekognitionService.tagChildrenInMedia(
            buffer,
            venueId,
            childCollectionIds
          );

          if (taggingResult.success) {
            taggedChildren = taggingResult.taggedChildren.map(tc => tc.childId);
            
            // Update media with tagged children
            await prisma.sharedMedia.update({
              where: { id: media.id },
              data: {
                taggedChildren,
                facialTagsConfirmed: true,
              },
            });
          }
        }
      } catch (taggingError) {
        console.error('Error in auto-tagging:', taggingError);
        // Continue without auto-tagging
      }
    }

    // Request permissions from parents if enabled
    if (requestPermissions && taggedChildren.length > 0) {
      try {
        const permissionPromises = taggedChildren.map(async childId => {
          const child = await prisma.child.findUnique({
            where: { id: childId },
            include: { parent: true },
          });

          if (child && child.parentId !== session.user.id) {
            return await permissionConsentService.requestMediaPermission({
              mediaId: media.id,
              childId,
              parentId: child.parentId,
              requestType: 'media_share',
              context: `Media shared in ${venue.name}`,
              expiresIn: 168, // 7 days
            });
          }
          return null;
        });

        permissionResults = (await Promise.all(permissionPromises)).filter(Boolean);
      } catch (permissionError) {
        console.error('Error requesting permissions:', permissionError);
        // Continue without permission requests
      }
    }

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        title: media.title,
        mediaType: media.mediaType,
        fileUrl: media.fileUrl,
        thumbnailUrl: media.thumbnailUrl,
        taggedChildren,
        facialTagsConfirmed: media.facialTagsConfirmed,
        createdAt: media.createdAt,
      },
      tagging: {
        autoTagged: taggedChildren.length > 0,
        childrenCount: taggedChildren.length,
      },
      permissions: {
        requested: permissionResults.length > 0,
        results: permissionResults,
      },
    });
  } catch (error: any) {
    console.error('Error in media sharing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/messaging/media-sharing - Get shared media
export async function GET(request: NextRequest) {
  try {
    const session = await getSession({ req: request as any });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const childId = searchParams.get('childId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId is required' },
        { status: 400 }
      );
    }

    // Verify access to venue
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        OR: [
          { adminId: session.user.id },
          { children: { some: { parentId: session.user.id } } }
        ]
      }
    });

    if (!venue) {
      return NextResponse.json({ error: 'Access denied to venue' }, { status: 403 });
    }

    const skip = (page - 1) * limit;
    const where: any = {
      venueId,
    };

    // Filter by child if specified
    if (childId) {
      where.taggedChildren = {
        has: childId,
      };
    }

    // Get user's children for permission filtering
    const userChildren = await prisma.child.findMany({
      where: { parentId: session.user.id },
      select: { id: true },
    });
    const userChildIds = userChildren.map(child => child.id);

    // Add permission filtering - show media where:
    // 1. User uploaded it
    // 2. User's children are tagged and have granted permission
    // 3. Media doesn't require permissions (no tagged children)
    where.OR = [
      { uploadedById: session.user.id },
      { taggedChildren: { equals: [] } },
      {
        AND: [
          { taggedChildren: { hasSome: userChildIds } },
          {
            permissions: {
              some: {
                parentId: session.user.id,
                status: 'GRANTED',
                expiresAt: { gte: new Date() },
              },
            },
          },
        ],
      },
    ];

    const [total, media] = await Promise.all([
      prisma.sharedMedia.count({ where }),
      prisma.sharedMedia.findMany({
        where,
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
          permissions: {
            where: { parentId: session.user.id },
          },
        },
        orderBy: { capturedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedMedia = media.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      mediaType: item.mediaType,
      fileUrl: item.fileUrl,
      thumbnailUrl: item.thumbnailUrl,
      fileSize: item.fileSize,
      duration: item.duration,
      capturedAt: item.capturedAt,
      taggedChildren: item.taggedChildren,
      facialTagsConfirmed: item.facialTagsConfirmed,
      watermarked: item.watermarked,
      uploadedBy: item.uploadedBy,
      hasPermission: item.uploadedById === session.user.id || 
                     item.permissions.some(p => p.status === 'GRANTED'),
      permissionStatus: item.permissions[0]?.status || null,
    }));

    return NextResponse.json({
      success: true,
      media: formattedMedia,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error getting shared media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
