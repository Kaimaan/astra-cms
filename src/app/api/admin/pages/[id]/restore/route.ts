import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { validateId, validateBody } from '@/lib/validation/validate';
import { restoreRevisionSchema } from '@/lib/validation/schemas/page-schemas';
import { withAuthParams } from '@/core/auth/middleware';
import { apiError, ErrorCode } from '@/lib/api-errors';

export const POST = withAuthParams('pages:update', async (request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const validation = await validateBody(request, restoreRevisionSchema);
    if (!validation.success) return validation.response;
    const { revisionId } = validation.data;

    const provider = getContentProvider();

    // restoreRevision handles page not found and revision not found errors
    const restoredPage = await provider.restoreRevision(id, revisionId);

    return NextResponse.json({
      success: true,
      page: restoredPage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restore revision';
    const isNotFound = message.includes('not found');
    return apiError(
      message,
      isNotFound ? ErrorCode.NOT_FOUND : ErrorCode.INTERNAL_ERROR,
      isNotFound ? 404 : 500,
      error
    );
  }
});
