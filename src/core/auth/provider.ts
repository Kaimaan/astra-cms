/**
 * Auth Provider Registry
 *
 * Manages which auth provider is active.
 * Similar to AIProvider / ContentProvider pattern.
 *
 * When no provider is registered, all routes are open (local dev).
 */

import type { User } from './types';
import type { NextRequest } from 'next/server';

/**
 * Auth Provider Interface
 *
 * Users supply an implementation that verifies the request
 * and returns the authenticated user. Works with any auth system:
 * NextAuth, Clerk, Supabase, Firebase Auth, custom JWT, etc.
 */
export interface AuthProvider {
  /**
   * Verify the request and return the authenticated user.
   *
   * Extract the token/session from headers (e.g., Authorization: Bearer ...)
   * or cookies, verify it, and return the user with their role.
   *
   * Return null if the request is not authenticated.
   */
  verifyRequest(request: NextRequest): Promise<User | null>;
}

let currentProvider: AuthProvider | null = null;

/**
 * Set the active auth provider
 */
export function setAuthProvider(provider: AuthProvider): void {
  currentProvider = provider;
}

/**
 * Get the active auth provider
 * Returns null if no provider is configured (open access)
 */
export function getAuthProvider(): AuthProvider | null {
  return currentProvider;
}

/**
 * Check if auth is enabled
 * When false, all admin routes are open (local dev mode)
 */
export function isAuthEnabled(): boolean {
  return currentProvider !== null;
}
