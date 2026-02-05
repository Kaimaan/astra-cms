/**
 * Block Registry
 *
 * Central registry for all block definitions.
 * Blocks register themselves when imported.
 * NO Next.js imports - pure TypeScript
 */

import type { BlockDefinition, BlockInstance, BlockCategory } from './types';

// =============================================================================
// REGISTRY
// =============================================================================

const registry = new Map<string, BlockDefinition>();

/**
 * Register a block definition
 */
export function registerBlock<TProps>(
  definition: BlockDefinition<TProps>
): BlockDefinition<TProps> {
  if (registry.has(definition.type)) {
    console.warn(
      `Block type "${definition.type}" is already registered. Overwriting.`
    );
  }
  registry.set(definition.type, definition as BlockDefinition);
  return definition;
}

/**
 * Get a block definition by type
 */
export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return registry.get(type);
}

/**
 * Get all registered block definitions
 */
export function getAllBlocks(): BlockDefinition[] {
  return Array.from(registry.values());
}

/**
 * Get blocks by category
 */
export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return getAllBlocks().filter((block) => block.category === category);
}

/**
 * Check if a block type is registered
 */
export function isBlockRegistered(type: string): boolean {
  return registry.has(type);
}

/**
 * Get block types as array
 */
export function getBlockTypes(): string[] {
  return Array.from(registry.keys());
}

// =============================================================================
// BLOCK INSTANCE HELPERS
// =============================================================================

/**
 * Get the definition for a block instance
 */
export function getDefinitionForInstance(
  instance: BlockInstance
): BlockDefinition | undefined {
  return getBlockDefinition(instance.type);
}

/**
 * Check if a block instance needs migration
 * (instance version < definition version)
 */
export function needsMigration(instance: BlockInstance): boolean {
  const definition = getBlockDefinition(instance.type);
  if (!definition) return false;
  return instance.version < definition.version;
}
