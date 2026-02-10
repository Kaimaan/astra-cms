import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { validateId } from '@/lib/validation/validate';
import { withAuthParams } from '@/core/auth/middleware';
import { apiError, ErrorCode } from '@/lib/api-errors';

export const POST = withAuthParams('pages:publish', async (_request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const provider = getContentProvider();

    const page = await provider.getPage(id);
    if (!page) {
      return apiError('Page not found', ErrorCode.NOT_FOUND, 404);
    }

    if (page.status === 'published') {
      return NextResponse.json(page);
    }

    const updatedPage = await provider.publishPage(id);
    return NextResponse.json(updatedPage);
  } catch (error) {
    return apiError('Failed to publish page', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});

export const DELETE = withAuthParams('pages:publish', async (_request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const provider = getContentProvider();

    const page = await provider.getPage(id);
    if (!page) {
      return apiError('Page not found', ErrorCode.NOT_FOUND, 404);
    }

    if (page.status === 'draft') {
      return NextResponse.json(page);
    }

    const updatedPage = await provider.unpublishPage(id);
    return NextResponse.json(updatedPage);
  } catch (error) {
    return apiError('Failed to unpublish page', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
