
# 🚀 Complete Supabase Migration Guide

This guide will help you migrate from the current external PostgreSQL database to Supabase for Vercel compatibility.

## Why Supabase?

✅ **Vercel Compatible**: Native integration with Vercel deployments
✅ **PostgreSQL**: Same database engine, no schema changes needed  
✅ **Reliable**: Enterprise-grade infrastructure
✅ **Free Tier**: Generous free tier for development and staging

## Step 1: Create Supabase Database

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign up or log in

2. **Create New Project**
   - Click "New Project"
   - Project Name: `safeplay-staging`
   - Database Password: `SafePlay2025Beta!` (or your preferred password)
   - Region: Choose closest to your users (e.g., `US East (North Virginia)`)
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 1-2 minutes
   - You'll see a progress indicator

## Step 2: Get Database Connection String

1. **Navigate to Database Settings**
   - In your project dashboard, click on "Settings" (gear icon)
   - Select "Database" from the sidebar

2. **Copy Connection String**
   - Find the "Connection String" section
   - Select "URI" tab
   - Copy the connection string (it looks like this):
   ```
   postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

3. **Important**: Replace `[YOUR-PASSWORD]` with the actual password you set during project creation

## Step 3: Run Migration Script

1. **Make Script Executable**
   ```bash
   chmod +x migrate-to-supabase.sh
   ```

2. **Run Migration**
   ```bash
   ./migrate-to-supabase.sh 'postgresql://postgres.YOUR_REF:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres'
   ```

   **Replace with your actual connection string from Step 2!**

## Step 4: Verify Migration

The script will automatically:
- ✅ Update `.env` and `vercel.json` files
- ✅ Test database connection
- ✅ Create all database tables
- ✅ Seed with demo accounts and data
- ✅ Verify demo accounts work

## Step 5: Test Local Application

```bash
npm run dev
```

Visit `http://localhost:3000` and test login with:
- **Company Admin**: admin@mysafeplay.ai / password123
- **Venue Admin**: venue@mysafeplay.ai / password123  
- **Parent**: parent@mysafeplay.ai / password123
- **John Doe**: john@mysafeplay.ai / johndoe123

## Step 6: Deploy to Vercel

Once migration is complete:

```bash
git add .
git commit -m "Migrate to Supabase database for Vercel compatibility"
git push
```

Your Vercel deployment should now work without database connectivity issues!

## Troubleshooting

### Connection Issues
- Verify the connection string format is correct
- Ensure password doesn't contain special characters that need URL encoding
- Check if your IP is allowed (Supabase allows all IPs by default)

### Migration Fails
- Check if the database is completely empty before migration
- Verify you have the correct permissions on the Supabase project
- Try running `npx prisma db push --force-reset` manually

### Demo Accounts Not Working
- Run `npx prisma db seed` again
- Check if the seed script completed without errors
- Verify user count with: `npx prisma studio`

## Support

If you encounter issues:
1. Check the Supabase dashboard for any error messages
2. Verify the connection string is correct
3. Ensure your Supabase project is active and not paused

---

**Next Steps**: Once migration is complete, your application will be fully compatible with Vercel deployments! 🎉
