import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { validateId } from '@/lib/validation/validate';
import { withAuthParams } from '@/core/auth/middleware';

export const POST = withAuthParams('pages:publish', async (_request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const provider = getContentProvider();

    const page = await provider.getPage(id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.status === 'published') {
      return NextResponse.json(page);
    }

    const updatedPage = await provider.publishPage(id);
    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error publishing page:', error);
    return NextResponse.json(
      { error: 'Failed to publish page' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (page.status === 'draft') {
      return NextResponse.json(page);
    }

    const updatedPage = await provider.unpublishPage(id);
    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error unpublishing page:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish page' },
      { status: 500 }
    );
  }
});
