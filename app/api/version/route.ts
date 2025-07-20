
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  let version = 'v1.5.40-alpha.14';
  let commit = '9b946de-deployment-readiness-comprehensive-fix';
  
  try {
    // Read version from VERSION file
    const versionPath = path.join(process.cwd(), 'VERSION');
    if (fs.existsSync(versionPath)) {
      version = fs.readFileSync(versionPath, 'utf8').trim();
    }
    
    // Try to read git commit hash
    try {
      const { execSync } = require('child_process');
      const gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim();
      commit = `${gitCommit}-v1.5.40-alpha.14-comprehensive-fix`;
    } catch (gitError) {
      console.log('Git commit detection failed, using fallback');
      commit = '9b946de-v1.5.40-alpha.14-comprehensive-fix';
    }
  } catch (error) {
    console.error('Error reading VERSION file:', error);
  }
  
  return NextResponse.json({
    version,
    environment: process.env.NODE_ENV || 'development',
    buildTime: new Date().toISOString(),
    commit,
    branch: 'main',
    deploymentStatus: 'comprehensive-fix-active',
    emergencyFixVersion: 'v1.5.40-alpha.14'
  });
}
