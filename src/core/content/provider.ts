/**
 * Content Provider Interface
 *
 * Defines the interface for content storage operations.
 * Firebase, Supabase, or any other backend can implement this.
 * NO Next.js imports - pure TypeScript
 *
 * TO IMPLEMENT A NEW PROVIDER:
 * 1. Create a class that implements ContentProvider
 * 2. See /src/infrastructure/local/content-provider.ts for reference
 * 3. Register it in /src/infrastructure/index.ts
 */

import type { Page, Site, Asset, Post, TeamMember, Category } from './types';

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export interface PageQueryOptions {
  /** Filter by locale */
  locale?: string;

  /** Filter by status */
  status?: 'draft' | 'published' | 'scheduled' | 'all';

  /** Pagination limit */
  limit?: number;

  /** Pagination offset */
  offset?: number;

  /** Sort field */
  sortBy?: 'createdAt' | 'updatedAt' | 'title';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

export interface PostQueryOptions {
  /** Filter by locale */
  locale?: string;

  /** Filter by status */
  status?: 'draft' | 'published' | 'scheduled' | 'all';

  /** Filter by category slug */
  category?: string;

  /** Filter by tag slug */
  tag?: string;

  /** Filter by author ID */
  authorId?: string;

  /** Pagination limit */
  limit?: number;

  /** Pagination offset */
  offset?: number;

  /** Sort field */
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

export interface TeamMemberQueryOptions {
  /** Only active members */
  activeOnly?: boolean;

  /** Pagination limit */
  limit?: number;

  /** Pagination offset */
  offset?: number;
}

export interface AssetQueryOptions {
  /** Filter by type */
  type?: 'image' | 'video' | 'document';

  /** Pagination limit */
  limit?: number;

  /** Pagination offset */
  offset?: number;

  /** Sort field */
  sortBy?: 'createdAt' | 'filename' | 'size';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// STATIC GENERATION
// =============================================================================

/**
 * Lightweight page path info for static generation
 * Used by generateStaticParams in Next.js routes
 */
export interface StaticPagePath {
  /** The locale code (e.g., 'en-GB') */
  locale: string;
  /** The URL path for this locale (empty string for homepage) */
  path: string;
}

// =============================================================================
// REDIRECT RESULT
// =============================================================================

export interface RedirectResult {
  /** The page that should be displayed */
  page: Page;

  /** The canonical path to redirect to (if different from requested) */
  redirectTo?: string;

  /** HTTP status code (301 for permanent, 302 for temporary) */
  statusCode?: 301 | 302;
}

// =============================================================================
// CONTENT PROVIDER INTERFACE
// =============================================================================

export interface ContentProvider {
  // -------------------------------------------------------------------------
  // PAGES
  // -------------------------------------------------------------------------

  /**
   * Get a single page by ID
   */
  getPage(id: string): Promise<Page | null>;

  /**
   * Get a page by path and locale
   * Also checks redirects and returns redirect info if applicable
   */
  getPageByPath(path: string, locale: string): Promise<RedirectResult | null>;

  /**
   * Get published page by path (for public site)
   * Returns redirect info if the path is an old URL
   */
  getPublishedPage(path: string, locale: string): Promise<RedirectResult | null>;

  /**
   * List pages with optional filters
   */
  getPages(options?: PageQueryOptions): Promise<Page[]>;

  /**
   * Create a new page
   */
  createPage(page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page>;

  /**
   * Update an existing page (automatically creates revision)
   */
  updatePage(
    id: string,
    updates: Partial<Page>,
    changeDescription?: string
  ): Promise<Page>;

  /**
   * Delete a page
   * @param redirectToId - Optional page ID to redirect old URLs to
   */
  deletePage(id: string, redirectToId?: string): Promise<void>;

  /**
   * Publish a page (set status to published)
   */
  publishPage(id: string): Promise<Page>;

  /**
   * Unpublish a page (set status to draft)
   */
  unpublishPage(id: string): Promise<Page>;

  /**
   * Schedule a page for future publication
   */
  schedulePage(id: string, publishAt: Date): Promise<Page>;

  /**
   * Restore a page to a previous revision
   */
  restoreRevision(pageId: string, revisionId: string): Promise<Page>;

  /**
   * Get all redirects (for middleware)
   * Returns map of old path -> { targetPath, locale }
   */
  getRedirects(): Promise<Map<string, { targetPath: string; locale: string }>>;

  /**
   * Get all published page paths for static generation
   * Used by generateStaticParams in Next.js routes
   * Returns lightweight path data only (no full page content)
   */
  getStaticPagePaths(): Promise<StaticPagePath[]>;

  // -------------------------------------------------------------------------
  // POSTS (Blog)
  // -------------------------------------------------------------------------

  /**
   * Get a single post by ID
   */
  getPost(id: string): Promise<Post | null>;

  /**
   * Get a post by slug and locale
   */
  getPostBySlug(slug: string, locale: string): Promise<Post | null>;

  /**
   * List posts with optional filters
   */
  getPosts(options?: PostQueryOptions): Promise<Post[]>;

  /**
   * Create a new post
   */
  createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post>;

  /**
   * Update an existing post
   */
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;

  /**
   * Delete a post
   */
  deletePost(id: string): Promise<void>;

  /**
   * Publish a post
   */
  publishPost(id: string): Promise<Post>;

  /**
   * Schedule a post for future publication
   */
  schedulePost(id: string, publishAt: Date): Promise<Post>;

  // -------------------------------------------------------------------------
  // TEAM MEMBERS
  // -------------------------------------------------------------------------

  /**
   * Get a single team member by ID
   */
  getTeamMember(id: string): Promise<TeamMember | null>;

  /**
   * List team members
   */
  getTeamMembers(options?: TeamMemberQueryOptions): Promise<TeamMember[]>;

  /**
   * Create a new team member
   */
  createTeamMember(
    member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TeamMember>;

  /**
   * Update a team member
   */
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember>;

  /**
   * Delete a team member
   */
  deleteTeamMember(id: string): Promise<void>;

  // -------------------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------------------

  /**
   * Get a category by ID
   */
  getCategory(id: string): Promise<Category | null>;

  /**
   * Get a category by slug
   */
  getCategoryBySlug(slug: string): Promise<Category | null>;

  /**
   * List all categories
   */
  getCategories(): Promise<Category[]>;

  /**
   * Create a category
   */
  createCategory(category: Omit<Category, 'id'>): Promise<Category>;

  /**
   * Update a category
   */
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;

  /**
   * Delete a category
   */
  deleteCategory(id: string): Promise<void>;

  // -------------------------------------------------------------------------
  // SITE
  // -------------------------------------------------------------------------

  /**
   * Get site configuration
   */
  getSite(): Promise<Site | null>;

  /**
   * Update site configuration
   */
  updateSite(updates: Partial<Site>): Promise<Site>;

  // -------------------------------------------------------------------------
  // ASSETS
  // -------------------------------------------------------------------------

  /**
   * Get a single asset by ID
   */
  getAsset(id: string): Promise<Asset | null>;

  /**
   * List assets with optional filters
   */
  getAssets(options?: AssetQueryOptions): Promise<Asset[]>;

  /**
   * Upload a new asset
   */
  uploadAsset(
    file: File | Buffer,
    metadata: {
      filename: string;
      mimeType: string;
      alt?: string;
      title?: string;
    }
  ): Promise<Asset>;

  /**
   * Update asset metadata
   */
  updateAsset(id: string, updates: Partial<Asset>): Promise<Asset>;

  /**
   * Delete an asset
   */
  deleteAsset(id: string): Promise<void>;

  // -------------------------------------------------------------------------
  // SCHEDULED CONTENT
  // -------------------------------------------------------------------------

  /**
   * Process scheduled content (publish items whose scheduledAt has passed)
   * Should be called periodically (e.g., by a cron job)
   */
  processScheduledContent(): Promise<{ pages: number; posts: number }>;
}

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

let currentProvider: ContentProvider | null = null;

/**
 * Set the active content provider
 */
export function setContentProvider(provider: ContentProvider): void {
  currentProvider = provider;
}

/**
 * Get the active content provider
 * @throws Error if no provider is set
 */
export function getContentProvider(): ContentProvider {
  if (!currentProvider) {
    throw new Error(
      'No content provider configured. Call setContentProvider() first.'
    );
  }
  return currentProvider;
}
