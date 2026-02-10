import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }
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
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }
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
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }
    const body = await request.json();

    const provider = getContentProvider();

    // Verify page exists
    const existingPage = await provider.getPage(id);
    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Extract updates and change description
    const { changeDescription, ...updates } = body;

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
}
