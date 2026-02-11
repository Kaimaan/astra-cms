/**
 * Content Types
 *
 * Defines Page, Site, Asset, Post, TeamMember, and related content types.
 * NO Next.js imports - pure TypeScript
 */

import type { BlockInstance } from '../block-system/types';

// =============================================================================
// PAGE
// =============================================================================

export type PageStatus = 'draft' | 'published' | 'scheduled';

export interface SEOConfig {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Page revision for history tracking
 */
export interface PageRevision {
  /** Revision ID */
  id: string;

  /** When this revision was created */
  createdAt: Date;

  /** User who made the change (if available) */
  createdBy?: string;

  /** Description of what changed */
  changeDescription?: string;

  /** Snapshot of the page at this revision */
  snapshot: {
    title: string;
    blocks: BlockInstance[];
    seo?: SEOConfig;
    paths?: Record<string, string>;
  };
}

export interface Page {
  /** Unique page ID (internal, never in URL) */
  id: string;

  /** Page schema version - for migrations */
  schemaVersion: number;

  /** Default locale for this page */
  locale: string;

  /**
   * Locale-specific URL paths
   * e.g., { 'en-GB': 'services', 'fi-FI': 'palvelut' }
   * If not set for a locale, falls back to the key in the default locale
   */
  paths: Record<string, string>;

  /**
   * Old URLs that should 301 redirect to this page
   * e.g., ['old-services', 'our-services']
   */
  redirects?: string[];

  /** Page title */
  title: string;

  /** Publication status */
  status: PageStatus;

  /** When the page was published (if published) */
  publishedAt?: Date;

  /** When to auto-publish (for scheduled status) */
  scheduledAt?: Date;

  /** Ordered list of blocks */
  blocks: BlockInstance[];

  /** SEO configuration */
  seo?: SEOConfig;

  /** Revision history (most recent first) */
  revisions?: PageRevision[];

  /** Maximum revisions to keep (default: 20) */
  maxRevisions?: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

// Current page schema version
export const PAGE_SCHEMA_VERSION = 2;

// =============================================================================
// BLOG POSTS
// =============================================================================

export type PostStatus = 'draft' | 'published' | 'scheduled';

export interface Post {
  /** Unique post ID */
  id: string;

  /** Post schema version */
  schemaVersion: number;

  /** Locale code */
  locale: string;

  /** URL slug */
  slug: string;

  /** Post title */
  title: string;

  /** Short excerpt/summary */
  excerpt?: string;

  /** Featured image URL */
  featuredImage?: string;

  /** Post content (markdown or HTML) */
  content: string;

  /** Author ID (references TeamMember) */
  authorId?: string;

  /** Category slugs */
  categories?: string[];

  /** Tag slugs */
  tags?: string[];

  /** Publication status */
  status: PostStatus;

  /** When published */
  publishedAt?: Date;

  /** Scheduled publish date */
  scheduledAt?: Date;

  /** SEO configuration */
  seo?: SEOConfig;

  /** Reading time in minutes (computed) */
  readingTime?: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

// Current post schema version
export const POST_SCHEMA_VERSION = 1;

// =============================================================================
// TEAM MEMBERS
// =============================================================================

export interface TeamMember {
  /** Unique member ID */
  id: string;

  /** Display name */
  name: string;

  /** Job title/role */
  role?: string;

  /** Bio/description */
  bio?: string;

  /** Profile image URL */
  avatar?: string;

  /** Email (public) */
  email?: string;

  /** Social links */
  social?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };

  /** Display order (lower = first) */
  order?: number;

  /** Is this member active/visible? */
  active: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CATEGORIES
// =============================================================================

export interface Category {
  /** Unique category ID */
  id: string;

  /** URL slug */
  slug: string;

  /** Display name */
  name: string;

  /** Description */
  description?: string;

  /** Parent category ID (for hierarchy) */
  parentId?: string;

  /** Display order */
  order?: number;
}

// =============================================================================
// SITE GLOBALS
// =============================================================================

export interface HeaderConfig {
  /** Logo configuration */
  logo?: {
    src?: string;
    text?: string;
    href?: string;
  };

