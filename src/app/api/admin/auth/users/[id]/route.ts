import { NextRequest, NextResponse } from 'next/server';
import { withAuthParams } from '@/core/auth/middleware';
import { getUserById, updateUser, deleteUser, hashPassword } from '@/core/auth/storage';
import { apiError, ErrorCode } from '@/lib/api-errors';
import { validateBody } from '@/lib/validation/validate';
import { updateUserSchema } from '@/lib/validation/schemas/auth-schemas';

// PATCH /api/admin/auth/users/[id] - Update a user
export const PATCH = withAuthParams('users:manage', async (request, { params }, auth) => {
  try {
    const { id } = await params;

    const existing = await getUserById(id);
    if (!existing) {
      return apiError('User not found', ErrorCode.NOT_FOUND, 404);
    }

    const validation = await validateBody(request, updateUserSchema);
    if (!validation.success) return validation.response;

    const { name, role, password } = validation.data;
    const updates: Record<string, string | undefined> = {};

    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;

    if (password) {
      const { hash, salt } = await hashPassword(password);
      updates.passwordHash = hash;
      updates.salt = salt;
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      return apiError('User not found', ErrorCode.NOT_FOUND, 404);
    }

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    return apiError('Failed to update user', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});

// DELETE /api/admin/auth/users/[id] - Delete a user
export const DELETE = withAuthParams('users:manage', async (_request, { params }, auth) => {
  try {
    const { id } = await params;

    // Prevent self-deletion
    if (id === auth.user.id) {
      return apiError('You cannot delete your own account', ErrorCode.CONFLICT, 409);
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return apiError('User not found', ErrorCode.NOT_FOUND, 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('Failed to delete user', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
