import { NextRequest, NextResponse } from 'next/server';
import { getContentProvider } from '@/infrastructure';
import { apiError, ErrorCode } from '@/lib/api-errors';
import packageJson from '../../../../../package.json';

export async function GET(request: NextRequest) {
  // API key protection: when ASTRA_API_KEY is set, require matching X-API-Key header
  const apiKey = process.env.ASTRA_API_KEY;
  if (apiKey) {
    const provided = request.headers.get('X-API-Key');
    if (provided !== apiKey) {
      return apiError('Invalid or missing API key', ErrorCode.UNAUTHORIZED, 401);
    }
  }

  try {
    const provider = getContentProvider();
    const pages = await provider.getPages({ status: 'all' });

    let publishedPages = 0;
    let draftPages = 0;
    for (const page of pages) {
      if (page.status === 'published') publishedPages++;
      else if (page.status === 'draft') draftPages++;
    }

    return NextResponse.json({
      status: 'ok',
      version: packageJson.version,
      stats: {
        totalPages: pages.length,
        publishedPages,
        draftPages,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return apiError('Health check failed', ErrorCode.INTERNAL_ERROR, 500, error);
  }
}
