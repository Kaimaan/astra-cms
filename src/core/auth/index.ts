/**
 * Auth Module
 *
 * Provider-agnostic authentication and authorization.
 */

// Types
export type { User, Role } from './types';
export { hasPermission, canAccess, ROLE_PERMISSIONS } from './types';

// Provider
export type { AuthProvider } from './provider';
export { setAuthProvider, getAuthProvider, isAuthEnabled } from './provider';

// Middleware
export type { AuthContext } from './middleware';
export { withAuth, withAuthParams } from './middleware';
