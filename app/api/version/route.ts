
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  let version = '1.5.19';
  let commit = 'v1.5.19-signup-fixes';
  
  try {
    // Read version from VERSION file
    const versionPath = path.join(process.cwd(), 'VERSION');
    if (fs.existsSync(versionPath)) {
      version = fs.readFileSync(versionPath, 'utf8').trim();
    }
  } catch (error) {
    console.error('Error reading VERSION file:', error);
  }
  
  return NextResponse.json({
    version,
    environment: process.env.NODE_ENV || 'development',
    buildTime: new Date().toISOString(),
    commit,
    branch: 'main'
  });
}
