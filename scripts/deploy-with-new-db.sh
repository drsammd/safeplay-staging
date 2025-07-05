#!/bin/bash

# Deployment script for mySafePlay with Vercel Postgres
echo "🚀 Starting deployment with Vercel Postgres..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_status "Dependencies check completed."
}

# Pull latest environment variables from Vercel
pull_env_vars() {
    print_status "Pulling environment variables from Vercel..."
    
    if ! npx vercel env pull .env.local; then
        print_error "Failed to pull environment variables. Make sure you're logged in to Vercel."
        exit 1
    fi
    
    print_status "Environment variables updated."
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."
    
    if ! npx prisma generate; then
        print_error "Failed to generate Prisma client."
        exit 1
    fi
    
    print_status "Prisma client generated successfully."
}

# Deploy database schema
deploy_schema() {
    print_status "Deploying database schema..."
    
    if ! npx prisma migrate deploy; then
        print_error "Failed to deploy database schema."
        exit 1
    fi
    
    print_status "Database schema deployed successfully."
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if ! node scripts/verify-migration.js; then
        print_error "Database connection test failed."
        exit 1
    fi
    
    print_status "Database connection test passed."
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! npx vercel --prod; then
        print_error "Failed to deploy to Vercel."
        exit 1
    fi
    
    print_status "Deployment to Vercel completed successfully."
}

# Main execution
main() {
    echo "================================================"
    echo "🔄 mySafePlay - Vercel Postgres Migration"
    echo "================================================"
    
    check_dependencies
    pull_env_vars
    generate_prisma
    deploy_schema
    test_connection
    deploy_to_vercel
    
    echo ""
    echo "================================================"
    echo "✅ Deployment completed successfully!"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "1. Test your application at: https://safeplay-staging.vercel.app"
    echo "2. Verify the database connection using: /api/test-db"
    echo "3. Monitor application logs for any issues"
    echo ""
}

# Run main function
main "$@"
