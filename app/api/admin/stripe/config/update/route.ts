
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Checking admin authentication...');
    
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For demo/staging, allow the test admin user
    const isAdmin = session.user.email === 'john@doe.com' || session.user.email === 'admin@safeplay.com';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { envVariables } = body;

    if (!envVariables || typeof envVariables !== 'object') {
      return NextResponse.json(
        { error: 'Environment variables object is required' },
        { status: 400 }
      );
    }

    console.log('✅ Admin authenticated, updating environment variables...');
    console.log('🔧 Variables to update:', Object.keys(envVariables));

    // Read current .env file
    const envPath = join(process.cwd(), '.env');
    let envContent = '';
    
    try {
      envContent = await readFile(envPath, 'utf-8');
    } catch (error) {
      console.log('📄 .env file not found, creating new one');
      envContent = '';
    }

    // Update or add each variable
    let updatedContent = envContent;
    const updatedKeys: string[] = [];
    const addedKeys: string[] = [];

    for (const [key, value] of Object.entries(envVariables)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}="${value}"`;
      
      if (regex.test(updatedContent)) {
        // Update existing variable
        updatedContent = updatedContent.replace(regex, newLine);
        updatedKeys.push(key);
      } else {
        // Add new variable
        updatedContent += updatedContent.endsWith('\n') ? '' : '\n';
        updatedContent += `${newLine}\n`;
        addedKeys.push(key);
      }
    }

    // Write updated .env file
    await writeFile(envPath, updatedContent, 'utf-8');

    console.log('✅ Environment variables updated successfully');
    console.log('📝 Updated keys:', updatedKeys);
    console.log('➕ Added keys:', addedKeys);

    return NextResponse.json({
      success: true,
      message: 'Environment variables updated successfully',
      summary: {
        totalVariables: Object.keys(envVariables).length,
        updated: updatedKeys.length,
        added: addedKeys.length,
        updatedKeys,
        addedKeys
      }
    });

  } catch (error) {
    console.error('❌ Error updating environment variables:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update environment variables',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
