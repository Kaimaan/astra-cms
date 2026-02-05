/**
 * Local File-Based Content Provider
 *
 * Stores content as JSON files in the /content directory.
 * Perfect for local development and trying out the CMS.
 * Data persists across restarts.
 *
 * File structure:
 * /content
 *   /pages/{id}.json        - Pages (locale-independent storage)
 *   /posts/{locale}/{slug}.json - Blog posts
 *   /team/{id}.json         - Team members
 *   /categories.json        - Categories
 *   /redirects.json         - Redirect mappings
 *   /assets/assets.json     - Asset metadata
 *   /site.json              - Site config
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  ContentProvider,
  PageQueryOptions,
  PostQueryOptions,
  TeamMemberQueryOptions,
  AssetQueryOptions,
  RedirectResult,
  StaticPagePath,
} from '@/core/content/provider';
import type {
  Page,
  Site,
  Asset,
  Post,
  TeamMember,
  Category,
  PageRevision,
} from '@/core/content/types';
import {
  PAGE_SCHEMA_VERSION,
  POST_SCHEMA_VERSION,
  SITE_SCHEMA_VERSION,
  generateId,
  createRevision,
  getPagePath,
} from '@/core/content/types';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const TEAM_DIR = path.join(CONTENT_DIR, 'team');
const ASSETS_DIR = path.join(CONTENT_DIR, 'assets');
const SITE_FILE = path.join(CONTENT_DIR, 'site.json');
const CATEGORIES_FILE = path.join(CONTENT_DIR, 'categories.json');
const REDIRECTS_FILE = path.join(CONTENT_DIR, 'redirects.json');

const DEFAULT_MAX_REVISIONS = 20;

// =============================================================================
// HELPERS
// =============================================================================

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Directory exists
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content, (key, value) => {
      // Convert date strings back to Date objects
      if (
        key === 'createdAt' ||
        key === 'updatedAt' ||
        key === 'publishedAt' ||
        key === 'scheduledAt'
      ) {
        return value ? new Date(value) : value;
      }
      return value;
    });
  } catch {
    return null;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist
  }
}

async function getAllJsonFiles(dir: string, recursive = false): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      } else if (recursive && entry.isDirectory()) {
        const subFiles = await getAllJsonFiles(fullPath, true);
        files.push(...subFiles);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}

// =============================================================================
// REDIRECT STORAGE
// =============================================================================

interface RedirectEntry {
  fromPath: string;
  toPageId: string;
  locale: string;
}

async function getRedirectEntries(): Promise<RedirectEntry[]> {
  return (await readJsonFile<RedirectEntry[]>(REDIRECTS_FILE)) || [];
}

async function saveRedirectEntries(entries: RedirectEntry[]): Promise<void> {
  await writeJsonFile(REDIRECTS_FILE, entries);
}

// =============================================================================
// LOCAL CONTENT PROVIDER
// =============================================================================

export class LocalContentProvider implements ContentProvider {
  // ---------------------------------------------------------------------------
  // PAGES
  // ---------------------------------------------------------------------------

  async getPage(id: string): Promise<Page | null> {
    const filePath = path.join(PAGES_DIR, `${id}.json`);
    return readJsonFile<Page>(filePath);
  }

  async getPageByPath(pagePath: string, locale: string): Promise<RedirectResult | null> {
    // First, check direct path match
    const files = await getAllJsonFiles(PAGES_DIR);
    for (const file of files) {
      const page = await readJsonFile<Page>(file);
      if (page) {
        const currentPath = getPagePath(page, locale);
        if (currentPath === pagePath) {
          return { page };
        }
      }
    }

    // Check redirects
    const redirects = await getRedirectEntries();
    const redirect = redirects.find(
      (r) => r.fromPath === pagePath && r.locale === locale
    );
    if (redirect) {
      const page = await this.getPage(redirect.toPageId);
      if (page) {
        const canonicalPath = getPagePath(page, locale);
        return {
          page,
          redirectTo: `/${locale}/${canonicalPath}`,
          statusCode: 301,
        };
      }
    }

    // Also check page's own redirects array
    for (const file of files) {
      const page = await readJsonFile<Page>(file);
      if (page && page.redirects?.includes(pagePath)) {
        const canonicalPath = getPagePath(page, locale);
        return {
          page,
          redirectTo: `/${locale}/${canonicalPath}`,
          statusCode: 301,
        };
      }
    }

    return null;
  }

  async getPublishedPage(
    pagePath: string,
    locale: string
  ): Promise<RedirectResult | null> {
    const result = await this.getPageByPath(pagePath, locale);
    if (result && result.page.status === 'published') {
      return result;
    }
    return null;
  }

  async getPages(options?: PageQueryOptions): Promise<Page[]> {
    const files = await getAllJsonFiles(PAGES_DIR);
    const pages: Page[] = [];

    for (const file of files) {
      const page = await readJsonFile<Page>(file);
      if (page) {
        // Filter by locale
        if (options?.locale && page.locale !== options.locale) {
          continue;
        }
        // Filter by status
        if (
          options?.status &&
          options.status !== 'all' &&
          page.status !== options.status
        ) {
          continue;
        }
        pages.push(page);
      }
    }

    // Sort
    const sortBy = options?.sortBy || 'updatedAt';
    const sortOrder = options?.sortOrder || 'desc';
    pages.sort((a, b) => {
      const aVal = a[sortBy as keyof Page];
      const bVal = b[sortBy as keyof Page];
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'desc'
          ? bVal.getTime() - aVal.getTime()
          : aVal.getTime() - bVal.getTime();
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      return 0;
    });

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || pages.length;
    return pages.slice(offset, offset + limit);
  }

  async createPage(
    page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Page> {
    const now = new Date();
    const newPage: Page = {
      ...page,
      id: generateId('page'),
      schemaVersion: PAGE_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    const filePath = path.join(PAGES_DIR, `${newPage.id}.json`);
    await writeJsonFile(filePath, newPage);
    return newPage;
  }

  async updatePage(
    id: string,
    updates: Partial<Page>,
    changeDescription?: string
  ): Promise<Page> {
    const page = await this.getPage(id);
    if (!page) {
      throw new Error(`Page not found: ${id}`);
    }

    // Create revision before updating
    const revision = createRevision(page, changeDescription);
    const revisions = [revision, ...(page.revisions || [])].slice(
      0,
      page.maxRevisions || DEFAULT_MAX_REVISIONS
    );

    // Handle path changes - add old path to redirects
    const newPaths = updates.paths;
    if (newPaths) {
      const oldRedirects = page.redirects || [];
      const newRedirects = [...oldRedirects];
      for (const [locale, newPath] of Object.entries(newPaths)) {
        const oldPath = page.paths[locale];
        if (oldPath && oldPath !== newPath && !newRedirects.includes(oldPath)) {
          newRedirects.push(oldPath);
        }
      }
      updates.redirects = newRedirects;
    }

    const updatedPage: Page = {
      ...page,
      ...updates,
      id: page.id,
      revisions,
      updatedAt: new Date(),
    };

    const filePath = path.join(PAGES_DIR, `${updatedPage.id}.json`);
    await writeJsonFile(filePath, updatedPage);
    return updatedPage;
  }

  async deletePage(id: string, redirectToId?: string): Promise<void> {
    const page = await this.getPage(id);
    if (!page) return;

    // If redirect target specified, save redirects
    if (redirectToId) {
      const targetPage = await this.getPage(redirectToId);
      if (targetPage) {
        const redirectEntries = await getRedirectEntries();

        // Add redirects for all paths of deleted page
        for (const [locale, pagePath] of Object.entries(page.paths)) {
          redirectEntries.push({
            fromPath: pagePath,
            toPageId: redirectToId,
            locale,
          });
        }

        // Also redirect any existing redirects
        if (page.redirects) {
          for (const oldPath of page.redirects) {
            redirectEntries.push({
              fromPath: oldPath,
              toPageId: redirectToId,
              locale: page.locale,
            });
          }
        }

        await saveRedirectEntries(redirectEntries);
      }
    }

    const filePath = path.join(PAGES_DIR, `${page.id}.json`);
    await deleteFile(filePath);
  }

  async publishPage(id: string): Promise<Page> {
    return this.updatePage(
      id,
      {
        status: 'published',
        publishedAt: new Date(),
        scheduledAt: undefined,
      },
      'Published'
    );
  }

  async unpublishPage(id: string): Promise<Page> {
    return this.updatePage(
      id,
      {
        status: 'draft',
      },
      'Unpublished'
    );
  }

  async schedulePage(id: string, publishAt: Date): Promise<Page> {
    return this.updatePage(
      id,
      {
        status: 'scheduled',
        scheduledAt: publishAt,
      },
      `Scheduled for ${publishAt.toISOString()}`
    );
  }

  async restoreRevision(pageId: string, revisionId: string): Promise<Page> {
    const page = await this.getPage(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    const revision = page.revisions?.find((r) => r.id === revisionId);
    if (!revision) {
      throw new Error(`Revision not found: ${revisionId}`);
    }

    return this.updatePage(
      pageId,
      {
        title: revision.snapshot.title,
        blocks: revision.snapshot.blocks,
        seo: revision.snapshot.seo,
        paths: revision.snapshot.paths || page.paths,
      },
      `Restored from revision ${revisionId}`
    );
  }

  async getRedirects(): Promise<Map<string, { targetPath: string; locale: string }>> {
    const map = new Map<string, { targetPath: string; locale: string }>();

    // Get stored redirects
    const entries = await getRedirectEntries();
    for (const entry of entries) {
      const targetPage = await this.getPage(entry.toPageId);
      if (targetPage) {
        const targetPath = getPagePath(targetPage, entry.locale);
        map.set(`${entry.locale}:${entry.fromPath}`, {
          targetPath,
          locale: entry.locale,
        });
      }
    }

    // Also include page-level redirects
    const pages = await this.getPages({ status: 'all' });
    for (const page of pages) {
      if (page.redirects) {
        for (const oldPath of page.redirects) {
          for (const [locale, currentPath] of Object.entries(page.paths)) {
            map.set(`${locale}:${oldPath}`, { targetPath: currentPath, locale });
          }
        }
      }
    }

    return map;
  }

  async getStaticPagePaths(): Promise<StaticPagePath[]> {
    const pages = await this.getPages({ status: 'published' });
    const paths: StaticPagePath[] = [];

    for (const page of pages) {
      // Each page can have paths for multiple locales
      for (const [locale, pagePath] of Object.entries(page.paths)) {
        paths.push({ locale, path: pagePath });
      }
    }

    return paths;
  }

  // ---------------------------------------------------------------------------
  // POSTS
  // ---------------------------------------------------------------------------

  async getPost(id: string): Promise<Post | null> {
    const files = await getAllJsonFiles(POSTS_DIR, true);
    for (const file of files) {
      const post = await readJsonFile<Post>(file);
      if (post && post.id === id) {
        return post;
      }
    }
    return null;
  }

  async getPostBySlug(slug: string, locale: string): Promise<Post | null> {
    const filePath = path.join(POSTS_DIR, locale, `${slug}.json`);
    return readJsonFile<Post>(filePath);
  }

  async getPosts(options?: PostQueryOptions): Promise<Post[]> {
    const files = await getAllJsonFiles(POSTS_DIR, true);
    const posts: Post[] = [];

    for (const file of files) {
      const post = await readJsonFile<Post>(file);
      if (post) {
        // Filter by locale
        if (options?.locale && post.locale !== options.locale) continue;
        // Filter by status
        if (
          options?.status &&
          options.status !== 'all' &&
          post.status !== options.status
        )
          continue;
        // Filter by category
        if (
          options?.category &&
          !post.categories?.includes(options.category)
        )
          continue;
        // Filter by tag
        if (options?.tag && !post.tags?.includes(options.tag)) continue;
        // Filter by author
        if (options?.authorId && post.authorId !== options.authorId) continue;

        posts.push(post);
      }
    }

    // Sort
    const sortBy = options?.sortBy || 'publishedAt';
    const sortOrder = options?.sortOrder || 'desc';
    posts.sort((a, b) => {
      const aVal = a[sortBy as keyof Post];
      const bVal = b[sortBy as keyof Post];
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'desc'
          ? bVal.getTime() - aVal.getTime()
          : aVal.getTime() - bVal.getTime();
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      return 0;
    });

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || posts.length;
    return posts.slice(offset, offset + limit);
  }

  async createPost(
    post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Post> {
    const now = new Date();
    const newPost: Post = {
      ...post,
      id: generateId('post'),
      schemaVersion: POST_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    const filePath = path.join(POSTS_DIR, newPost.locale, `${newPost.slug}.json`);
    await writeJsonFile(filePath, newPost);
    return newPost;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const post = await this.getPost(id);
    if (!post) {
      throw new Error(`Post not found: ${id}`);
    }

    const updatedPost: Post = {
      ...post,
      ...updates,
      id: post.id,
      updatedAt: new Date(),
    };

    // Handle slug change - delete old file
    if (updates.slug && updates.slug !== post.slug) {
      const oldFilePath = path.join(POSTS_DIR, post.locale, `${post.slug}.json`);
      await deleteFile(oldFilePath);
    }

    const filePath = path.join(
      POSTS_DIR,
      updatedPost.locale,
      `${updatedPost.slug}.json`
    );
    await writeJsonFile(filePath, updatedPost);
    return updatedPost;
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.getPost(id);
    if (post) {
      const filePath = path.join(POSTS_DIR, post.locale, `${post.slug}.json`);
      await deleteFile(filePath);
    }
  }

  async publishPost(id: string): Promise<Post> {
    return this.updatePost(id, {
      status: 'published',
      publishedAt: new Date(),
      scheduledAt: undefined,
    });
  }

  async schedulePost(id: string, publishAt: Date): Promise<Post> {
    return this.updatePost(id, {
      status: 'scheduled',
      scheduledAt: publishAt,
    });
  }

  // ---------------------------------------------------------------------------
  // TEAM MEMBERS
  // ---------------------------------------------------------------------------

  async getTeamMember(id: string): Promise<TeamMember | null> {
    const filePath = path.join(TEAM_DIR, `${id}.json`);
    return readJsonFile<TeamMember>(filePath);
  }

  async getTeamMembers(options?: TeamMemberQueryOptions): Promise<TeamMember[]> {
    const files = await getAllJsonFiles(TEAM_DIR);
    let members: TeamMember[] = [];

    for (const file of files) {
      const member = await readJsonFile<TeamMember>(file);
      if (member) {
        if (options?.activeOnly && !member.active) continue;
        members.push(member);
      }
    }

    // Sort by order
    members.sort((a, b) => (a.order || 999) - (b.order || 999));

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || members.length;
    return members.slice(offset, offset + limit);
  }

  async createTeamMember(
    member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TeamMember> {
    const now = new Date();
    const newMember: TeamMember = {
      ...member,
      id: generateId('member'),
      createdAt: now,
      updatedAt: now,
    };

    const filePath = path.join(TEAM_DIR, `${newMember.id}.json`);
    await writeJsonFile(filePath, newMember);
    return newMember;
  }

  async updateTeamMember(
    id: string,
    updates: Partial<TeamMember>
  ): Promise<TeamMember> {
    const member = await this.getTeamMember(id);
    if (!member) {
      throw new Error(`Team member not found: ${id}`);
    }

    const updatedMember: TeamMember = {
      ...member,
      ...updates,
      id: member.id,
      updatedAt: new Date(),
    };

    const filePath = path.join(TEAM_DIR, `${updatedMember.id}.json`);
    await writeJsonFile(filePath, updatedMember);
    return updatedMember;
  }

  async deleteTeamMember(id: string): Promise<void> {
    const filePath = path.join(TEAM_DIR, `${id}.json`);
    await deleteFile(filePath);
  }

  // ---------------------------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------------------------

  async getCategory(id: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.id === id) || null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.slug === slug) || null;
  }

  async getCategories(): Promise<Category[]> {
    const categories = await readJsonFile<Category[]>(CATEGORIES_FILE);
    return categories || [];
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const categories = await this.getCategories();
    const newCategory: Category = {
      ...category,
      id: generateId('cat'),
    };
    categories.push(newCategory);
    await writeJsonFile(CATEGORIES_FILE, categories);
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const categories = await this.getCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Category not found: ${id}`);
    }

    categories[index] = { ...categories[index], ...updates, id };
    await writeJsonFile(CATEGORIES_FILE, categories);
    return categories[index];
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = await this.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    await writeJsonFile(CATEGORIES_FILE, filtered);
  }

  // ---------------------------------------------------------------------------
  // SITE
  // ---------------------------------------------------------------------------

  async getSite(): Promise<Site | null> {
    return readJsonFile<Site>(SITE_FILE);
  }

  async updateSite(updates: Partial<Site>): Promise<Site> {
    let site = await this.getSite();

    if (!site) {
      site = {
        id: 'default',
        schemaVersion: SITE_SCHEMA_VERSION,
        globals: {
          header: {
            logo: { text: 'Astra CMS' },
            sticky: true,
          },
          footer: {
            copyright: `© ${new Date().getFullYear()} Your Company`,
          },
        },
        updatedAt: new Date(),
      };
    }

    const updatedSite: Site = {
      ...site,
      ...updates,
      id: site.id,
      updatedAt: new Date(),
    };

    await writeJsonFile(SITE_FILE, updatedSite);
    return updatedSite;
  }

  // ---------------------------------------------------------------------------
  // ASSETS
  // ---------------------------------------------------------------------------

  async getAsset(id: string): Promise<Asset | null> {
    const assetsFile = path.join(ASSETS_DIR, 'assets.json');
    const assets = await readJsonFile<Asset[]>(assetsFile);
    return assets?.find((a) => a.id === id) || null;
  }

  async getAssets(options?: AssetQueryOptions): Promise<Asset[]> {
    const assetsFile = path.join(ASSETS_DIR, 'assets.json');
    let assets = (await readJsonFile<Asset[]>(assetsFile)) || [];

    // Filter by type
    if (options?.type) {
      assets = assets.filter((a) => a.type === options.type);
    }

    // Sort
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';
    assets.sort((a, b) => {
      const aVal = a[sortBy as keyof Asset];
      const bVal = b[sortBy as keyof Asset];
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'desc'
          ? bVal.getTime() - aVal.getTime()
          : aVal.getTime() - bVal.getTime();
      }
      return 0;
    });

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || assets.length;
    return assets.slice(offset, offset + limit);
  }

  async uploadAsset(
    _file: File | Buffer,
    metadata: { filename: string; mimeType: string; alt?: string; title?: string }
  ): Promise<Asset> {
    const asset: Asset = {
      id: generateId('asset'),
      type: metadata.mimeType.startsWith('image/')
        ? 'image'
        : metadata.mimeType.startsWith('video/')
          ? 'video'
          : 'document',
      filename: metadata.filename,
      url: `/uploads/${metadata.filename}`,
      mimeType: metadata.mimeType,
      size: 0,
      alt: metadata.alt,
      title: metadata.title,
      createdAt: new Date(),
    };

    const assetsFile = path.join(ASSETS_DIR, 'assets.json');
    const assets = (await readJsonFile<Asset[]>(assetsFile)) || [];
    assets.push(asset);
    await writeJsonFile(assetsFile, assets);

    return asset;
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    const assetsFile = path.join(ASSETS_DIR, 'assets.json');
    const assets = (await readJsonFile<Asset[]>(assetsFile)) || [];
    const index = assets.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error(`Asset not found: ${id}`);
    }

    assets[index] = { ...assets[index], ...updates, id };
    await writeJsonFile(assetsFile, assets);
    return assets[index];
  }

  async deleteAsset(id: string): Promise<void> {
    const assetsFile = path.join(ASSETS_DIR, 'assets.json');
    const assets = (await readJsonFile<Asset[]>(assetsFile)) || [];
    const filtered = assets.filter((a) => a.id !== id);
    await writeJsonFile(assetsFile, filtered);
  }

  // ---------------------------------------------------------------------------
  // SCHEDULED CONTENT
  // ---------------------------------------------------------------------------

  async processScheduledContent(): Promise<{ pages: number; posts: number }> {
    const now = new Date();
    let pagesPublished = 0;
    let postsPublished = 0;

    // Process scheduled pages
    const pages = await this.getPages({ status: 'scheduled' });
    for (const page of pages) {
      if (page.scheduledAt && page.scheduledAt <= now) {
        await this.publishPage(page.id);
        pagesPublished++;
      }
    }

    // Process scheduled posts
    const posts = await this.getPosts({ status: 'scheduled' });
    for (const post of posts) {
      if (post.scheduledAt && post.scheduledAt <= now) {
        await this.publishPost(post.id);
        postsPublished++;
      }
    }

    return { pages: pagesPublished, posts: postsPublished };
  }
}

// Export singleton instance
export const localContentProvider = new LocalContentProvider();
