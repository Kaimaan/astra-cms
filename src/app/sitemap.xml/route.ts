/**
 * Sitemap Index
 *
 * Lists sub-sitemaps dynamically. Only includes content types
 * that have published data (e.g. omits posts if none exist).
 */

import { getContentProvider } from '@/infrastructure';
import { buildAbsoluteUrl, escapeXml, xmlHeaders, xmlProlog } from '@/lib/sitemap/utils';

export const revalidate = 3600;

export async function GET() {
  const provider = getContentProvider();
  const sitemaps: string[] = [];

  // Pages sub-sitemap (always included)
  const pagesUrl = await buildAbsoluteUrl('/sitemap-pages.xml');
  sitemaps.push(`  <sitemap>\n    <loc>${escapeXml(pagesUrl)}</loc>\n  </sitemap>`);

  // Posts sub-sitemap (only if published posts exist)
  const posts = await provider.getPosts({ status: 'published', limit: 1 });
  if (posts.length > 0) {
    const postsUrl = await buildAbsoluteUrl('/sitemap-posts.xml');
    sitemaps.push(`  <sitemap>\n    <loc>${escapeXml(postsUrl)}</loc>\n  </sitemap>`);
  }

  const xml = `${xmlProlog('/sitemap.xsl')}
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;

  return new Response(xml, { status: 200, headers: xmlHeaders() });
}
