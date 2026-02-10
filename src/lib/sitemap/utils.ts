/**
 * Sitemap Utilities
 *
 * Shared helpers for XML escaping, URL building, and response headers.
 */

import { getConfig } from '@/core/config';

/**
 * Escape special XML characters
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a full absolute URL from a path
 */
export async function buildAbsoluteUrl(path: string): Promise<string> {
  const config = await getConfig();
  const base = config.site.url.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Format a Date as W3C datetime (YYYY-MM-DD)
 */
export function formatW3CDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Standard XML response headers
 */
export function xmlHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  };
}

/**
 * XML declaration with XSL stylesheet reference
 */
export function xmlProlog(xslPath: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="${xslPath}"?>`;
}
