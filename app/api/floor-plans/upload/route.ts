
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'VENUE_ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const venueId = formData.get('venueId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!venueId) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed types: PNG, JPG, JPEG, PDF, SVG' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB' 
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'floor-plans');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;
    const filepath = join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Return file URL
    const fileUrl = `/uploads/floor-plans/${filename}`;

    // Determine file type enum
    let fileType = 'PNG';
    switch (file.type) {
      case 'image/jpeg':
      case 'image/jpg':
        fileType = 'JPG';
        break;
      case 'application/pdf':
        fileType = 'PDF';
        break;
      case 'image/svg+xml':
        fileType = 'SVG';
        break;
      default:
        fileType = 'PNG';
    }

    // If it's an image, we could extract dimensions here
    let dimensions = null;
    if (file.type.startsWith('image/')) {
      // For now, we'll set placeholder dimensions
      // In a real implementation, you'd use a library like sharp to get actual dimensions
      dimensions = {
        width: 1000,
        height: 800,
        scale: 1.0
      };
    }

    return NextResponse.json({
      fileUrl,
      fileType,
      originalFileName: file.name,
      fileSize: file.size,
      dimensions,
      venueId
    });

  } catch (error) {
    console.error('Error uploading floor plan:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
