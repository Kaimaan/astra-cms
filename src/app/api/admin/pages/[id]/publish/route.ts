import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const provider = getContentProvider();

    const page = await provider.getPage(id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
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
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const provider = getContentProvider();

    const page = await provider.getPage(id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
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
}
