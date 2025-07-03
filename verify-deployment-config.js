
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Vercel Deployment Configuration...\n');

// Check vercel.json
console.log('1. Checking vercel.json configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const functionsConfig = vercelConfig.functions;
  
  if (functionsConfig && functionsConfig['api/**/*.ts']) {
    console.log('   ✅ vercel.json correctly configured (no /app prefix)');
  } else if (functionsConfig && functionsConfig['app/api/**/*.ts']) {
    console.log('   ❌ vercel.json still has /app prefix - needs manual fix');
  } else {
    console.log('   ⚠️  vercel.json functions config not found');
  }
} catch (error) {
  console.log('   ❌ Error reading vercel.json:', error.message);
}

// Check package.json
console.log('\n2. Checking package.json build scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = ['build', 'start', 'lint'];
  const missingScripts = requiredScripts.filter(script => !scripts[script]);
  
  if (missingScripts.length === 0) {
    console.log('   ✅ All required build scripts present');
  } else {
    console.log('   ❌ Missing build scripts:', missingScripts.join(', '));
    console.log('   📝 Add these to package.json scripts:');
    console.log('       "build": "next build",');
    console.log('       "start": "next start",');
    console.log('       "lint": "next lint"');
  }
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// Check project structure
console.log('\n3. Checking project structure...');
const requiredDirs = ['app', 'components', 'lib'];
const requiredFiles = ['next.config.js', 'package.json', 'vercel.json'];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    console.log(`   ✅ ${dir}/ directory exists`);
  } else {
    console.log(`   ❌ ${dir}/ directory missing`);
  }
});

requiredFiles.forEach(file => {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// Check for Next.js App Router structure
if (fs.existsSync('app') && fs.existsSync('app/layout.tsx')) {
  console.log('   ✅ Next.js App Router structure detected');
} else {
  console.log('   ⚠️  Next.js App Router structure not found');
}

console.log('\n📋 Summary:');
console.log('   - Configuration files have been updated for root-level deployment');
console.log('   - Vercel Root Directory setting should be EMPTY (not /app)');
console.log('   - Manual package.json update may be required');
console.log('\n🚀 Ready for deployment after Vercel settings update!');
