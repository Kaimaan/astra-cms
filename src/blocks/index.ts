/**
 * Block Registry Entry Point
 *
 * Auto-discovers and imports all block directories under src/blocks/.
 * Each block self-registers when imported via registerBlock().
 *
 * To add a new block, create a directory in src/blocks/ with an index.ts
 * that calls registerBlock(). It will be picked up automatically.
 */

// Auto-import all block directories (each block self-registers)
const blockModules = require.context('./', true, /^\.\/[^/]+\/index\.ts$/);
blockModules.keys().forEach(blockModules);

// Re-export registry functions for convenience
export {
  getBlockDefinition,
  getAllBlocks,
  getBlocksByCategory,
  isBlockRegistered,
  getBlockTypes,
} from '@/core/blocks/registry';
