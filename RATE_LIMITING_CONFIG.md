# Rate Limiting Configuration

## Current Settings (v0.5.1)
- **Limit**: 100 requests per IP address
- **Window**: 5 minutes
- **Reset**: Automatic after window expires

## Implementation
- Location: `lib/staging-auth.ts` - `isRateLimited()` function
- Middleware: `middleware.ts` - Applied before stakeholder auth check
- Storage: In-memory Map (production should use Redis)

## Response Headers
When rate limited (429 status):
- `Retry-After`: 300 seconds (5 minutes)
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: Timestamp when limit resets

## Troubleshooting
If users report "Too Many Requests" errors:
1. Check if limits are too aggressive for normal usage
2. Consider exempting certain paths (e.g., `/staging-auth`)
3. Implement user-based limiting instead of IP-based for authenticated users
4. Use Redis for production to share limits across instances

## Recent Changes
- **2025-07-06**: Increased from 10 requests/15min to 100 requests/5min (hotfix for Sam's access issue)
