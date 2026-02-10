import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/cors';

/**
 * Middleware for locale routing with geo-detection
 *
 * Locale format: {language}-{REGION} (e.g., en-FI, en-DE, en-GB)
 * - Standard BCP 47 format
 * - Region is detected from geo headers or Accept-Language
 * - Language is currently always 'en' until more languages are added
 */

const DEFAULT_LANGUAGE = 'en';
const DEFAULT_REGION = 'GB';

// Supported languages (must match content available)
const SUPPORTED_LANGUAGES = ['en'];

// Locale pattern: 2-letter language + hyphen + 2-letter region (BCP 47)
const LOCALE_PATTERN = /^[a-z]{2}-[a-zA-Z]{2}$/i;

/**
 * Detect user's preferred language from Accept-Language header
 */
function detectLanguage(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) {
    return DEFAULT_LANGUAGE;
  }

  // Parse Accept-Language: "fi-FI,fi;q=0.9,en-GB;q=0.8,en;q=0.7"
  const languages = acceptLanguage
    .split(',')
    .map((part) => {
      const [locale, qPart] = part.trim().split(';');
      const q = qPart ? parseFloat(qPart.split('=')[1]) : 1;
      const lang = locale.split('-')[0].toLowerCase();
      return { lang, q };
    })
    .sort((a, b) => b.q - a.q);

  // Find first supported language
  for (const { lang } of languages) {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      return lang;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Detect user's region from request headers
 */
function detectRegion(request: NextRequest): string {
  // 1. Vercel provides country via header
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  if (vercelCountry) {
    return vercelCountry.toUpperCase();
  }

  // 2. Cloudflare provides country via header
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry && cfCountry !== 'XX') {
    return cfCountry.toUpperCase();
  }

  // 3. Try to extract from Accept-Language (e.g., "en-GB,en;q=0.9" -> "GB")
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const match = acceptLanguage.match(/[a-z]{2}-([A-Z]{2})/i);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return DEFAULT_REGION;
}

/**
 * Check if a string is a valid locale format
 */
function isValidLocaleFormat(locale: string): boolean {
  return LOCALE_PATTERN.test(locale.toLowerCase());
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS for admin API routes
  if (pathname.startsWith('/api/admin')) {
    const preflightResponse = handleCorsPreFlight(request);
    if (preflightResponse) return preflightResponse;
    const response = NextResponse.next();
    return addCorsHeaders(response, request);
  }

  // Skip middleware for static files, api, and admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a valid locale
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];

  if (potentialLocale && isValidLocaleFormat(potentialLocale)) {
    // Valid locale format in path, continue
    return NextResponse.next();
  }

  // No valid locale in path - detect language and region, then redirect
  const language = detectLanguage(request);
  const region = detectRegion(request);
  const locale = `${language}-${region}`;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
