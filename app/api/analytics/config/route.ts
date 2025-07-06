
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const analyticsConfigSchema = z.object({
  venueId: z.string(),
  configType: z.enum([
    'DATA_COLLECTION', 'REPORTING', 'ALERTING', 'PERFORMANCE',
    'PRIVACY', 'INTEGRATION', 'DASHBOARD', 'EXPORT',
    'CALCULATION', 'BUSINESS_RULES'
  ]),
  name: z.string(),
  description: z.string().optional(),
  settings: z.any(),
  isActive: z.boolean().optional()
});

// POST /api/analytics/config - Create analytics configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create analytics configurations
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'VENUE_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = analyticsConfigSchema.parse(body);

    // Verify venue access if venueId is provided
    if (data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: data.venueId,
          OR: [
            { adminId: session.user.id },
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }
    }

    // Check if configuration with same name/type/venue already exists
    // Map the incoming configType to valid enum values
    const validConfigType = data.configType === 'DATA_COLLECTION' ? 'ALERT_THRESHOLDS' : 
                           data.configType === 'REPORTING' ? 'REPORTING_SETTINGS' :
                           data.configType === 'PERFORMANCE' ? 'PERFORMANCE_TARGETS' :
                           'NOTIFICATION_RULES';

    const existingConfig = await prisma.analyticsConfig.findFirst({
      where: {
        venueId: data.venueId,
        configType: validConfigType,
        name: data.name
      }
    });

    if (existingConfig) {
      return NextResponse.json({ 
        error: 'Configuration with this name and type already exists for this venue' 
      }, { status: 409 });
    }

    const config = await prisma.analyticsConfig.create({
      data: {
        name: data.name,
        venueId: data.venueId,
        configType: validConfigType,
        settings: data.settings || {},
        isActive: data.isActive ?? true,
        // Note: dataRetentionDays and processingInterval don't exist in schema
        appliedBy: session.user.id
      }
    });

    // Log analytics event
    const analyticsEventData: any = {
      eventType: 'BUTTON_CLICK',
      category: 'SYSTEM',
      data: { description: `Analytics configuration created: ${data.name}` },
      userId: session.user.id,
      metadata: {
        configId: config.id,
        configType: data.configType,
        configName: data.name
      },

    };

    if (data.venueId) {
      analyticsEventData.venueId = data.venueId;
    }

    await prisma.analyticsEvent.create({
      data: analyticsEventData
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error creating analytics configuration:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/analytics/config - Get analytics configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const configType = searchParams.get('configType');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (venueId) {
      // Verify venue access
      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          OR: [
            { adminId: session.user.id },
            session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
          ]
        }
      });

      if (!venue) {
        return NextResponse.json({ error: 'Venue not found or access denied' }, { status: 404 });
      }

      where.venueId = venueId;
    } else if (session.user.role !== 'SUPER_ADMIN') {
      // Non-admin users can only see their venue configurations
      const userVenues = await prisma.venue.findMany({
        where: { adminId: session.user.id },
        select: { id: true }
      });
      where.OR = [
        { venueId: { in: userVenues.map(v => v.id) } },
        { venueId: null } // System-wide configurations
      ];
    }

    if (configType) where.configType = configType;
    if (isActive !== null) where.isActive = isActive === 'true';

    const [configurations, total] = await Promise.all([
      prisma.analyticsConfig.findMany({
        where,
        include: {
          venue: { select: { name: true } },
          applier: { select: { name: true } }
        },
        orderBy: [{ isActive: 'desc' }, { appliedAt: 'desc' }],
        take: limit,
        skip: offset
      }),
      prisma.analyticsConfig.count({ where })
    ]);

    return NextResponse.json({
      configurations,
      total,
      limit,
      offset,
      hasMore: offset + configurations.length < total
    });
  } catch (error) {
    console.error('Error fetching analytics configurations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/analytics/config/[id] - Update analytics configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update analytics configurations
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'VENUE_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const configId = url.pathname.split('/').pop();
    
    if (!configId) {
      return NextResponse.json({ error: 'Configuration ID required' }, { status: 400 });
    }

    const body = await request.json();
    const updateData = analyticsConfigSchema.partial().parse(body);

    // Find existing configuration and verify access
    const existingConfig = await prisma.analyticsConfig.findFirst({
      where: {
        id: configId,
        OR: [
          { venue: { adminId: session.user.id } },
          { venueId: null, AND: session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' } },
          session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
        ]
      }
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found or access denied' }, { status: 404 });
    }

    // Remove venueId from updateData as it shouldn't be updated
    const { venueId, ...safeUpdateData } = updateData;
    
    const config = await prisma.analyticsConfig.update({
      where: { id: configId },
      data: {
        ...safeUpdateData,
        appliedBy: session.user.id,
        appliedAt: new Date()
      }
    });

    // Log analytics event
    const updateEventData: any = {
      eventType: 'BUTTON_CLICK',
      category: 'SYSTEM',
      data: { description: `Analytics configuration updated: ${config.name}` },
      userId: session.user.id,
      metadata: {
        configId: config.id,
        configType: config.configType,
        configName: config.name,
        originalConfigId: existingConfig.id,
        updatedAt: new Date()
      },

    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating analytics configuration:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/analytics/config/[id] - Delete analytics configuration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete analytics configurations
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'VENUE_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const configId = url.pathname.split('/').pop();
    
    if (!configId) {
      return NextResponse.json({ error: 'Configuration ID required' }, { status: 400 });
    }

    // Find existing configuration and verify access
    const existingConfig = await prisma.analyticsConfig.findFirst({
      where: {
        id: configId,
        OR: [
          { venue: { adminId: session.user.id } },
          { venueId: null, AND: session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' } },
          session.user.role === 'SUPER_ADMIN' ? {} : { id: 'never' }
        ]
      }
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found or access denied' }, { status: 404 });
    }

    await prisma.analyticsConfig.delete({
      where: { id: configId }
    });

    // Log analytics event
    if (existingConfig.venueId) {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'BUTTON_CLICK',
          category: 'SYSTEM',
          data: { description: `Analytics configuration deleted: ${existingConfig.name}` },
          venueId: existingConfig.venueId,
          userId: session.user.id,
          metadata: {
            configId: existingConfig.id,
            configType: existingConfig.configType,
            configName: existingConfig.name
          },

        }
      });
    }

    return NextResponse.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting analytics configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
