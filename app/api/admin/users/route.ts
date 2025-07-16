
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const usersData = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        phoneVerified: true,
        identityVerified: true,
        verificationLevel: true,
        // Include related counts
        children: {
          select: { id: true }
        },
        managedVenues: {
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match frontend expectations
    const users = usersData.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      phoneVerified: user.phoneVerified,
      identityVerified: user.identityVerified,
      verificationLevel: user.verificationLevel,
      // Add missing fields expected by frontend
      isActive: true, // Default to active since we don't track this yet
      lastLogin: null, // We don't track last login yet
      emailVerified: null, // We don't have email verification timestamps
      status: user.verificationLevel === 'FULLY_VERIFIED' ? 'ACTIVE' : 'PENDING',
      childrenCount: user.children.length,
      venueCount: user.managedVenues.length
    }));

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page: 1,
        limit: 100,
        total: users.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const { email, name, phone, role, password } = await request.json();

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone?.trim() || null,
        role,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        phoneVerified: true,
        identityVerified: true,
        verificationLevel: true,
      }
    });

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
