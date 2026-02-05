/**
 * Rich Text Block Definition
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/blocks/types';
import { registerBlock } from '@/core/blocks/registry';
import { RichTextRenderer } from './renderer';

// =============================================================================
// SCHEMA
// =============================================================================

export const richTextSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  maxWidth: z.enum(['sm', 'md', 'lg', 'full']).default('md'),
});

export type RichTextProps = z.output<typeof richTextSchema>;

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

export const richTextBlock = registerBlock<RichTextProps>({
  type: 'rich-text',
  version: 1,
  schema: richTextSchema,
  defaultProps: {
    content: '<p>Start writing your content here...</p>',
    maxWidth: 'md',
  },
  render: RichTextRenderer,
  label: 'Rich Text',
  description: 'Free-form text content with formatting',
  icon: 'Type',
  category: 'content',
});
