
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../../lib/db';
import { enhancedRekognitionService } from '../../../../lib/aws/rekognition-service';
import { permissionConsentService } from '../../../../lib/services/permission-consent-service';
import { toStringArraySafe, parseJsonSafe, toBooleanSafe } from '@/lib/types/common';

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
        title: title || `${mediaType} from ${venue.name}`,
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
        // Get all children in venue for facial recognition - fix field references
        const venueChildren = await prisma.child.findMany({
          where: {
            currentVenueId: venueId,
            faceRecognitionEnabled: true,
            biometricId: { not: null }
          },
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            faceCollection: {
              select: {
                id: true
              }
            }
          }
        });

        if (venueChildren.length > 0) {
          const childCollectionIds = venueChildren
            .filter(child => child.faceCollection)
            .map(child => ({
              childId: child.id,
              collectionId: child.faceCollection!.id
            }));

          // Use enhanced facial recognition
          const taggingResult = await enhancedRekognitionService.detectAndTagChildren({
            fileUrl,
            mediaType,
            venueId,
            childCollectionIds
          });

          if (taggingResult.success && taggingResult.taggedChildren) {
            // Safely convert JsonValue to string array
            const taggedChildrenResult = Array.isArray(taggingResult.taggedChildren)
              ? taggingResult.taggedChildren.map((tc: any) => tc?.childId).filter(Boolean)
              : [];
            
            taggedChildren = taggedChildrenResult;
            
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
        facialTagsConfirmed: toBooleanSafe(media.facialTagsConfirmed),
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
    const mediaType = searchParams.get('mediaType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!venueId) {
      return NextResponse.json({ error: 'venueId is required' }, { status: 400 });
    }

    // Base where clause
    const where: any = {
      venueId,
    };

    // Filter by child if specified
    if (childId) {
      where.taggedChildren = {
        path: '$',
        array_contains: childId,
      };
    }

    // Filter by media type if specified
    if (mediaType) {
      where.mediaType = mediaType;
    }

    // Get user's children for permission filtering
    const userChildren = await prisma.child.findMany({
      where: { parentId: session.user.id },
      select: { id: true },
    });
    const userChildIds = userChildren.map(child => child.id);

    // Access control: User can see media if:
    // 1. User uploaded it
    // 2. User's children are tagged and have granted permission
    // 3. Media doesn't require permissions (no tagged children)
    where.OR = [
      { uploadedById: session.user.id },
      { taggedChildren: { equals: [] } },
      {
        AND: [
          { taggedChildren: { path: '$', array_contains_any: userChildIds } },
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

    const media = await prisma.sharedMedia.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        permissions: {
          where: { parentId: session.user.id },
          select: { status: true, expiresAt: true }
        }
      },
      orderBy: { capturedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.sharedMedia.count({ where });

    // Format response with safe type conversions
    const formattedMedia = media.map(item => {
      // Fixed: safely handle JsonValue conversion
      const taggedChildrenSafe = item.taggedChildren ? toStringArraySafe(item.taggedChildren) : [];
      
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        mediaType: item.mediaType,
        fileUrl: item.fileUrl,
        thumbnailUrl: item.thumbnailUrl,
        fileSize: item.fileSize,
        duration: item.duration,
        capturedAt: item.capturedAt,
        taggedChildren: taggedChildrenSafe,
        facialTagsConfirmed: toBooleanSafe(item.facialTagsConfirmed),
        watermarked: toBooleanSafe(item.watermarked),
        uploadedBy: item.uploadedBy,
        hasPermission: item.uploadedById === session.user.id || 
                       item.permissions.some(p => p.status === 'GRANTED'),
        permissionStatus: item.permissions[0]?.status || null,
      };
    });

    return NextResponse.json({
      success: true,
      media: formattedMedia,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching shared media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
