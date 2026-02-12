import { NextResponse } from 'next/server';
import { hasAnyUsers, createUser, createSession } from '@/core/auth/storage';
import { buildSetCookieHeader } from '@/core/auth/session';
import { apiError, ErrorCode } from '@/lib/api-errors';
import { validateBody } from '@/lib/validation/validate';
import { setupSchema } from '@/lib/validation/schemas/auth-schemas';

// POST /api/admin/auth/setup - Create the first admin user
export async function POST(request: Request) {
  try {
    // Only works when no users exist
    if (await hasAnyUsers()) {
      return apiError('Setup already completed', ErrorCode.CONFLICT, 409);
    }

    const validation = await validateBody(request, setupSchema);
    if (!validation.success) return validation.response;

    const { email, password, name } = validation.data;

    const user = await createUser({ email, password, name, role: 'admin' });
    const session = await createSession(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.headers.set('Set-Cookie', buildSetCookieHeader(session.id));
    return response;
  } catch (error) {
    return apiError('Setup failed', ErrorCode.INTERNAL_ERROR, 500, error);
  }
}
