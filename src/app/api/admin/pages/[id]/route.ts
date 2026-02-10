import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { validateId, validateBody } from '@/lib/validation/validate';
import { updatePageSchema } from '@/lib/validation/schemas/page-schemas';
import { withAuthParams } from '@/core/auth/middleware';
import { sanitizeBlockContent } from '@/lib/sanitize';

export const DELETE = withAuthParams('pages:delete', async (request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const { searchParams } = new URL(request.url);
    const redirectToId = searchParams.get('redirectTo') || undefined;

    const provider = getContentProvider();

    // Verify page exists
    const page = await provider.getPage(id);
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    await provider.deletePage(id, redirectToId);

    return NextResponse.json({
      success: true,
      redirectAdded: !!redirectToId
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
});

export const GET = withAuthParams('pages:read', async (_request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const provider = getContentProvider();
    const page = await provider.getPage(id);

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
});

export const PATCH = withAuthParams('pages:update', async (request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const validation = await validateBody(request, updatePageSchema);
    if (!validation.success) return validation.response;
    const { changeDescription, title, paths, blocks, seo, status } = validation.data;

    const provider = getContentProvider();

    // Verify page exists
    const existingPage = await provider.getPage(id);
    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (paths !== undefined) updates.paths = paths;
    if (blocks !== undefined) updates.blocks = sanitizeBlockContent(blocks as unknown[]);
    if (seo !== undefined) updates.seo = seo;
    if (status !== undefined) updates.status = status;

    // Update the page (provider auto-creates revision)
    const updatedPage = await provider.updatePage(id, updates, changeDescription);

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
});
