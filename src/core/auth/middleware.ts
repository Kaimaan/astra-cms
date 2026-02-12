/**
 * Auth Middleware
 *
 * Higher-order functions that wrap route handlers with
 * authentication and permission checks.
 *
 * When no users exist, routes stay open (zero-config local dev).
 * When users exist, requests are verified via session cookie and checked against RBAC.
 *
 * Two variants:
 * - withAuth: for routes without dynamic params
 * - withAuthParams: for routes with dynamic params (e.g., [id], [type])
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthEnabled, getSessionFromRequest, verifySession } from './session';
import { canAccess } from './types';
import type { User } from './types';
import { apiError, ErrorCode } from '@/lib/api-errors';

/**
 * Authenticated request context passed to protected handlers.
 */
export interface AuthContext {
  user: User;
}

// Stub user for local dev (no users created yet)
const LOCAL_DEV_USER: User = {
  id: 'local',
  email: 'local@localhost',
  role: 'admin',
  createdAt: new Date(),
};

/**
 * Shared auth logic: verify session cookie and check permissions.
 * Returns AuthContext on success, or a NextResponse error.
 */
async function authenticate(
  permission: string,
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  // Zero-config: no users = open access
  if (!(await isAuthEnabled())) {
    return { user: LOCAL_DEV_USER };
  }

  // Check for session cookie
  const sessionId = getSessionFromRequest(request);
  if (!sessionId) {
    return apiError('Authentication required', ErrorCode.UNAUTHORIZED, 401);
  }

  // Verify session and get user
  const user = await verifySession(sessionId);
  if (!user) {
    return apiError('Session expired', ErrorCode.UNAUTHORIZED, 401);
  }

  // Check permission
  const [resource, action] = permission.split(':');
  if (
    !canAccess(
      user.role,
      resource,
      action as 'read' | 'create' | 'update' | 'delete' | 'publish' | 'manage'
    )
  ) {
    return apiError('Insufficient permissions', ErrorCode.FORBIDDEN, 403);
  }

  return { user };
}

/**
 * Wrap a route handler (without route params) with auth.
 *
 * @example
 * export const GET = withAuth('pages:read', async (request, auth) => {
 *   return NextResponse.json({ ... });
 * });
 */
export function withAuth(
  permission: string,
  handler: (request: NextRequest, auth: AuthContext) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const result = await authenticate(permission, request);
    if (result instanceof NextResponse) return result;
    return handler(request, result);
  };
}

/**
 * Wrap a route handler (with route params) with auth.
 *
 * @example
 * export const GET = withAuthParams('pages:read', async (request, { params }, auth) => {
 *   const { id } = await params;
 *   return NextResponse.json({ ... });
 * });
 */
export function withAuthParams(
  permission: string,
  handler: (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
    auth: AuthContext
  ) => Promise<NextResponse>
): (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    const result = await authenticate(permission, request);
    if (result instanceof NextResponse) return result;
    return handler(request, context, result);
  };
}
