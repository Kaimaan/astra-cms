/**
 * Auth Module
 *
 * Built-in session-cookie authentication and authorization.
 */

// Types
export type { User, Role } from './types';
export { hasPermission, canAccess, ROLE_PERMISSIONS } from './types';

// Session
export { isAuthEnabled, verifySession, SESSION_COOKIE } from './session';

// Storage
export { hasAnyUsers } from './storage';

// Middleware
export type { AuthContext } from './middleware';
export { withAuth, withAuthParams } from './middleware';
