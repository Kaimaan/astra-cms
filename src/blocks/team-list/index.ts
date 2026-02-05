/**
 * Team List Block
 *
 * A collection block that automatically fetches and displays team members.
 * Supports different layouts and display options.
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/blocks/types';
import { registerBlock } from '@/core/blocks/registry';
import { TeamListRenderer } from './renderer';

export const teamListSchema = z.object({
  /** Section title */
  title: z.string().optional(),

  /** Section subtitle/description */
  subtitle: z.string().optional(),

  /** Maximum members to display (0 = all) */
  limit: z.number().min(0).max(50).default(0),

  /** Layout style */
  layout: z.enum(['grid', 'list', 'compact']).default('grid'),

  /** Number of columns (for grid layout) */
  columns: z.enum(['2', '3', '4', '5']).default('4'),

  /** Show role/title */
  showRole: z.boolean().default(true),

  /** Show bio */
  showBio: z.boolean().default(false),

  /** Show email */
  showEmail: z.boolean().default(false),

  /** Show social links */
  showSocial: z.boolean().default(true),
});

export type TeamListProps = z.output<typeof teamListSchema>;

export const teamListBlock = registerBlock<TeamListProps>({
  type: 'team-list',
  version: 1,
  schema: teamListSchema,
  defaultProps: {
    title: 'Our Team',
    limit: 0,
    layout: 'grid',
    columns: '4',
    showRole: true,
    showBio: false,
    showEmail: false,
    showSocial: true,
  },
  render: TeamListRenderer,
  label: 'Team List',
  description: 'Display team members in various layouts',
  icon: 'Users',
  category: 'content',
});
