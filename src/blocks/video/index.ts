/**
 * Video Block Definition
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/block-system/types';
import { registerBlock } from '@/core/block-system/registry';
import { VideoRenderer } from './renderer';

// =============================================================================
// SCHEMA
// =============================================================================

export const videoSchema = z.object({
  src: z.string().min(1, 'Video source is required'),
  type: z.enum(['hosted', 'embed']).default('hosted'),
  poster: z.string().url().optional(),
  title: z.string().optional(),
  autoplay: z.boolean().default(false),
  loop: z.boolean().default(false),
  muted: z.boolean().default(false),
  controls: z.boolean().default(true),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16']).default('16:9'),
});

export type VideoProps = z.output<typeof videoSchema>;

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

export const videoBlock = registerBlock<VideoProps>({
  type: 'video',
  version: 1,
  schema: videoSchema,
  defaultProps: {
    src: '',
    type: 'hosted',
    autoplay: false,
    loop: false,
    muted: false,
    controls: true,
    aspectRatio: '16:9',
  },
  render: VideoRenderer,
  label: 'Video',
  description: 'Embedded video player for hosted videos or YouTube/Vimeo',
  icon: 'Play',
  category: 'media',
});
