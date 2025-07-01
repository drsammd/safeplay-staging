
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Get offline data for mobile sync
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataTypes = searchParams.get('types')?.split(',') || [];
    const lastSync = searchParams.get('lastSync');

    const syncData: any = {};
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    // Get parent's children for data filtering
    const children = await db.child.findMany({
      where: { parentId: session.user.id },
      select: { id: true }
    });
    const childIds = children.map((child: any) => child.id);

    // Child info
    if (dataTypes.length === 0 || dataTypes.includes('CHILD_INFO')) {
      syncData.children = await db.child.findMany({
        where: { 
          parentId: session.user.id,
          updatedAt: { gte: lastSyncDate }
        },
        include: {
          currentVenue: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true
            }
          }
        }
      });
    }

    // Emergency contacts
    if (dataTypes.length === 0 || dataTypes.includes('EMERGENCY_CONTACTS')) {
      syncData.emergencyContacts = await db.emergencyContact.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { childId: { in: childIds } }
          ],
          updatedAt: { gte: lastSyncDate }
        }
      });
    }

    // Venue info
    if (dataTypes.length === 0 || dataTypes.includes('VENUE_INFO')) {
      // Get venues where children have been recently
      const recentVenues = await db.childLocationHistory.findMany({
        where: {
          childId: { in: childIds },
          timestamp: { gte: lastSyncDate }
        },
        select: { venueId: true },
        distinct: ['venueId']
      });

      if (recentVenues.length > 0) {
        syncData.venues = await db.venue.findMany({
          where: {
            id: { in: recentVenues.map((v: any) => v.venueId) }
          },
          include: {
            floorPlans: {
              where: { isActive: true },
              include: {
                zones: true
              }
            }
          }
        });
      }
    }

    // Recent photos
    if (dataTypes.length === 0 || dataTypes.includes('RECENT_PHOTOS')) {
      syncData.recentPhotos = await db.photoNotification.findMany({
        where: {
          parentId: session.user.id,
          capturedAt: { gte: lastSyncDate }
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          venue: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          capturedAt: 'desc'
        },
        take: 50 // Limit for mobile
      });
    }

    // Location history
    if (dataTypes.length === 0 || dataTypes.includes('LOCATION_HISTORY')) {
      syncData.locationHistory = await db.childLocationHistory.findMany({
        where: {
          childId: { in: childIds },
          timestamp: { gte: lastSyncDate }
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          venue: {
            select: {
              id: true,
              name: true
            }
          },
          zone: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100 // Limit for mobile
      });
    }

    // Notifications
    if (dataTypes.length === 0 || dataTypes.includes('NOTIFICATIONS')) {
      syncData.notifications = await db.mobileNotification.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: lastSyncDate },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100 // Limit for mobile
      });
    }

    // Settings/preferences
    if (dataTypes.length === 0 || dataTypes.includes('SETTINGS')) {
      syncData.notificationPreferences = await db.notificationPreference.findMany({
        where: { userId: session.user.id }
      });

      syncData.mobileDevices = await db.mobileDevice.findMany({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      });
    }

    // Cache this data for offline use
    if (Object.keys(syncData).length > 0) {
      await db.offlineDataCache.upsert({
        where: {
          userId_dataType_dataKey: {
            userId: session.user.id,
            dataType: 'SETTINGS', // Use a general type for full sync
            dataKey: 'mobile_dashboard_sync'
          }
        },
        update: {
          data: syncData,
          lastSyncAt: new Date(),
          isStale: false
        },
        create: {
          userId: session.user.id,
          dataType: 'SETTINGS',
          dataKey: 'mobile_dashboard_sync',
          data: syncData,
          lastSyncAt: new Date(),
          syncPriority: 1
        }
      });
    }

    return NextResponse.json({ 
      syncData,
      lastSyncTime: new Date().toISOString(),
      dataTypes: Object.keys(syncData)
    });
  } catch (error) {
    console.error('Error syncing mobile data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload offline data changes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offlineChanges, deviceId } = body;

    if (!offlineChanges || !Array.isArray(offlineChanges)) {
      return NextResponse.json({ error: 'Invalid offline changes data' }, { status: 400 });
    }

    const results = [];

    for (const change of offlineChanges) {
      try {
        const { type, action, data, timestamp } = change;

        switch (type) {
          case 'notification_read':
            if (action === 'mark_read' && data.notificationIds) {
              await db.mobileNotification.updateMany({
                where: {
                  id: { in: data.notificationIds },
                  userId: session.user.id
                },
                data: {
                  isRead: true,
                  readAt: new Date(timestamp)
                }
              });
              results.push({ type, success: true });
            }
            break;

          case 'photo_viewed':
            if (action === 'mark_viewed' && data.photoIds) {
              await db.photoNotification.updateMany({
                where: {
                  id: { in: data.photoIds },
                  parentId: session.user.id
                },
                data: {
                  isViewed: true,
                  viewedAt: new Date(timestamp)
                }
              });
              results.push({ type, success: true });
            }
            break;

          case 'device_update':
            if (action === 'update_settings' && deviceId) {
              await db.mobileDevice.update({
                where: {
                  deviceId,
                  userId: session.user.id
                },
                data: {
                  ...data,
                  lastActiveAt: new Date(timestamp)
                }
              });
              results.push({ type, success: true });
            }
            break;

          default:
            results.push({ type, success: false, error: 'Unknown change type' });
        }
      } catch (changeError) {
        console.error(`Error processing change ${change.type}:`, changeError);
        results.push({ type: change.type, success: false, error: 'Processing failed' });
      }
    }

    return NextResponse.json({ 
      message: 'Offline changes processed',
      results,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing offline changes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
