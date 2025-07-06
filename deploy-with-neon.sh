#!/bin/bash

# SafePlay Neon Database Deployment Script
# This script handles Vercel authentication, environment setup, and deployment

set -e  # Exit on any error

echo "🚀 SafePlay Neon Database Deployment Script"
echo "============================================"

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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
    print_error "Please run this script from the safeplay-staging directory"
    exit 1
fi

print_status "Checking Node.js and npm versions..."
node -v
npm -v

# Step 1: Check Vercel CLI
print_status "Checking Vercel CLI..."
if ! command -v npx &> /dev/null; then
    print_error "npx not found. Please install Node.js"
    exit 1
fi

# Step 2: Check if already authenticated
print_status "Checking Vercel authentication..."
if npx vercel whoami &> /dev/null; then
    print_success "Already authenticated with Vercel"
else
    print_warning "Not authenticated with Vercel"
    
    if [ -n "$VERCEL_TOKEN" ]; then
        print_status "Using VERCEL_TOKEN environment variable..."
        npx vercel login --token "$VERCEL_TOKEN"
    else
        print_error "Please set VERCEL_TOKEN environment variable or run:"
        echo "export VERCEL_TOKEN=your_token_here"
        echo "Then run this script again."
        exit 1
    fi
fi

# Step 3: Pull environment variables
print_status "Pulling environment variables from Vercel..."
if npx vercel env pull .env.local --yes; then
    print_success "Environment variables pulled successfully"
else
    print_warning "Failed to pull environment variables. Using existing .env.local"
fi

# Step 4: Check environment variables
print_status "Checking required environment variables..."
if [ -f ".env.local" ]; then
    if grep -q "DATABASE_URL=" .env.local && ! grep -q "postgresql://username:password" .env.local; then
        print_success "DATABASE_URL found in .env.local"
    else
        print_error "DATABASE_URL not properly configured in .env.local"
        print_status "Please update .env.local with your actual Neon database credentials"
        exit 1
    fi
else
    print_error ".env.local file not found"
    exit 1
fi

# Step 5: Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Step 6: Test database connection
print_status "Testing database connection..."
if node test-neon-connection.js; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    print_status "Please check your DATABASE_URL in .env.local"
    exit 1
fi

# Step 7: Run database migrations
print_status "Running database migrations..."
if npx prisma migrate deploy; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations failed or no migrations to run"
fi

# Step 8: Test local development (optional)
read -p "Do you want to test local development server? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting local development server..."
    print_status "Press Ctrl+C to stop and continue with deployment"
    npm run dev &
    DEV_PID=$!
    sleep 5
    kill $DEV_PID 2>/dev/null || true
    print_success "Local development test completed"
fi

# Step 9: Deploy to Vercel
read -p "Do you want to deploy to Vercel now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deploying to Vercel..."
    if npx vercel --prod; then
        print_success "🎉 Deployment successful!"
        print_status "Your app should be live on Vercel"
    else
        print_error "Deployment failed"
        exit 1
    fi
else
    print_status "Skipping deployment. You can deploy later with: npx vercel --prod"
fi

print_success "🎉 Script completed successfully!"
echo ""
echo "Next steps:"
echo "1. Check your Vercel dashboard for deployment status"
echo "2. Test your live application"
echo "3. Monitor for any runtime errors"
