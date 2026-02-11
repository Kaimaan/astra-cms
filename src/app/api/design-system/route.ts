import { NextResponse } from 'next/server';
import { getConfig } from '@/core/config';
import { getContentProvider } from '@/infrastructure';
import { apiError, ErrorCode } from '@/lib/api-errors';

export async function GET() {
  try {
    const config = await getConfig();
    const provider = getContentProvider();
    const site = await provider.getSite();

    return NextResponse.json(
      {
        schemaVersion: 1,
        tokens: config.tokens,
        branding: {
          siteName: config.site.name,
          siteDescription: config.site.description,
          siteUrl: config.site.url,
          favicon: config.site.favicon ?? null,
          logo: site?.globals.header.logo ?? null,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    return apiError('Failed to load design system', ErrorCode.INTERNAL_ERROR, 500, error);
  }
}
