
# Supabase Database Connectivity Fix

## Issue Diagnosis ✅
- **DNS Resolution**: Working (IPv6: `2600:1f1c:f9:4d0f:552:66c8:ec54:925b`)
- **URL Format**: Correct (all variations work with Prisma)
- **Network Connectivity**: FAILED - Cannot reach database server

## Root Cause 🔍
The Supabase database at `db.gjkhbzedenvvwgqivkcf.supabase.co` is not accessible due to:
1. Database might be paused/stopped in Supabase dashboard
2. IP whitelisting restrictions in Supabase
3. IPv6-only connectivity issues

## Solution Steps 🛠️

### Step 1: Check Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project: `safeplay-staging`
3. Check **Project Status**:
   - Ensure the database is **not paused**
   - Verify it's in **active** state

### Step 2: Fix IP Restrictions
1. In Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Network Restrictions**
3. Either:
   - **Disable "Restrict to project"** (recommended for staging)
   - Or add `0.0.0.0/0` to allowed IPs
4. Save changes

### Step 3: Get Correct Connection String
1. In Supabase Dashboard → **Settings** → **Database**
2. Copy the **Connection string** under **Connection parameters**
3. Choose **Pooled connection** for Vercel compatibility

### Step 4: Update Connection Strings
Use these verified formats with URL-encoded password:

```bash
# For Local Development (.env)
DATABASE_URL="postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres"

# For Vercel (vercel.json) - with pgbouncer
DATABASE_URL="postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

### Step 5: Alternative Connection Methods
If the main connection still fails, try these alternatives:

#### Option A: Direct Connection (Port 5432)
```
postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:5432/postgres?sslmode=require
```

#### Option B: Pooled Connection (Port 6543)
```
postgresql://postgres:SafePlay2025Beta%21@db.gjkhbzedenvvwgqivkcf.supabase.co:6543/postgres?pgbouncer=true
```

#### Option C: IPv4 Force (if available)
Get IPv4 address from Supabase dashboard and use IP directly:
```
postgresql://postgres:SafePlay2025Beta%21@[IPv4_ADDRESS]:5432/postgres
```

## Quick Test Commands 🧪

```bash
# Test connection after fixes
cd /home/ubuntu/safeplay-staging
node test-supabase-connection.js

# Test specific URL
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'YOUR_NEW_URL_HERE' } }
});
prisma.\$connect().then(() => console.log('✅ Success')).catch(e => console.log('❌', e.message));
"
```

## Immediate Action Required 🚨
**Go to Supabase Dashboard NOW and:**
1. Verify project is active (not paused)
2. Disable IP restrictions or whitelist all IPs
3. Get the current connection string

The database hostname is correct and DNS works, so this is purely a connectivity/permissions issue.
