
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { computerVisionService } from '../../../../lib/services/computer-vision-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const zoneCapacity = formData.get('zoneCapacity') ? 
      parseInt(formData.get('zoneCapacity') as string) : undefined;
    const zoneArea = formData.get('zoneArea') ? 
      parseFloat(formData.get('zoneArea') as string) : undefined;

    if (!imageFile) {
      return NextResponse.json({ 
        error: 'Image file is required' 
      }, { status: 400 });
    }

    // Convert image to buffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Perform crowd density analysis
    const analysis = await computerVisionService.analyzeCrowdDensity(
      imageBuffer,
      zoneCapacity,
      zoneArea
    );

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error in crowd analysis:', error);
    return NextResponse.json(
      { error: 'Crowd analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
