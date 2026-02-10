/**
 * robots.txt
 *
 * Allows all crawlers, references sitemap, blocks /admin and /api/.
 */

import { buildAbsoluteUrl } from '@/lib/sitemap/utils';

export const revalidate = 3600;

export async function GET() {
  const sitemapUrl = await buildAbsoluteUrl('/sitemap.xml');

  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
