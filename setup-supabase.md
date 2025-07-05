
# Supabase Database Setup Instructions

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `safeplay-staging`
   - Database Password: `SafePlay2025Beta!`
   - Region: Choose closest to your users (e.g., US East)
5. Click "Create new project"

## Step 2: Get Database URL

1. In your Supabase dashboard, go to Settings > Database
2. Find the "Connection string" section
3. Copy the "URI" connection string
4. It should look like: `postgresql://postgres.{ref}:{password}@{hostname}/postgres`

## Step 3: Update Environment Variables

Replace the DATABASE_URL in:
- `.env` file (local development)
- `vercel.json` file (Vercel deployment)

The format should be:
```
DATABASE_URL="postgresql://postgres.{ref}:{password}@{hostname}/postgres"
```

## Step 4: Run Migration

After updating the DATABASE_URL:
```bash
npx prisma db push
npx prisma db seed
```

This will:
- Create all tables in your Supabase database
- Seed with demo accounts and data
