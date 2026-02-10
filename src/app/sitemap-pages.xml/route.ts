/**
 * Pages Sub-Sitemap
 *
 * Lists all published pages with hreflang alternates per locale.
 * Excludes pages with seo.noIndex: true.
 */

import { getConfig } from '@/core/config';
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
  const config = await getConfig();
  const provider = getContentProvider();
  const pages = await provider.getPages({ status: 'published' });
  const locales = config.i18n.locales;
  const defaultLocale = config.i18n.defaultLocale;

  const urls: string[] = [];

  for (const page of pages) {
    if (page.seo?.noIndex) continue;

    // Build URL entries for each locale the page has a path for
    for (const [locale, pagePath] of Object.entries(page.paths)) {
      const fullPath = pagePath === '' ? `/${locale}` : `/${locale}/${pagePath}`;
      const loc = await buildAbsoluteUrl(fullPath);
      const lastmod = page.updatedAt
        ? formatW3CDate(page.updatedAt)
        : undefined;

      // Determine priority: homepage gets 1.0, others 0.8
      const priority = pagePath === '' ? '1.0' : '0.8';

      // Build hreflang alternates when page has paths in multiple locales
      const alternates: string[] = [];
      const pageLocales = Object.keys(page.paths);
      if (pageLocales.length > 1) {
        for (const altLocale of pageLocales) {
          const altPath = page.paths[altLocale];
          const altFullPath = altPath === '' ? `/${altLocale}` : `/${altLocale}/${altPath}`;
          const altLoc = await buildAbsoluteUrl(altFullPath);
          alternates.push(
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(altLocale)}" href="${escapeXml(altLoc)}" />`
          );
        }
        // Add x-default pointing to the default locale version
        if (page.paths[defaultLocale] !== undefined) {
          const defPath = page.paths[defaultLocale];
          const defFullPath = defPath === '' ? `/${defaultLocale}` : `/${defaultLocale}/${defPath}`;
          const defLoc = await buildAbsoluteUrl(defFullPath);
          alternates.push(
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(defLoc)}" />`
          );
        }
      }

      const urlParts = [
        `  <url>`,
        `    <loc>${escapeXml(loc)}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        `    <changefreq>weekly</changefreq>`,
        `    <priority>${priority}</priority>`,
        ...alternates,
        `  </url>`,
      ];

      urls.push(urlParts.join('\n'));
    }
  }

  const xml = `${xmlProlog('/sitemap.xsl')}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, { status: 200, headers: xmlHeaders() });
}
