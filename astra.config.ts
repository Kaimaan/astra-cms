/**
 * ONBOARDING: Customize this file with your brand's design tokens.
 *
 * See ONBOARDING.md for guidance. The AI agent will update these values
 * based on your brand guidelines or extracted from your existing site's CSS.
 *
 * Remove this comment when you start building.
 */

/**
 * Astra CMS Configuration
 *
 * This file contains all site-level configuration:
 * - Site metadata
 * - i18n settings
 * - Design token values (single source of truth for all styling)
 * - Navigation
 */

import type { AstraConfig } from './src/core/config/types';

const config: AstraConfig = {
  // ==========================================================================
  // SITE METADATA
  // ==========================================================================
  site: {
    name: 'Astra CMS',
    description: 'AI-first, block-based CMS for organizations',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },

  // ==========================================================================
  // INTERNATIONALIZATION
  // Locale format: {language}-{REGION} (BCP 47 standard, e.g., en-GB, en-US, en-FI)
  // Region is auto-detected via geo-IP
  // ==========================================================================
  i18n: {
    defaultLocale: 'en-GB',
    locales: ['en-GB'], // Primary locale for content; users may be redirected to en-FI, en-US etc. based on geo
    strategy: 'prefix', // 'prefix' | 'domain' | 'none'
    slugStrategy: 'shared', // 'shared' | 'per-locale'
  },

  // ==========================================================================
  // DESIGN TOKENS
  // These tokens are the single source of truth for all styling.
  // Changes here automatically update the admin UI, content blocks, and design system page.
  // ==========================================================================
  tokens: {
    // Full color palettes - change these to rebrand your entire site
    colors: {
      // Primary brand color (indigo)
      primary: '#4f46e5',
      primaryForeground: '#ffffff',
      primaryPalette: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
        950: '#1e1b4b',
      },
      // Secondary brand color (violet)
      secondary: '#9333ea',
      secondaryForeground: '#ffffff',
      secondaryPalette: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
        950: '#3b0764',
      },
      // Neutral colors
      background: '#ffffff',
      foreground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      border: '#e2e8f0',
      // Semantic colors
      success: '#22c55e',
      successPalette: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
      },
      warning: '#f59e0b',
      warningPalette: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
      },
      error: '#ef4444',
      errorPalette: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
      },
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
      '3xl': 64,
      '4xl': 96,
    },
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        heading: 'Inter, system-ui, -apple-system, sans-serif',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
    },
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
  },

  // ==========================================================================
  // NAVIGATION (used by globals)
  // ==========================================================================
  navigation: {
    main: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
    ],
  },

  // ==========================================================================
  // DEPLOYMENT
  // Choose your deployment strategy:
  // - 'isr': For Vercel, Railway, Node.js hosts (instant content updates)
  // - 'static': For Cloudflare Pages, S3, Netlify (requires rebuild webhook)
  // ==========================================================================
  deployment: {
    mode: 'isr',
    revalidateInterval: 3600, // 1 hour fallback for ISR
    // rebuildWebhook: process.env.REBUILD_WEBHOOK_URL, // Uncomment for static mode
  },
};

export default config;
