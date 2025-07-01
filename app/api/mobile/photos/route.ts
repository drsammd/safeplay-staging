
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get photo notifications for parent
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get parent's children
    const children = await db.child.findMany({
      where: { parentId: session.user.id },
      select: { id: true }
    });

    const childIds = children.map(child => child.id);

    if (childIds.length === 0) {
      return NextResponse.json({ photos: [], total: 0, hasMore: false });
    }

    const whereClause: any = {
      parentId: session.user.id,
      childId: childId ? childId : { in: childIds }
    };

    if (unreadOnly) {
      whereClause.isViewed = false;
    }

    const [photos, total] = await Promise.all([
      db.photoNotification.findMany({
        where: whereClause,
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true
            }
          },
          venue: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        },
        orderBy: {
          capturedAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.photoNotification.count({ where: whereClause })
    ]);

    const hasMore = skip + photos.length < total;

    return NextResponse.json({ 
      photos, 
      total, 
      hasMore,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching photo notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Mark photos as viewed/downloaded
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { photoIds, action } = body; // action: 'view', 'download', 'share'

    if (!photoIds || !Array.isArray(photoIds) || !action) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const updateData: any = {};
    const timestamp = new Date();

    switch (action) {
      case 'view':
        updateData.isViewed = true;
        updateData.viewedAt = timestamp;
        break;
      case 'download':
        updateData.isDownloaded = true;
        updateData.downloadedAt = timestamp;
        break;
      case 'share':
        updateData.isShared = true;
        updateData.sharedAt = timestamp;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedPhotos = await db.photoNotification.updateMany({
      where: {
        id: { in: photoIds },
        parentId: session.user.id
      },
      data: updateData
    });

    return NextResponse.json({ 
      message: `${action} action completed`,
      updatedCount: updatedPhotos.count 
    });
  } catch (error) {
    console.error('Error updating photo notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
