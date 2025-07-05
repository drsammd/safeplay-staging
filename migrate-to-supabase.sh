
#!/bin/bash

echo "🚀 SafePlay™ Supabase Migration Script"
echo "======================================"
echo ""

# Check if DATABASE_URL is provided as argument
if [ -z "$1" ]; then
    echo "❌ Error: Supabase DATABASE_URL required"
    echo ""
    echo "Usage: ./migrate-to-supabase.sh 'postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres'"
    echo ""
    echo "To get your Supabase URL:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Create a new project or use existing"
    echo "3. Go to Settings > Database"
    echo "4. Copy the connection string (URI format)"
    echo ""
    exit 1
fi

DATABASE_URL="$1"

echo "📝 Updating configuration files..."

# Backup current .env
cp .env .env.backup
echo "✅ Backed up current .env to .env.backup"

# Update .env file
sed -i "s|DATABASE_URL=\"[^\"]*\"|DATABASE_URL=\"$DATABASE_URL\"|g" .env
echo "✅ Updated .env file"

# Update vercel.json
cp vercel.json vercel.json.backup
echo "✅ Backed up current vercel.json to vercel.json.backup"

# Update vercel.json with new DATABASE_URL
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
config.env.DATABASE_URL = '$DATABASE_URL';
config.build.env.DATABASE_URL = '$DATABASE_URL';
fs.writeFileSync('vercel.json', JSON.stringify(config, null, 2));
console.log('✅ Updated vercel.json file');
"

echo ""
echo "🔧 Testing database connection..."

# Test the connection
export DATABASE_URL="$DATABASE_URL"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful!');
    return prisma.\$disconnect();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
" || exit 1

echo ""
echo "📊 Pushing database schema to Supabase..."
npx prisma db push --force-reset || exit 1

echo ""
echo "🌱 Seeding database with demo data..."
npx prisma db seed || exit 1

echo ""
echo "🎉 Migration to Supabase completed successfully!"
echo ""
echo "🔑 Demo Account Credentials:"
echo "Company Admin: admin@mysafeplay.ai / password123"
echo "Venue Admin: venue@mysafeplay.ai / password123"
echo "Parent: parent@mysafeplay.ai / password123"
echo "John Doe: john@mysafeplay.ai / johndoe123"
echo ""
echo "🚀 Your application is now ready for Vercel deployment!"
