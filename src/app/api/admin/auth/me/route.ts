import { NextResponse } from 'next/server';
import { withAuth } from '@/core/auth/middleware';

// GET /api/admin/auth/me - Get current authenticated user
export const GET = withAuth('pages:read', async (_request, auth) => {
  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      role: auth.user.role,
    },
  });
});
