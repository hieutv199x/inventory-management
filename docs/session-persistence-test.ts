/**
 * Session Persistence Test Guide
 * =============================
 * 
 * This guide demonstrates how to test the localStorage session persistence feature.
 * 
 * Test Steps:
 * 
 * 1. Open http://localhost:3001 in your browser
 * 2. Navigate to /auth/login 
 * 3. Login with credentials:
 *    - Email: tranlong2002.tt@gmail.com
 *    - Password: admin123
 * 
 * 4. After successful login, open browser DevTools (F12)
 * 5. Go to Application tab -> Local Storage -> http://localhost:3001
 * 6. You should see these keys:
 *    - auth_token: JWT token
 *    - auth_user: User data (JSON)
 *    - auth_expiry: Expiration timestamp
 * 
 * 7. Navigate to different pages (dashboard, users, profile)
 * 8. Close the browser tab/window completely
 * 9. Reopen http://localhost:3001
 * 10. You should be automatically logged in (no redirect to login page)
 * 
 * Expected Behavior:
 * - Session persists across browser restarts
 * - User remains logged in for 24 hours
 * - Session auto-refreshes when close to expiry
 * - Invalid/expired sessions are automatically cleared
 * 
 * Console Logs to Watch For:
 * - "Session restored from localStorage: {user data}"
 * - "Session auto-refreshed successfully" (when close to expiry)
 * - "Stored session has expired" (after 24 hours)
 * 
 * Additional Tests:
 * 
 * A. Test Session Expiry:
 *    1. In DevTools, modify auth_expiry to a past timestamp
 *    2. Refresh the page
 *    3. Should be redirected to login (expired session cleared)
 * 
 * B. Test Invalid Token:
 *    1. In DevTools, modify auth_token to invalid value
 *    2. Refresh the page
 *    3. Should be redirected to login (invalid session cleared)
 * 
 * C. Test Logout:
 *    1. Login and verify localStorage has auth data
 *    2. Click logout
 *    3. Verify localStorage auth data is cleared
 * 
 * Security Features:
 * - Tokens have 1-hour JWT expiry (server-side validation)
 * - localStorage session has 24-hour expiry (client-side)
 * - Sessions auto-refresh when 15 minutes from expiry
 * - Cookies are httpOnly in production for security
 * - Session validation happens on every page load
 */

console.log("Session Persistence Test Guide loaded. Check the comments above for testing instructions.");

export {};
