/**
 * CTA (Call to Action) Block Definition
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/blocks/types';
import { registerBlock } from '@/core/blocks/registry';
import { CTARenderer } from './renderer';

// =============================================================================
// SCHEMA
// =============================================================================

export const ctaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  cta: z.object({
    label: z.string().min(1, 'Button label is required'),
    href: z.string().min(1, 'Button link is required'),
    variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  }),
  secondaryCta: z
    .object({
      label: z.string(),
      href: z.string(),
      variant: z.enum(['primary', 'secondary', 'outline']).default('outline'),
    })
    .optional(),
  variant: z.enum(['default', 'highlighted']).default('default'),
});

export type CTAProps = z.output<typeof ctaSchema>;

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

export const ctaBlock = registerBlock<CTAProps>({
  type: 'cta',
  version: 1,
  schema: ctaSchema,
  defaultProps: {
    title: 'Ready to get started?',
    description: 'Join thousands of teams building with Astra CMS.',
    cta: {
      label: 'Get Started',
      href: '/admin',
      variant: 'primary',
    },
    variant: 'default',
  },
  render: CTARenderer,
  label: 'Call to Action',
  description: 'Prominent call-to-action section with button',
  icon: 'MousePointer',
  category: 'content',
});
