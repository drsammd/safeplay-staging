
/**
 * Deployment Verification Script
 * Verifies that all necessary files and configurations are ready for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SafePlay Deployment Verification\n');

// Check for required files
const requiredFiles = [
  '.next/routes-manifest.json',
  '.next/build-manifest.json',
  '.next/app-build-manifest.json',
  '.next/prerender-manifest.json',
  'package.json',
  'vercel.json'
];

let allFilesExist = true;

console.log('📁 Checking required build files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check routes-manifest.json structure
console.log('\n🔍 Verifying routes-manifest.json...');
try {
  const routesManifest = JSON.parse(fs.readFileSync('.next/routes-manifest.json', 'utf8'));
  console.log(`✅ Routes manifest version: ${routesManifest.version}`);
  console.log(`✅ Static routes: ${routesManifest.staticRoutes.length}`);
  console.log(`✅ Dynamic routes: ${routesManifest.dynamicRoutes.length}`);
  
  // Check for critical routes
  const hasHomePage = routesManifest.staticRoutes.some(route => route.page === '/');
  const hasApiRoutes = routesManifest.dynamicRoutes.some(route => route.page.startsWith('/api/'));
  
  if (hasHomePage) {
    console.log('✅ Home page route found');
  } else {
    console.log('❌ Home page route missing');
    allFilesExist = false;
  }
  
  if (hasApiRoutes) {
    console.log('✅ API routes found');
  } else {
    console.log('❌ API routes missing');
    allFilesExist = false;
  }
  
} catch (error) {
  console.log('❌ Failed to parse routes-manifest.json:', error.message);
  allFilesExist = false;
}

// Check vercel.json configuration
console.log('\n🔍 Verifying vercel.json configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.framework === 'nextjs') {
    console.log('✅ Framework set to nextjs');
  } else {
    console.log('❌ Framework not set to nextjs');
  }
  
  if (vercelConfig.env && vercelConfig.env.NEXT_OUTPUT_MODE === '') {
    console.log('✅ NEXT_OUTPUT_MODE properly configured');
  } else {
    console.log('❌ NEXT_OUTPUT_MODE not properly configured');
  }
  
  if (vercelConfig.buildCommand) {
    console.log(`✅ Build command: ${vercelConfig.buildCommand}`);
  }
  
} catch (error) {
  console.log('❌ Failed to parse vercel.json:', error.message);
  allFilesExist = false;
}

// Check package.json
console.log('\n🔍 Verifying package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ Build script found');
  } else {
    console.log('❌ Build script missing');
    allFilesExist = false;
  }
  
  if (packageJson.dependencies && packageJson.dependencies.next) {
    console.log(`✅ Next.js version: ${packageJson.dependencies.next}`);
  } else {
    console.log('❌ Next.js dependency missing');
    allFilesExist = false;
  }
  
} catch (error) {
  console.log('❌ Failed to parse package.json:', error.message);
  allFilesExist = false;
}

// Final verification
console.log('\n🎯 Deployment Readiness Summary:');
if (allFilesExist) {
  console.log('✅ All checks passed! SafePlay is ready for Vercel deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Commit all changes to your git repository');
  console.log('2. Push to your main branch');
  console.log('3. Deploy to Vercel using the Vercel dashboard or CLI');
  console.log('4. Set environment variables in Vercel dashboard');
  
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}
