#!/bin/bash

# mySafePlay AGGRESSIVE Cleanup Script
# This script aggressively reduces size to get well under Vercel's 2GB limit

set -e

echo "🚨 AGGRESSIVE CLEANUP MODE - This will reduce git history!"
echo "📊 Current size: $(du -sh . | cut -f1)"

echo ""
echo "🗑️  Phase 1: Remove build artifacts..."
rm -rf .next
rm -rf dist
rm -rf build
rm -rf out
rm -rf coverage
rm -rf .turbo
rm -rf .vercel

echo "🗑️  Phase 2: Aggressive git cleanup..."
echo "Current .git size: $(du -sh .git | cut -f1)"

# Clean git aggressively
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git repack -ad

echo "New .git size: $(du -sh .git | cut -f1)"

echo "🗑️  Phase 3: Remove unnecessary files from node_modules..."
# Remove source maps and documentation from node_modules
find node_modules -name "*.map" -delete 2>/dev/null || true
find node_modules -name "*.md" -delete 2>/dev/null || true
find node_modules -name "README*" -delete 2>/dev/null || true
find node_modules -name "CHANGELOG*" -delete 2>/dev/null || true
find node_modules -name "LICENSE*" -delete 2>/dev/null || true
find node_modules -name "*.txt" -delete 2>/dev/null || true
find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "example" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true

echo "🗑️  Phase 4: Clean up large public assets..."
# Compress or remove large images if any
find public -name "*.png" -size +1M -exec ls -lh {} \; 2>/dev/null || true
find public -name "*.jpg" -size +1M -exec ls -lh {} \; 2>/dev/null || true
find public -name "*.jpeg" -size +1M -exec ls -lh {} \; 2>/dev/null || true

echo "🗑️  Phase 5: Remove any remaining large files..."
find . -type f -size +10M -not -path "./node_modules/@next/*" -not -path "./node_modules/@prisma/*" -not -path "./node_modules/prisma/*" -not -path "./node_modules/.prisma/*" -not -path "./node_modules/aws-sdk/*" -not -path "./.git/*" -exec ls -lh {} \; 2>/dev/null || true

echo ""
echo "📊 Size after aggressive cleanup:"
du -sh .

echo ""
echo "🔨 Testing build..."
npm run build

echo ""
echo "✅ Final size:"
du -sh . | tee final_size.txt

FINAL_SIZE_GB=$(du -sb . | awk '{printf "%.2f", $1/1024/1024/1024}')
echo "📊 Final size: ${FINAL_SIZE_GB}GB"

if (( $(echo "$FINAL_SIZE_GB < 2.0" | awk '{print ($1 < $2)}') )); then
    echo "✅ SUCCESS: Under 2GB limit!"
else
    echo "⚠️  Still over 2GB. Consider:"
    echo "   - Creating fresh git repository"
    echo "   - Moving to monorepo structure"
    echo "   - Using external asset storage"
fi

echo ""
echo "📋 Creating deployment summary..."
cat > deployment_summary.txt << EOF
mySafePlay Deployment Summary
============================
Date: $(date)

AGGRESSIVE CLEANUP RESULTS:
- Removed build artifacts (.next, dist, etc.)
- Cleaned git history aggressively
- Removed documentation/tests from node_modules
- Cleaned source maps and unnecessary files

Final Size: ${FINAL_SIZE_GB}GB

Build Status: ✅ Successful

Ready for Vercel deployment: $(if (( $(echo "$FINAL_SIZE_GB < 2.0" | awk '{print ($1 < $2)}') )); then echo "YES"; else echo "NO - Still over 2GB"; fi)

Next Steps:
1. Deploy to Vercel
2. Monitor deployment size
3. Run this script before future deployments
EOF

echo "🎉 Aggressive cleanup complete!"
echo "📖 Check deployment_summary.txt for details"
