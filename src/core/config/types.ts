/**
 * Astra Configuration Types
 *
 * Defines the shape of astra.config.ts
 * NO Next.js imports - pure TypeScript
 */

// =============================================================================
// SITE
// =============================================================================

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
}

// =============================================================================
// I18N
// =============================================================================

export type LocaleStrategy = 'prefix' | 'domain' | 'none';
export type SlugStrategy = 'shared' | 'per-locale';

export interface I18nConfig {
  defaultLocale: string;
  locales: string[];
  strategy: LocaleStrategy;
  slugStrategy: SlugStrategy;
}

// =============================================================================
// DESIGN TOKENS
// =============================================================================

export interface ColorPalette {
  50: string;
  100: string;
  200?: string;
  300?: string;
  400?: string;
  500: string;
  600: string;
  700: string;
  800?: string;
  900?: string;
  950?: string;
  [key: string]: string | undefined;
}

export interface ColorTokens {
  primary: string;
  primaryForeground: string;
  primaryPalette: ColorPalette;
  secondary: string;
  secondaryForeground: string;
  secondaryPalette: ColorPalette;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  success: string;
  successPalette: ColorPalette;
  warning: string;
  warningPalette: ColorPalette;
  error: string;
  errorPalette: ColorPalette;
  [key: string]: string | ColorPalette; // Allow custom colors
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  [key: string]: number;
}

export interface TypographyTokens {
  fontFamily: {
    sans: string;
    heading: string;
    [key: string]: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    [key: string]: string;
  };
}

export interface RadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
  [key: string]: string;
}

export interface ShadowTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  [key: string]: string;
}

export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
}

// =============================================================================
// DEPLOYMENT
// =============================================================================

export type DeploymentMode = 'isr' | 'static';

export interface DeploymentConfig {
  /**
   * Deployment mode:
   * - 'isr': Incremental Static Regeneration (Vercel, Node.js hosts)
   * - 'static': Full static export (Cloudflare Pages, S3, Netlify)
   */
  mode: DeploymentMode;

  /**
   * Webhook URL to trigger rebuild (required for 'static' mode)
   * e.g., Cloudflare Deploy Hook, Netlify Build Hook
   */
  rebuildWebhook?: string;

  /**
   * ISR revalidation interval in seconds (for 'isr' mode)
   * Default: 3600 (1 hour)
   */
  revalidateInterval?: number;
}

// =============================================================================
// NAVIGATION
// =============================================================================

export interface NavItem {
  label: string;
  href: string;
}

export interface NavigationConfig {
  main: NavItem[];
}

// =============================================================================
// FULL CONFIG
// =============================================================================

export interface AstraConfig {
  site: SiteConfig;
  i18n: I18nConfig;
  tokens: DesignTokens;
  navigation: NavigationConfig;
  deployment?: DeploymentConfig;
}
