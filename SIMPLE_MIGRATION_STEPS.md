
# 🚀 Simple 3-Step Supabase Migration

Replace your external database with Vercel-compatible Supabase in 3 easy steps!

## Step 1: Create Supabase Database (2 minutes)

1. **Go to**: https://supabase.com/dashboard
2. **Click**: "New Project"
3. **Fill in**:
   - Name: `safeplay-staging`
   - Password: `SafePlay2025Beta!`
   - Region: US East (or closest to you)
4. **Click**: "Create new project"
5. **Wait**: 1-2 minutes for setup

## Step 2: Get Connection String (30 seconds)

1. **In your new project**: Go to Settings → Database
2. **Find**: "Connection String" section
3. **Select**: "URI" tab
4. **Copy**: The full connection string
   ```
   postgresql://postgres.abcd1234:SafePlay2025Beta!@db.abcd1234.supabase.co:5432/postgres
   ```

## Step 3: Run Migration (30 seconds)

```bash
# Make script executable
chmod +x quick-supabase-setup.sh

# Run with your Supabase URL (replace with your actual URL)
./quick-supabase-setup.sh 'postgresql://postgres.YOUR_REF:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres'
```

**That's it!** ✅

## What This Does:

- ✅ Updates all configuration files
- ✅ Tests database connection  
- ✅ Creates all database tables
- ✅ Seeds demo accounts and data
- ✅ Makes your app Vercel-compatible

## Test Your Migration:

```bash
# Test locally
npm run dev

# Deploy to Vercel
git add .
git commit -m "Migrate to Supabase for Vercel compatibility"
git push
```

## Demo Accounts:

- **Company Admin**: admin@mysafeplay.ai / password123
- **Venue Admin**: venue@mysafeplay.ai / password123  
- **Parent**: parent@mysafeplay.ai / password123
- **John Doe**: john@mysafeplay.ai / johndoe123

---

**Result**: No more "Can't reach database server" errors on Vercel! 🎉
