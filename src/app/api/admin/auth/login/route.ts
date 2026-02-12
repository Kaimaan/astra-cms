import { NextResponse } from 'next/server';
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  updateUser,
} from '@/core/auth/storage';
import { buildSetCookieHeader, cleanupSessions } from '@/core/auth/session';
import { apiError, ErrorCode } from '@/lib/api-errors';
import { validateBody } from '@/lib/validation/validate';
import { loginSchema } from '@/lib/validation/schemas/auth-schemas';

// POST /api/admin/auth/login - Email/password login
export async function POST(request: Request) {
  try {
    const validation = await validateBody(request, loginSchema);
    if (!validation.success) return validation.response;

    const { email, password } = validation.data;

    const user = await getUserByEmail(email);
    if (!user) {
      return apiError('Invalid credentials', ErrorCode.UNAUTHORIZED, 401);
    }

    const valid = await verifyPassword(password, user.passwordHash, user.salt);
    if (!valid) {
      return apiError('Invalid credentials', ErrorCode.UNAUTHORIZED, 401);
    }

    // Create session and update last login
    const session = await createSession(user.id);
    await updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    // Clean up expired sessions in the background
    cleanupSessions().catch(() => {});

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.headers.set('Set-Cookie', buildSetCookieHeader(session.id));
    return response;
  } catch (error) {
    return apiError('Login failed', ErrorCode.INTERNAL_ERROR, 500, error);
  }
}
