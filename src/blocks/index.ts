/**
 * Block Registry Entry Point
 *
 * Import this file to register all blocks with the registry.
 * Each block self-registers when imported.
 */

// Import all blocks (they self-register)
export { heroBlock } from './hero';
export { featuresBlock } from './features';
export { ctaBlock } from './cta';
export { richTextBlock } from './rich-text';
export { videoBlock } from './video';

// Collection blocks (auto-fetch content)
export { blogListBlock } from './blog-list';
export { teamListBlock } from './team-list';

// Re-export registry functions for convenience
export {
  getBlockDefinition,
  getAllBlocks,
  getBlocksByCategory,
  isBlockRegistered,
  getBlockTypes,
} from '@/core/blocks/registry';
