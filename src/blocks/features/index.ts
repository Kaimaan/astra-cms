/**
 * Features Block Definition
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/block-system/types';
import { registerBlock } from '@/core/block-system/registry';
import { FeaturesRenderer } from './renderer';

// =============================================================================
// SCHEMA
// =============================================================================

const featureSchema = z.object({
  icon: z.string().optional(),
  title: z.string().min(1, 'Feature title is required'),
  description: z.string().min(1, 'Feature description is required'),
});

export const featuresSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  features: z.array(featureSchema).min(1, 'At least one feature is required'),
  columns: z.enum(['2', '3', '4']).default('3'),
});

export type Feature = z.output<typeof featureSchema>;
export type FeaturesProps = z.output<typeof featuresSchema>;

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

export const featuresBlock = registerBlock<FeaturesProps>({
  type: 'features',
  version: 1,
  schema: featuresSchema,
  defaultProps: {
    title: 'Features',
    features: [
      {
        icon: 'Zap',
        title: 'Fast Performance',
        description: 'Built for speed with optimized rendering and caching.',
      },
      {
        icon: 'Shield',
        title: 'Secure by Default',
        description: 'Enterprise-grade security with role-based access control.',
      },
      {
        icon: 'Puzzle',
        title: 'Extensible',
        description: 'Add custom blocks and components with AI assistance.',
      },
    ],
    columns: '3',
  },
  render: FeaturesRenderer,
  label: 'Features',
  description: 'Grid of features with icons, titles, and descriptions',
  icon: 'Grid',
  category: 'content',
});
