/**
 * SafePlay Authentication Configuration
 * Updated to use fixed authentication system
 * 
 * FIXES:
 * - Enhanced session validation with database user verification
 * - Improved error handling for authentication failures
 * - Better session persistence and user existence checks
 */

// Import fixed auth configuration
import { authOptions } from "./auth-fixed";

// Export the fixed auth options
export { authOptions };


