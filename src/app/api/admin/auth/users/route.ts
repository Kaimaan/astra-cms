import { NextResponse } from 'next/server';
import { withAuth } from '@/core/auth/middleware';
import { getUsers, createUser, getUserByEmail } from '@/core/auth/storage';
import { apiError, ErrorCode } from '@/lib/api-errors';
import { validateBody } from '@/lib/validation/validate';
import { createUserSchema } from '@/lib/validation/schemas/auth-schemas';

// GET /api/admin/auth/users - List all users
export const GET = withAuth('users:read', async (_request, _auth) => {
  try {
    const users = await getUsers();
    // Strip sensitive fields
    const safeUsers = users.map(({ passwordHash, salt, ...user }) => user);
    return NextResponse.json(safeUsers);
  } catch (error) {
    return apiError('Failed to fetch users', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});

// POST /api/admin/auth/users - Create a new user
export const POST = withAuth('users:manage', async (request, _auth) => {
  try {
    const validation = await validateBody(request, createUserSchema);
    if (!validation.success) return validation.response;

    const { email, password, name, role } = validation.data;

    // Check for duplicate email
    const existing = await getUserByEmail(email);
    if (existing) {
      return apiError('A user with this email already exists', ErrorCode.CONFLICT, 409);
    }

    const user = await createUser({ email, password, name, role });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError('Failed to create user', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
