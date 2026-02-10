/**
 * Auth Middleware
 *
 * Higher-order functions that wrap route handlers with
 * authentication and permission checks.
 *
 * When no AuthProvider is configured, routes stay open (local dev).
 * When configured, requests are verified and checked against RBAC.
 *
 * Two variants:
 * - withAuth: for routes without dynamic params
 * - withAuthParams: for routes with dynamic params (e.g., [id], [type])
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthProvider, isAuthEnabled } from './provider';
import { canAccess } from './types';
import type { User } from './types';
import { apiError, ErrorCode } from '@/lib/api-errors';

/**
 * Authenticated request context passed to protected handlers.
 */
export interface AuthContext {
  user: User;
}

// Stub user for local dev (no auth provider configured)
const LOCAL_DEV_USER: User = {
  id: 'local',
  email: 'local@localhost',
  role: 'admin',
  createdAt: new Date(),
};

/**
 * Shared auth logic: verify request and check permissions.
 * Returns AuthContext on success, or a NextResponse error.
 */
async function authenticate(
  permission: string,
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  // Zero-config: no auth provider = open access
  if (!isAuthEnabled()) {
    return { user: LOCAL_DEV_USER };
  }

  // Auth is configured — verify the request
  const provider = getAuthProvider()!;

  let user: User | null;
  try {
    user = await provider.verifyRequest(request);
  } catch {
    return apiError('Authentication required', ErrorCode.UNAUTHORIZED, 401);
  }

  if (!user) {
    return apiError('Authentication required', ErrorCode.UNAUTHORIZED, 401);
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
