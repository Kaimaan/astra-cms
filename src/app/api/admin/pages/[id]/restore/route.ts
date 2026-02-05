import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { revisionId } = body;

    if (!revisionId) {
      return NextResponse.json(
        { error: 'Missing revisionId in request body' },
        { status: 400 }
      );
    }

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
}
