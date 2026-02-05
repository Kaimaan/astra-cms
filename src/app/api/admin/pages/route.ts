import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const provider = getContentProvider();
    let pages = await provider.getPages({
      status: status as 'draft' | 'published' | 'scheduled' | 'all'
    });

    // Filter by search query if provided
    if (search) {
      const query = search.toLowerCase();
      pages = pages.filter(page =>
        page.title.toLowerCase().includes(query) ||
        Object.values(page.paths).some(path => path.toLowerCase().includes(query))
      );
    }

    // Return simplified page data
    const result = pages.map(page => ({
      id: page.id,
      title: page.title,
      paths: page.paths,
      status: page.status,
      updatedAt: page.updatedAt.toISOString()
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}
