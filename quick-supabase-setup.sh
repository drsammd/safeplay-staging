
#!/bin/bash

echo "🚀 Quick Supabase Setup for SafePlay™"
echo "===================================="
echo ""

# Check if Supabase URL is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your Supabase database URL"
    echo ""
    echo "Usage: ./quick-supabase-setup.sh 'YOUR_SUPABASE_URL'"
    echo ""
    echo "🔗 Get your URL from:"
    echo "   1. https://supabase.com/dashboard"
    echo "   2. Create project → Settings → Database → Connection string (URI)"
    echo "   3. Copy the full connection string"
    echo ""
    echo "📝 Example URL format:"
    echo "   postgresql://postgres.abc123:password@db.abc123.supabase.co:5432/postgres"
    echo ""
    exit 1
fi

SUPABASE_URL="$1"

# Validate URL format
if [[ ! "$SUPABASE_URL" == *"supabase.co"* ]]; then
    echo "❌ Error: This doesn't look like a Supabase URL"
    echo "Expected format: postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres"
    exit 1
fi

echo "📝 Updating configuration for Supabase..."

# Update .env
sed "s|DATABASE_URL=\".*\"|DATABASE_URL=\"$SUPABASE_URL\"|" .env.supabase > .env
echo "✅ Updated .env file"

# Update vercel.json
sed "s|postgresql://postgres\.XXXXXXXXXXXXXXXXXXXX:YOUR_PASSWORD@db\.XXXXXXXXXXXXXXXXXXXX\.supabase\.co:5432/postgres|$SUPABASE_URL|g" vercel.json.supabase > vercel.json
echo "✅ Updated vercel.json file"

# Test connection
echo ""
echo "🔧 Testing database connection..."
export DATABASE_URL="$SUPABASE_URL"

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Connecting to Supabase...');
prisma.\$connect()
  .then(() => {
    console.log('✅ Supabase connection successful!');
    return prisma.\$disconnect();
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   - Verify your Supabase URL is correct');
    console.log('   - Check your database password');
    console.log('   - Ensure the Supabase project is active');
    process.exit(1);
  });
" || exit 1

echo ""
echo "📊 Setting up database schema..."
npx prisma db push || exit 1

echo ""
echo "🌱 Seeding with demo data..."
npx prisma db seed || exit 1

echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "🔑 Demo Accounts Available:"
echo "   👨‍💼 Company Admin: admin@mysafeplay.ai / password123"
echo "   🏢 Venue Admin: venue@mysafeplay.ai / password123"
echo "   👨‍👩‍👧‍👦 Parent: parent@mysafeplay.ai / password123"
echo "   👤 John Doe: john@mysafeplay.ai / johndoe123"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test locally: npm run dev"
echo "   2. Deploy to Vercel: git add . && git commit -m 'Add Supabase' && git push"
echo ""
echo "✅ Your app is now Vercel-compatible!"
