
#!/bin/bash

# SafePlay Automatic Deployment Script
# This script automates version updates and deployment to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if version parameter is provided
if [ -z "$1" ]; then
    print_error "Usage: ./scripts/deploy.sh <version>"
    print_error "Example: ./scripts/deploy.sh 1.2.9"
    exit 1
fi

NEW_VERSION=$1
CURRENT_DIR=$(pwd)

print_status "Starting automatic deployment for version $NEW_VERSION"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Update version in package.json
print_status "Updating version in package.json to $NEW_VERSION"
npm version $NEW_VERSION --no-git-tag-version

# Update version in version-tracker.tsx
print_status "Updating version in components/version-tracker.tsx"
sed -i "s/const currentVersion = '[^']*'/const currentVersion = '$NEW_VERSION'/" components/version-tracker.tsx

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    print_warning "No changes to commit. Version might already be up to date."
else
    # Stage all changes
    print_status "Staging changes for commit"
    git add .

    # Create commit with version update
    print_status "Creating commit for version $NEW_VERSION"
    git commit -m "chore(release): bump version to $NEW_VERSION

- Updated package.json version
- Updated version tracker component
- Ready for automatic deployment via GitHub Actions"

    # Push changes to trigger deployment
    print_status "Pushing changes to trigger automatic deployment"
    git push origin main

    print_success "✅ Version $NEW_VERSION has been committed and pushed!"
    print_success "🚀 GitHub Actions will now automatically deploy to production"
    print_success "📊 Monitor deployment progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
fi

print_status "Deployment script completed successfully!"