  /** Navigation items (can override config) */
  navigation?: Array<{
    label: string;
    href: string;
  }>;

  /** Call-to-action button */
  cta?: {
    label: string;
    href: string;
  };

  /** Sticky header */
  sticky?: boolean;
}

export interface FooterConfig {
  /** Logo/brand */
  logo?: {
    src?: string;
    text?: string;
  };

  /** Description text */
  description?: string;

  /** Link groups */
  linkGroups?: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;

  /** Copyright text */
  copyright?: string;

  /** Social links */
  social?: Array<{
    platform: string;
    href: string;
    icon?: string;
  }>;
}

export interface SiteGlobals {
  header: HeaderConfig;
  footer: FooterConfig;
}

export interface Site {
  /** Site ID (usually 'default') */
  id: string;

  /** Site schema version */
  schemaVersion: number;

  /** Global components */
  globals: SiteGlobals;

  /** Path to favicon (admin-editable, overrides astra.config.ts) */
  favicon?: string;

  /** Path to Apple touch icon (admin-editable, overrides astra.config.ts) */
  appleTouchIcon?: string;

  /** Timestamps */
  updatedAt: Date;
}

// Current site schema version
export const SITE_SCHEMA_VERSION = 1;

// =============================================================================
// ASSETS
// =============================================================================

export type AssetType = 'image' | 'video' | 'document';

export interface Asset {
  /** Unique asset ID */
  id: string;

  /** Asset type */
  type: AssetType;

  /** Original filename */
  filename: string;

  /** Storage URL */
  url: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  size: number;

  /** Image/video dimensions */
  width?: number;
  height?: number;

  /** Alt text for images */
  alt?: string;

  /** Optional title/caption */
  title?: string;

  /** Timestamps */
  createdAt: Date;
}

// =============================================================================
// FORM SUBMISSIONS
// =============================================================================

export interface FormSubmissionRecord {
  /** Unique submission ID */
  id: string;

  /** Form identifier (e.g. "contact", "newsletter", "quote-request") */
  formId: string;

  /** Display name of the form */
  formName?: string;

  /** Page ID where the form was submitted */
  pageId: string;

  /** Structured contact fields (known shape for CRM deduplication by email) */
  contact: {
    email?: string;
    name?: string;
    phone?: string;
    company?: string;
  };

  /** Arbitrary form fields (key-value, for dynamic/custom forms) */
  fields: Record<string, string | number | boolean | string[]>;

  /** Whether the user gave GDPR/privacy consent */
  consentGiven?: boolean;

  /** When the submission was created */
  createdAt: Date;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Create a new draft page
 */
export function createPage(
  locale: string,
  path: string,
  title: string
): Omit<Page, 'createdAt' | 'updatedAt'> {
  return {
    id: generateId('page'),
    schemaVersion: PAGE_SCHEMA_VERSION,
    locale,
    paths: { [locale]: path },
    title,
    status: 'draft',
    blocks: [],
  };
}

/**
 * Create a new draft post
 */
export function createPost(
  locale: string,
  slug: string,
  title: string
): Omit<Post, 'createdAt' | 'updatedAt'> {
  return {
    id: generateId('post'),
    schemaVersion: POST_SCHEMA_VERSION,
    locale,
    slug,
    title,
    content: '',
    status: 'draft',
  };
}

/**
 * Get the URL path for a page in a specific locale
 */
export function getPagePath(page: Page, locale: string): string {
  return page.paths[locale] || page.paths[page.locale] || '';
}

/**
 * Create a page revision from current state
 */
export function createRevision(
  page: Page,
  changeDescription?: string,
  createdBy?: string
): PageRevision {
  return {
    id: generateId('rev'),
    createdAt: new Date(),
    createdBy,
    changeDescription,
    snapshot: {
      title: page.title,
      blocks: JSON.parse(JSON.stringify(page.blocks)),
      seo: page.seo ? JSON.parse(JSON.stringify(page.seo)) : undefined,
      paths: { ...page.paths },
    },
  };
}
