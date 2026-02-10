import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import config from '../../../../../astra.config';

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
      locale: page.locale,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, path } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (typeof path !== 'string') {
      return NextResponse.json(
        { error: 'URL path is required' },
        { status: 400 }
      );
    }

    // Normalize path: strip leading/trailing slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');

    // Validate path format (allow empty for homepage, alphanumeric with hyphens/slashes)
    if (normalizedPath && !/^[a-zA-Z0-9][a-zA-Z0-9\-/]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(normalizedPath)) {
      return NextResponse.json(
        { error: 'Invalid path. Use only letters, numbers, hyphens, and forward slashes.' },
        { status: 400 }
      );
    }

    // Check for duplicate paths
    const provider = getContentProvider();
    const existingPages = await provider.getPages({});
    const duplicate = existingPages.find(p =>
      Object.values(p.paths).some(existing => existing === normalizedPath)
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `A page with the path "/${normalizedPath}" already exists` },
        { status: 409 }
      );
    }

    const locale = config.i18n.defaultLocale;
    const newPage = await provider.createPage({
      schemaVersion: 2,
      locale,
      paths: { [locale]: normalizedPath },
      title: title.trim(),
      status: 'draft',
      blocks: [],
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
