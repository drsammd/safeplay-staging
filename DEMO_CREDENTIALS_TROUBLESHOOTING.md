
# Demo Credentials Troubleshooting Guide

## Problem: Demo Credentials Not Working on Live Site

The live deployment at https://mysafeplay.ai is showing "invalid email or password" errors for demo credentials.

## Diagnostic Endpoints Created

### 1. Check Database State
```
GET https://mysafeplay.ai/api/debug/users
```
- Shows all users in database
- Checks if demo accounts exist
- Displays role statistics
- No authentication required

### 2. Setup Demo Accounts
```
POST https://mysafeplay.ai/api/setup-demo
GET https://mysafeplay.ai/api/setup-demo
```
- Creates/updates demo accounts with correct credentials
- Verifies password hashing
- Idempotent (safe to run multiple times)
- No authentication required

### 3. Test Authentication Flow
```
POST https://mysafeplay.ai/api/debug/test-auth
GET https://mysafeplay.ai/api/debug/test-auth
```
- Tests login flow with demo credentials
- Tests case-insensitive email handling
- Simulates exact NextAuth flow
- No authentication required

### 4. Check Environment
```
GET https://mysafeplay.ai/api/debug/environment
```
- Verifies environment variables
- Checks NextAuth configuration
- Shows deployment information
- No authentication required

### 5. Run Deployment Seeding
```
POST https://mysafeplay.ai/api/admin/deployment-seed
GET https://mysafeplay.ai/api/admin/deployment-seed
```
- Runs the deployment seed script
- Ensures critical accounts exist
- No authentication required

## Demo Credentials (Should Work After Setup)

```
Company Admin: admin@mysafeplay.ai / password123
Venue Admin: venue@mysafeplay.ai / password123
Parent: parent@mysafeplay.ai / password123
Demo Parent: john@mysafeplay.ai / johndoe123
```

## Troubleshooting Steps

### Step 1: Check Database State
1. Go to: `https://mysafeplay.ai/api/debug/users`
2. Look for demo accounts in the response
3. Check if users exist and have correct roles

### Step 2: Create Demo Accounts
1. POST to: `https://mysafeplay.ai/api/setup-demo`
2. This will create/update all demo accounts
3. Check the response for success status

### Step 3: Test Authentication
1. POST to: `https://mysafeplay.ai/api/debug/test-auth`
2. This tests all demo credentials
3. Should show "SUCCESS" for all accounts

### Step 4: Verify on Login Page
1. Go to: `https://mysafeplay.ai` 
2. Enter stakeholder password: `SafePlay2025Beta!`
3. Try demo credentials on login page

## Common Issues and Solutions

### Issue: Database Empty
**Solution:** Run setup-demo endpoint to create accounts

### Issue: Wrong Password Hash
**Solution:** The setup-demo endpoint will update with correct hash

### Issue: Case Sensitivity
**Solution:** Auth system normalizes emails to lowercase automatically

### Issue: Environment Variables
**Solution:** Check debug/environment endpoint for configuration

### Issue: Vercel Deployment
**Solution:** The build.sh script should run seeding automatically

## Manual Verification Commands

If you have access to the database directly:

```sql
-- Check if demo users exist
SELECT email, role, name, phone FROM "User" 
WHERE email IN (
  'admin@mysafeplay.ai',
  'venue@mysafeplay.ai', 
  'parent@mysafeplay.ai',
  'john@mysafeplay.ai'
);

-- Count total users
SELECT COUNT(*) as total_users FROM "User";

-- Check role distribution  
SELECT role, COUNT(*) as count FROM "User" GROUP BY role;
```

## Success Indicators

✅ **All endpoints return success: true**
✅ **Demo accounts exist in database with correct roles**
✅ **Authentication tests show SUCCESS for all credentials**
✅ **Login page accepts demo credentials**
✅ **Case-insensitive email login works**

## Emergency Recovery

If all else fails:
1. POST to `/api/admin/deployment-seed` to run full deployment script
2. This is the most comprehensive recovery method
3. It will ensure all critical accounts exist with correct credentials

## Implementation Details

- **Password Hashing:** Uses bcrypt with 12 rounds (same as NextAuth)
- **Email Normalization:** All emails stored and compared in lowercase
- **Idempotent:** All endpoints safe to call multiple times
- **No Auth Required:** All diagnostic endpoints are public for emergency access
- **Error Handling:** Comprehensive error logging and reporting

---

**Last Updated:** January 2025
**Status:** Ready for deployment testing
