/**
 * Blog List Block
 *
 * A collection block that automatically fetches and displays blog posts.
 * Supports filtering by category, limiting posts, and different layouts.
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/block-system/types';
import { registerBlock } from '@/core/block-system/registry';
import { BlogListRenderer } from './renderer';

export const blogListSchema = z.object({
  /** Section title */
  title: z.string().optional(),

  /** Section subtitle/description */
  subtitle: z.string().optional(),

  /** Filter by category slug */
  category: z.string().optional(),

  /** Maximum posts to display */
  limit: z.number().min(1).max(50).default(6),

  /** Layout style */
  layout: z.enum(['grid', 'list', 'featured']).default('grid'),

  /** Number of columns (for grid layout) */
  columns: z.enum(['2', '3', '4']).default('3'),

  /** Show excerpt */
  showExcerpt: z.boolean().default(true),

  /** Show author */
  showAuthor: z.boolean().default(true),

  /** Show date */
  showDate: z.boolean().default(true),

  /** Show category badges */
  showCategories: z.boolean().default(true),

  /** Link to blog listing page */
  viewAllLink: z.string().optional(),

  /** "View all" button text */
  viewAllText: z.string().default('View all posts'),
});

export type BlogListProps = z.output<typeof blogListSchema>;

export const blogListBlock = registerBlock<BlogListProps>({
  type: 'blog-list',
  version: 1,
  schema: blogListSchema,
  defaultProps: {
    title: 'Latest Posts',
    limit: 6,
    layout: 'grid',
    columns: '3',
    showExcerpt: true,
    showAuthor: true,
    showDate: true,
    showCategories: true,
    viewAllText: 'View all posts',
  },
  render: BlogListRenderer,
  label: 'Blog List',
  description: 'Display a list of blog posts with filtering options',
  icon: 'FileText',
  category: 'content',
});
