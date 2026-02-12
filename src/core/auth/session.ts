/**
 * Session Management
 *
 * Cookie-based session utilities that replace the AuthProvider abstraction.
 * Reads session ID from httpOnly cookie, verifies against stored sessions,
 * and returns the authenticated User.
 */

import type { NextRequest } from 'next/server';
import type { User } from './types';
import {
  hasAnyUsers,
  getSessionById,
  getUserById,
  deleteExpiredSessions,
} from './storage';

// =============================================================================
// CONSTANTS
// =============================================================================

export const SESSION_COOKIE = 'astra_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// =============================================================================
// AUTH STATUS
// =============================================================================

/**
 * Check if auth is enabled (any users exist).
 * When false, all admin routes are open (zero-config dev mode).
 */
export async function isAuthEnabled(): Promise<boolean> {
  return hasAnyUsers();
}

// =============================================================================
// SESSION COOKIE
// =============================================================================

/**
 * Extract session ID from request cookies.
 */
export function getSessionFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Build the Set-Cookie header value for a session.
 */
export function buildSetCookieHeader(sessionId: string): string {
  const parts = [
    `${SESSION_COOKIE}=${sessionId}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE}`,
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

/**
 * Build the Set-Cookie header value to clear the session.
 */
export function buildClearCookieHeader(): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

// =============================================================================
// SESSION VERIFICATION
// =============================================================================

/**
 * Verify a session ID and return the associated User.
 * Returns null if session is invalid, expired, or user not found.
 * Auto-deletes expired sessions.
 */
export async function verifySession(sessionId: string): Promise<User | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const storedUser = await getUserById(session.userId);
  if (!storedUser) return null;

  // Return public User type (no password fields)
  return {
    id: storedUser.id,
    email: storedUser.email,
    name: storedUser.name,
    role: storedUser.role,
    createdAt: new Date(storedUser.createdAt),
    lastLoginAt: storedUser.lastLoginAt ? new Date(storedUser.lastLoginAt) : undefined,
  };
}

/**
 * Clean up expired sessions (call periodically, e.g., on login).
 */
export async function cleanupSessions(): Promise<void> {
  await deleteExpiredSessions();
}
