
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { VerificationMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/pickup - Get pickup authorizations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const isActive = searchParams.get('isActive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (session.user.role === 'PARENT') {
      where.authorizedBy = session.user.id;
    }

    if (childId) where.childId = childId;
    if (searchParams.get('isActive') !== null) where.isActive = isActive;

    const pickupAuthorizations = await prisma.pickupAuthorization.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
          },
        },
        authorizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      pickupAuthorizations,
      pagination: {
        limit,
        offset,
        total: await prisma.pickupAuthorization.count({ where }),
      },
    });
  } catch (error) {
    console.error('Error fetching pickup authorizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pickup authorizations' },
      { status: 500 }
    );
  }
}

// POST /api/pickup - Create pickup authorization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      childId,
      authorizedPersonName,
      authorizedPersonId,
      relationship,
      phoneNumber,
      email,
      photoIdUrl,
      emergencyContact = false,
      isPermanent = false,
      validUntil,
      specialInstructions,
      requiresBiometric = true,
      requiresPhotoId = true,
      requiresSecondaryAuth = false,
      custodyDocuments = [],
    } = body;

    // Validate required fields
    if (!childId || !authorizedPersonName || !relationship || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, authorizedPersonName, relationship, phoneNumber' },
        { status: 400 }
      );
    }

    // Verify parent has access to this child
    if (session.user.role === 'PARENT') {
      const child = await prisma.child.findFirst({
        where: { id: childId, parentId: session.user.id },
      });
      if (!child) {
        return NextResponse.json(
          { error: 'Child not found or access denied' },
          { status: 403 }
        );
      }
    }

    // Generate authorization code
    const authorizationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const pickupAuthorization = await prisma.pickupAuthorization.create({
      data: {
        childId,
        parentId: session.user.role === 'PARENT' ? session.user.id : body.parentId,
        authorizedPersonName,
        authorizedPersonId,
        relationship,
        phoneNumber,
        email,
        photoIdUrl,
        emergencyContact,
        isPermanent,
        validUntil: validUntil ? new Date(validUntil) : null,
        specialInstructions,
        requiresBiometric,
        requiresPhotoId,
        requiresSecondaryAuth,
        authorizationCode,
        custodyDocuments,
        status: 'PENDING',
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      pickupAuthorization,
      message: 'Pickup authorization created successfully',
    });
  } catch (error) {
    console.error('Error creating pickup authorization:', error);
    return NextResponse.json(
      { error: 'Failed to create pickup authorization' },
      { status: 500 }
    );
  }
}

// PATCH /api/pickup - Update pickup authorization status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { authorizationId, status, rejectedReason, notes } = body;

    if (!authorizationId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: authorizationId, status' },
        { status: 400 }
      );
    }

    // Only venue admin or company admin can approve/reject
    if (session.user.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Only venue staff can approve/reject pickup authorizations' },
        { status: 403 }
      );
    }

    const updateData: any = {
      status,
      notes,
    };

    if (status === 'APPROVED') {
      updateData.approvedBy = session.user.id;
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedReason = rejectedReason;
    }

    const pickupAuthorization = await prisma.pickupAuthorization.update({
      where: { id: authorizationId },
      data: updateData,
      include: {
        child: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        parent: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      pickupAuthorization,
      message: `Pickup authorization ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Error updating pickup authorization:', error);
    return NextResponse.json(
      { error: 'Failed to update pickup authorization' },
      { status: 500 }
    );
  }
}
