import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { validateId, validateBody } from '@/lib/validation/validate';
import { restoreRevisionSchema } from '@/lib/validation/schemas/page-schemas';
import { withAuthParams } from '@/core/auth/middleware';

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
    console.error('Error restoring revision:', error);

    const message = error instanceof Error ? error.message : 'Failed to restore revision';
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
});
