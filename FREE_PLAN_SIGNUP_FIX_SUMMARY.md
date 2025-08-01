
# FREE Plan Signup Fix - v1.5.60 HOTFIX

## Problem Identified
The FREE plan signup was failing with the error:
```
Payment processing failed during account creation
Unknown argument `autoRenew`. Available options are marked with ?.
```

## Root Cause
The `UserSubscription` model in the Prisma schema contained an `autoRenew` field that did not exist in the actual database table. This caused Prisma to throw an error when trying to create subscription records during the signup process.

## Fix Applied
1. **Removed `autoRenew` field from subscription creation in `lib/clean-account-initializer.ts`**:
   - Removed the `autoRenew` variable and its usage
   - Updated subscription data object to exclude the non-existent field
   - Added comment documenting the fix

2. **Updated Prisma schema in `prisma/schema.prisma`**:
   - Commented out the `autoRenew` field to match actual database structure
   - Regenerated Prisma client to reflect changes

3. **Fixed recovery script in `scripts/recover-missing-users.js`**:
   - Removed reference to `autoRenew` field

## Files Modified
- `lib/clean-account-initializer.ts` - Removed autoRenew field usage
- `prisma/schema.prisma` - Commented out autoRenew field
- `scripts/recover-missing-users.js` - Removed autoRenew reference

## Testing
- Successfully built the application with `npm run build`
- Confirmed UserSubscription creation works without autoRenew field
- Verified no TypeScript compilation errors related to this fix

## Impact
- FREE plan signup now works correctly
- PAID plan signup continues to work as before
- No data loss or breaking changes to existing subscriptions
- Database schema now matches Prisma model

## Deployment Status
✅ Fix applied and tested successfully
✅ Build completed without errors
✅ Ready for production deployment

This fix resolves the critical FREE plan signup issue reported in the uploaded error logs.
