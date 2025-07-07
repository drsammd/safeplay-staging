
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { QRCodeGenerator, QRCodeData } from '../../../utils/qr-generator';

// Mock QR codes storage (in production, this would be in a database)
let qrCodes: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const includeImage = searchParams.get('includeImage') === 'true';

    let filteredQRCodes = qrCodes;
    
    if (type) {
      filteredQRCodes = qrCodes.filter(qr => qr.type === type);
    }

    // Generate QR code images if requested
    if (includeImage) {
      for (const qr of filteredQRCodes) {
        if (!qr.qrCodeImage) {
          try {
            const qrData: QRCodeData = {
              id: qr.id,
              type: qr.type,
              purpose: qr.purpose,
              securityLevel: qr.securityLevel,
              childId: qr.childId,
              parentId: qr.parentId,
              venueId: qr.venueId,
              expiresAt: qr.expiresAt,
              maxUsage: qr.maxUsage,
              biometricRequired: qr.biometricRequired,
            };
            
            qr.qrCodeImage = await QRCodeGenerator.generateQRCodeImage(qrData);
          } catch (error) {
            console.error(`Error generating QR image for ${qr.id}:`, error);
          }
        }
      }
    }

    const response: any = {};
    
    if (type === 'child' || !type) {
      response.childQRCodes = filteredQRCodes.filter(qr => qr.type === 'child');
    }
    
    if (type === 'parent' || !type) {
      response.parentQRCodes = filteredQRCodes.filter(qr => qr.type === 'parent');
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      childId,
      parentId,
      purpose,
      securityLevel,
      expiresIn,
      maxUsage,
      biometricRequired,
      venueId,
    } = body;

    // Validate required fields
    if (!type || !purpose || !securityLevel) {
      return NextResponse.json(
        { error: 'Type, purpose, and security level are required' },
        { status: 400 }
      );
    }

    // Generate QR code data
    const qrCodeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const qrData: QRCodeData = {
      id: qrCodeId,
      type: type as 'child' | 'parent',
      purpose,
      securityLevel,
      childId,
      parentId,
      venueId: venueId || 'venue-1',
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString() : undefined,
      maxUsage,
      biometricRequired: biometricRequired || false,
    };

    // Validate QR data
    const validation = QRCodeGenerator.validateQRData(qrData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid QR code data', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate QR code string and image
    const qrString = QRCodeGenerator.generateQRData(qrData);
    const qrCodeImage = await QRCodeGenerator.generateQRCodeImage(qrData);

    // Create QR code record
    const qrCodeRecord = {
      id: qrCodeId,
      qrCode: qrString,
      qrCodeImage,
      purpose,
      securityLevel,
      isActive: true,
      usageCount: 0,
      maxUsage,
      expiresAt: qrData.expiresAt,
      type,
      childId,
      parentId,
      venueId: qrData.venueId,
      biometricRequired,
      createdAt: new Date().toISOString(),
      child: childId ? {
        firstName: 'Demo',
        lastName: 'Child',
        profilePhoto: '/api/placeholder/64/64',
      } : undefined,
      parent: parentId ? {
        name: 'Demo Parent',
        email: 'parent@example.com',
      } : undefined,
      venue: {
        name: 'Demo Venue',
        address: '123 Demo Street',
      },
      stats: {
        totalEvents: 0,
        todayEvents: 0,
        activeSessions: 0,
      },
      capabilities: ['QR_SCANNING', 'PHOTO_CAPTURE', 'TOUCHSCREEN'],
    };

    // Add to storage
    qrCodes.push(qrCodeRecord);

    console.log('QR code created:', {
      id: qrCodeId,
      type,
      purpose,
      securityLevel,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      qrCode: qrCodeRecord,
      message: 'QR code created successfully',
    });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to create QR code' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { qrCodeId, isActive, usageCount } = body;

    if (!qrCodeId) {
      return NextResponse.json(
        { error: 'QR code ID is required' },
        { status: 400 }
      );
    }

    // Find and update QR code
    const qrIndex = qrCodes.findIndex(qr => qr.id === qrCodeId);
    if (qrIndex === -1) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      );
    }

    // Update QR code
    if (typeof isActive === 'boolean') {
      qrCodes[qrIndex].isActive = isActive;
    }
    
    if (typeof usageCount === 'number') {
      qrCodes[qrIndex].usageCount = usageCount;
      qrCodes[qrIndex].lastUsedAt = new Date().toISOString();
    }

    console.log('QR code updated:', {
      id: qrCodeId,
      updates: { isActive, usageCount },
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      qrCode: qrCodes[qrIndex],
      message: 'QR code updated successfully',
    });
  } catch (error) {
    console.error('Error updating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to update QR code' },
      { status: 500 }
    );
  }
}
