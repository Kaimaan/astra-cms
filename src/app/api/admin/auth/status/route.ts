import { NextResponse } from 'next/server';
import { hasAnyUsers } from '@/core/auth/storage';
import { apiError, ErrorCode } from '@/lib/api-errors';

// GET /api/admin/auth/status - Public auth status check
export async function GET() {
  try {
    const hasUsers = await hasAnyUsers();
    return NextResponse.json({ authEnabled: hasUsers, hasUsers });
  } catch (error) {
    return apiError('Failed to check auth status', ErrorCode.INTERNAL_ERROR, 500, error);
  }
}
