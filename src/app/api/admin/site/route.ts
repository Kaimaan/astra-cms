import { NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { withAuth } from '@/core/auth/middleware';
import { apiError, ErrorCode } from '@/lib/api-errors';

// GET /api/admin/site - Get site configuration
export const GET = withAuth('site:read', async (_request, _auth) => {
  try {
    const provider = getContentProvider();
    const site = await provider.getSite();
    return NextResponse.json(site);
  } catch (error) {
    return apiError('Failed to fetch site config', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});

// PATCH /api/admin/site - Update site configuration
export const PATCH = withAuth('site:update', async (request, _auth) => {
  try {
    const updates = await request.json();
    const provider = getContentProvider();
    const site = await provider.updateSite(updates);
    return NextResponse.json(site);
  } catch (error) {
    return apiError('Failed to update site config', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
