/**
 * i18n Configuration Utilities
 *
 * Locale format: {language}-{REGION} (e.g., en-FI, en-DE, en-GB)
 * - Standard BCP 47 format
 * - Language: 2-letter ISO language code (currently only 'en')
 * - Region: 2-letter ISO country code (detected via geo-IP)
 */

import { getConfig } from '@/core/config';

// Locale pattern: 2-letter language + hyphen + 2-letter region (BCP 47)
const LOCALE_PATTERN = /^[a-z]{2}-[A-Z]{2}$/;

// Supported languages (for future expansion)
const SUPPORTED_LANGUAGES = ['en'];

// =============================================================================
// GETTERS
// =============================================================================

export async function getDefaultLocale(): Promise<string> {
  const config = await getConfig();
  return config.i18n.defaultLocale;
}

export function getDefaultLanguage(): string {
  return 'en';
}

export function getSupportedLanguages(): string[] {
  return SUPPORTED_LANGUAGES;
}

export async function getLocaleStrategy(): Promise<'prefix' | 'domain' | 'none'> {
  const config = await getConfig();
  return config.i18n.strategy;
}

export async function getSlugStrategy(): Promise<'shared' | 'per-locale'> {
  const config = await getConfig();
  return config.i18n.slugStrategy;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if locale matches the expected format (xx-XX)
 */
export function isValidLocaleFormat(locale: string): boolean {
  // More lenient pattern for initial check
  return /^[a-z]{2}-[a-zA-Z]{2}$/i.test(locale);
}

/**
 * Check if locale is valid (correct format + supported language)
 */
export function isValidLocale(locale: string): boolean {
  if (!isValidLocaleFormat(locale)) {
    return false;
  }
  const { language } = parseLocale(locale);
  return SUPPORTED_LANGUAGES.includes(language);
}

export async function isDefaultLocale(locale: string): Promise<boolean> {
  const config = await getConfig();
  return locale.toLowerCase() === config.i18n.defaultLocale.toLowerCase();
}

// =============================================================================
// PARSING
// =============================================================================

/**
 * Parse locale into language and region
 * Format: {language}-{REGION} (e.g., "en-GB" -> { language: "en", region: "GB" })
 */
export function parseLocale(locale: string): {
  language: string;
  region: string;
} {
  const [language, region] = locale.split('-');
  return { language: language.toLowerCase(), region: region?.toUpperCase() || '' };
}

/**
 * Get language code from locale
 */
export function getLanguage(locale: string): string {
  return parseLocale(locale).language;
}

/**
 * Get region code from locale
 */
export function getRegion(locale: string): string {
  return parseLocale(locale).region;
}

// =============================================================================
// URL HELPERS
// =============================================================================

/**
 * Build a localized URL path
 */
export async function buildLocalizedPath(path: string, locale: string): Promise<string> {
  const strategy = await getLocaleStrategy();

  if (strategy === 'none') {
    return path;
  }

  if (strategy === 'prefix') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
  }

  // 'domain' strategy - path stays the same, domain changes
  return path;
}

/**
 * Extract locale from a URL path
 */
export async function extractLocaleFromPath(path: string): Promise<{
  locale: string;
  pathWithoutLocale: string;
}> {
  const strategy = await getLocaleStrategy();

  if (strategy !== 'prefix') {
    return {
      locale: await getDefaultLocale(),
      pathWithoutLocale: path,
    };
  }

  const segments = path.split('/').filter(Boolean);
  const potentialLocale = segments[0];

  if (potentialLocale && isValidLocale(potentialLocale)) {
    return {
      locale: potentialLocale.toLowerCase(),
      pathWithoutLocale: '/' + segments.slice(1).join('/') || '/',
    };
  }

  return {
    locale: await getDefaultLocale(),
    pathWithoutLocale: path,
  };
}

/**
 * Get HTML lang attribute from locale
 * Returns the language part for the <html lang=""> attribute
 */
export function getHtmlLang(locale: string): string {
  // For locale "fi-en", return "en" for the HTML lang attribute
  return getLanguage(locale);
}
