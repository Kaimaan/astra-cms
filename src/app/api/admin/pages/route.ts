import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { validateBody } from '@/lib/validation/validate';
import { createPageSchema } from '@/lib/validation/schemas/page-schemas';
import { withAuth } from '@/core/auth/middleware';
import { apiError, ErrorCode } from '@/lib/api-errors';
import config from '../../../../../astra.config';

export const GET = withAuth('pages:read', async (request, _auth) => {
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
    return apiError('Failed to fetch pages', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});

export const POST = withAuth('pages:create', async (request, _auth) => {
  try {
    const validation = await validateBody(request, createPageSchema);
    if (!validation.success) return validation.response;
    const { title, path: normalizedPath } = validation.data;

    // Check for duplicate paths
    const provider = getContentProvider();
    const existingPages = await provider.getPages({});
    const duplicate = existingPages.find(p =>
      Object.values(p.paths).some(existing => existing === normalizedPath)
    );
    if (duplicate) {
      return apiError(`A page with the path "/${normalizedPath}" already exists`, ErrorCode.CONFLICT, 409);
    }

    const locale = config.i18n.defaultLocale;
    const newPage = await provider.createPage({
      schemaVersion: 2,
      locale,
      paths: { [locale]: normalizedPath },
      title,
      status: 'draft',
      blocks: [],
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    return apiError('Failed to create page', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
