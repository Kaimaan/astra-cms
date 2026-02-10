/**
 * Posts Sub-Sitemap
 *
 * Lists all published blog posts. Excluded from the sitemap index
 * if no published posts exist (handled by sitemap.xml/route.ts).
 * Excludes posts with seo.noIndex: true.
 */

import { getContentProvider } from '@/infrastructure';
import {
  buildAbsoluteUrl,
  escapeXml,
  formatW3CDate,
  xmlHeaders,
  xmlProlog,
} from '@/lib/sitemap/utils';

export const revalidate = 3600;

export async function GET() {
  const provider = getContentProvider();
  const posts = await provider.getPosts({ status: 'published' });

  const urls: string[] = [];

  for (const post of posts) {
    if (post.seo?.noIndex) continue;

    const fullPath = `/${post.locale}/blog/${post.slug}`;
    const loc = await buildAbsoluteUrl(fullPath);
    const lastmod = post.updatedAt
      ? formatW3CDate(post.updatedAt)
      : undefined;

    const urlParts = [
      `  <url>`,
      `    <loc>${escapeXml(loc)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      `    <changefreq>monthly</changefreq>`,
      `    <priority>0.6</priority>`,
      `  </url>`,
    ];

    urls.push(urlParts.join('\n'));
  }

  const xml = `${xmlProlog('/sitemap.xsl')}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, { status: 200, headers: xmlHeaders() });
}
