/**
 * Block System Types
 *
 * Defines the core block interfaces using a registry pattern.
 * NO Next.js imports - pure TypeScript
 *
 * Key concepts:
 * - BlockDefinition: What a block IS (schema, defaults, metadata)
 * - BlockInstance: A block placed on a page (id, type, version, props)
 */

import type { ZodType, ZodTypeDef } from 'zod';

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

/**
 * Defines a block type with its schema, defaults, and metadata.
 * Each block module exports one of these.
 */
export interface BlockDefinition<TProps = unknown> {
  /** Unique block type identifier (e.g., 'hero', 'features') */
  type: string;

  /** Schema version - increment when props structure changes */
  version: number;

  /** Zod schema for validating props - output type should match TProps */
  schema: ZodType<TProps, ZodTypeDef, unknown>;

  /** Default props for new instances */
  defaultProps: TProps;

  /**
   * React component that renders the block.
   * Note: This is typed as `unknown` here to avoid React imports in core.
   * The actual type is ComponentType<BlockRendererProps<TProps>>
   */
  render: unknown;

  // Metadata for admin UI
  /** Human-readable name */
  label: string;

  /** Description shown in block picker */
  description?: string;

  /** Icon identifier (e.g., 'Layout', 'Type', 'Image') */
  icon?: string;

  /** Category for grouping in admin UI */
  category?: BlockCategory;
}

export type BlockCategory = 'content' | 'media' | 'layout' | 'interactive';

// =============================================================================
// BLOCK INSTANCE
// =============================================================================

/**
 * A block instance on a page.
 * Props are validated against the block's schema on save.
 */
export interface BlockInstance {
  /** Unique instance ID */
  id: string;

  /** Block type (references BlockDefinition.type) */
  type: string;

  /** Schema version at time of creation */
  version: number;

  /** Block props (validated against schema) */
  props: unknown;
}

// =============================================================================
// BLOCK RENDERER PROPS
// =============================================================================

/**
 * Props passed to a block's render component.
 * Defined here for reference, actual typing in React layer.
 */
export interface BlockRendererProps<TProps = unknown> {
  /** The validated block props */
  props: TProps;

  /** Block instance ID (for edit mode) */
  blockId: string;

  /** Whether the block is in edit mode */
  editMode?: boolean;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a unique block instance ID
 */
export function generateBlockId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `block_${timestamp}_${random}`;
}

/**
 * Create a new block instance from a definition
 */
export function createBlockInstance<TProps>(
  definition: BlockDefinition<TProps>,
  propsOverride?: Partial<TProps>
): BlockInstance {
  return {
    id: generateBlockId(),
    type: definition.type,
    version: definition.version,
    props: { ...definition.defaultProps, ...propsOverride },
  };
}
