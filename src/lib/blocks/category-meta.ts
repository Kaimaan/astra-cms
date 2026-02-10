import type { BlockCategory } from '@/core/blocks/types';

export const categoryLabels: Record<BlockCategory, string> = {
  content: 'Content',
  media: 'Media',
  layout: 'Layout',
  interactive: 'Interactive',
};

export const categoryColors: Record<BlockCategory, string> = {
  content: 'bg-blue-100 text-blue-800',
  media: 'bg-purple-100 text-purple-800',
  layout: 'bg-green-100 text-green-800',
  interactive: 'bg-orange-100 text-orange-800',
};
