
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  let version = 'v1.5.40.9-deployment-tracking-fix';
  // Use VERCEL_GIT_COMMIT_SHA for accurate deployment tracking (Vercel's recommendation)
  let commit = process.env.VERCEL_GIT_COMMIT_SHA || 'local-development';
  
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
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'main',
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null
  });
}
