
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read package.json to get the current version
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    
    const versionInfo = {
      version: packageJson.version,
      buildTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      commit: 'version-display-fix-1.2.6',
      branch: 'main'
    };
    
    return NextResponse.json(versionInfo);
  } catch (error) {
    // Fallback version info if package.json can't be read
    return NextResponse.json({
      version: '1.2.6-staging',
      buildTimestamp: new Date().toISOString(),
      environment: 'staging',
      commit: 'version-display-fix-1.2.6',
      branch: 'main'
    });
  }
}
