/**
 * Lifecycle Hook Types
 *
 * Defines hooks that fire after content operations.
 * All hooks are async. Errors are caught and logged, never breaking the main operation.
 * NO Next.js imports - pure TypeScript
 */

import type { Page, Asset, Site } from '../content/types';

export interface HooksConfig {
  /** Fires after a page is published */
  onPagePublished?: (page: Page) => Promise<void>;

  /** Fires after a page is unpublished (returned to draft) */
  onPageUnpublished?: (page: Page) => Promise<void>;

  /** Fires after a page is updated */
  onPageUpdated?: (page: Page, changes: Partial<Page>) => Promise<void>;

  /** Fires after a page is deleted */
  onPageDeleted?: (pageId: string) => Promise<void>;

  /** Fires after a new asset is uploaded */
  onAssetUploaded?: (asset: Asset) => Promise<void>;

  /** Fires after an asset is deleted */
  onAssetDeleted?: (assetId: string) => Promise<void>;

  /** Fires after site config (header, footer, globals) is updated */
  onConfigChanged?: (config: Site) => Promise<void>;
}
