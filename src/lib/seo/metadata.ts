import { Metadata } from 'next';
import type { Page } from '@/core/content/types';
import type { AstraConfig } from '@/core/config/types';
import { getPagePath } from '@/core/content/types';

/**
 * Generate Next.js Metadata object from page SEO config
 */
export function generatePageMetadata(
  page: Page,
  locale: string,
  config: AstraConfig
): Metadata {
  const seo = page.seo || {};
  const pagePath = getPagePath(page, locale);
  const canonicalUrl = `${config.site.url}/${locale}${pagePath ? `/${pagePath}` : ''}`;

  const title = seo.metaTitle || page.title;
  const description = seo.metaDescription || config.site.description;

  return {
    title,
    description,

    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
      languages: buildAlternateLanguages(page, config),
    },

    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: config.site.name,
      locale: locale.replace('-', '_'), // OG uses underscores
      type: 'website',
      ...(seo.ogImage && { images: [{ url: seo.ogImage }] }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(seo.ogImage && { images: [seo.ogImage] }),
    },

    // Robots directives
    robots: seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/**
 * Build alternate language links for hreflang tags
 */
function buildAlternateLanguages(
  page: Page,
  config: AstraConfig
): Record<string, string> {
  const alternates: Record<string, string> = {};

  for (const [locale, path] of Object.entries(page.paths)) {
    alternates[locale] = `${config.site.url}/${locale}${path ? `/${path}` : ''}`;
  }

  // Add x-default pointing to default locale
  const defaultPath = page.paths[config.i18n.defaultLocale] || '';
  alternates['x-default'] = `${config.site.url}/${config.i18n.defaultLocale}${defaultPath ? `/${defaultPath}` : ''}`;

  return alternates;
}

/**
 * Generate metadata for 404 pages
 */
export function generate404Metadata(): Metadata {
  return {
    title: 'Page Not Found',
    robots: { index: false, follow: false },
  };
}
