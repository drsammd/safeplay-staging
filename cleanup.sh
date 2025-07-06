#!/bin/bash

# mySafePlay Comprehensive Cleanup Script
# This script removes all unnecessary files to get under Vercel's 2GB limit

set -e  # Exit on any error

echo "🧹 Starting comprehensive cleanup of mySafePlay project..."
echo "📊 Current size before cleanup:"
du -sh .

echo ""
echo "🗑️  Phase 1: Removing core dumps and crash files..."
rm -f ./core
rm -f ./app/core
rm -f ./*core*
find . -name "core.*" -type f -delete 2>/dev/null || true
find . -name "*.core" -type f -delete 2>/dev/null || true

echo "🗑️  Phase 2: Cleaning build artifacts and caches..."
rm -rf .next
rm -rf dist
rm -rf build
rm -rf out
rm -rf .turbo
rm -rf .vercel
rm -rf coverage
rm -rf .nyc_output

echo "🗑️  Phase 3: Cleaning logs and temporary files..."
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-error.log*" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
rm -rf tmp
rm -rf temp
rm -rf .tmp

echo "🗑️  Phase 4: Cleaning development artifacts..."
find . -name "*.map" -type f -delete 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
rm -rf .eslintcache
rm -rf .swc

echo "🗑️  Phase 5: Removing large documentation (moving to archive)..."
if [ -d "docs-pdf" ]; then
    mkdir -p ../safeplay-archive
    mv docs-pdf ../safeplay-archive/ 2>/dev/null || rm -rf docs-pdf
    echo "📁 Moved docs-pdf to ../safeplay-archive/"
fi

if [ -d "docs" ] && [ "$(du -sm docs | cut -f1)" -gt 5 ]; then
    mkdir -p ../safeplay-archive
    mv docs ../safeplay-archive/ 2>/dev/null || rm -rf docs
    echo "📁 Moved large docs to ../safeplay-archive/"
fi

echo "🗑️  Phase 6: Cleaning node_modules and reinstalling production only..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "📦 Installing production dependencies only..."
npm ci --omit=dev --ignore-scripts --no-audit --no-fund

echo "🗑️  Phase 7: Regenerating Prisma client..."
npx prisma generate

echo "🗑️  Phase 8: Final cleanup of any remaining large files..."
find . -type f -size +50M -not -path "./node_modules/*" -not -path "./.git/*" -exec ls -lh {} \; 2>/dev/null || true

echo "🗑️  Phase 9: Git cleanup (optional - removes old history)..."
if [ -d ".git" ]; then
    echo "⚠️  Git repository size: $(du -sh .git | cut -f1)"
    echo "💡 Consider running 'git gc --aggressive --prune=now' to reduce .git size"
    echo "💡 Or create a fresh repository if history isn't needed"
fi

echo ""
echo "✅ Cleanup complete!"
echo "📊 Final size:"
du -sh . | tee post_cleanup_size.txt

echo ""
echo "📋 Summary written to cleanup_summary.txt"
cat > cleanup_summary.txt << EOF
mySafePlay Cleanup Summary
=========================
Date: $(date)

Files/Directories Removed:
- Core dump files (./core, ./app/core)
- Build artifacts (.next, dist, build, out)
- Cache directories (.turbo, .vercel, coverage)
- Log files (*.log, npm-debug.log*, etc.)
- Source maps (*.map files)
- TypeScript build info (*.tsbuildinfo)
- Development artifacts (.eslintcache, .swc)
- Large documentation (docs-pdf moved to archive)
- Previous node_modules (reinstalled production-only)

Production Dependencies Reinstalled:
- npm ci --omit=dev --ignore-scripts
- Prisma client regenerated

Final Size: $(cat post_cleanup_size.txt)

To prevent future size issues:
1. Run this script before each deployment
2. Add .next/, dist/, *.log to .gitignore
3. Use 'npm ci --omit=dev' for production builds
4. Keep documentation in separate repository
5. Monitor core dumps and remove immediately
EOF

echo "🎉 Project is now ready for Vercel deployment!"
echo "📖 Check cleanup_summary.txt for details"
