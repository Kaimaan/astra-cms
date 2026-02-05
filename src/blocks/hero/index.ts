/**
 * Hero Block Definition
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/blocks/types';
import { registerBlock } from '@/core/blocks/registry';
import { HeroRenderer } from './renderer';

// =============================================================================
// SCHEMA
// =============================================================================

export const heroSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  cta: z
    .object({
      label: z.string(),
      href: z.string(),
      variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
    })
    .optional(),
  secondaryCta: z
    .object({
      label: z.string(),
      href: z.string(),
      variant: z.enum(['primary', 'secondary', 'outline']).default('outline'),
    })
    .optional(),
  backgroundImage: z.string().url().optional(),
});

export type HeroProps = z.output<typeof heroSchema>;

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

export const heroBlock = registerBlock<HeroProps>({
  type: 'hero',
  version: 1,
  schema: heroSchema,
  defaultProps: {
    title: 'Welcome to Your Site',
    subtitle: 'Build something amazing',
    alignment: 'center',
  },
  render: HeroRenderer,
  label: 'Hero',
  description: 'Large hero section with title, subtitle, and call-to-action',
  icon: 'Layout',
  category: 'content',
});
