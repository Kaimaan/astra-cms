/**
 * Auth Types
 *
 * Defines User and Permission types.
 * NO Next.js imports - pure TypeScript
 */

// =============================================================================
// ROLES & PERMISSIONS
// =============================================================================

export type Role = 'admin' | 'editor' | 'viewer';

/**
 * Permission definitions by role:
 *
 * admin:
 *   - Full access to everything
 *   - Can manage users, settings, and site globals
 *
 * editor:
 *   - Can create, edit, and publish pages
 *   - Can upload and manage assets
 *   - Cannot change site settings or manage users
 *
 * viewer:
 *   - Read-only access
 *   - Can view pages and assets in admin
 *   - Cannot make any changes
 */

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'pages:read',
    'pages:create',
    'pages:update',
    'pages:delete',
    'pages:publish',
    'assets:read',
    'assets:create',
    'assets:update',
    'assets:delete',
    'site:read',
    'site:update',
    'users:read',
    'users:manage',
  ],
  editor: [
    'pages:read',
    'pages:create',
    'pages:update',
    'pages:delete',
    'pages:publish',
    'assets:read',
    'assets:create',
    'assets:update',
    'assets:delete',
    'site:read',
  ],
  viewer: [
    'pages:read',
    'assets:read',
    'site:read',
  ],
};

// =============================================================================
// USER
// =============================================================================

export interface User {
  /** Unique user ID (from auth provider) */
  id: string;

  /** User email */
  email: string;

  /** Display name */
  name?: string;

  /** Profile image URL */
  avatar?: string;

  /** User role */
  role: Role;

  /** When the user was created */
  createdAt: Date;

  /** Last login time */
  lastLoginAt?: Date;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can perform an action on a resource
 */
export function canAccess(
  role: Role,
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete' | 'publish' | 'manage'
): boolean {
  return hasPermission(role, `${resource}:${action}`);
}
