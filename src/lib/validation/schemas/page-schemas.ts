import { z } from 'zod';
import { idParam } from '../validate';

/** Matches existing path regex from pages POST route */
const pathFormat = z.string().transform((val) => val.replace(/^\/+|\/+$/g, '')).pipe(
  z.string().regex(
    /^[a-zA-Z0-9][a-zA-Z0-9\-/]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$|^$/,
    'Invalid path. Use only letters, numbers, hyphens, and forward slashes.',
  ),
);

const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().optional(),
  noIndex: z.boolean().optional(),
}).strict();

const blockInstanceSchema = z.object({
  id: z.string(),
  type: z.string(),
  version: z.number(),
  props: z.unknown(),
});

export const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required').transform((v) => v.trim()),
  path: pathFormat,
});

export const updatePageSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  paths: z.record(z.string(), z.string()).optional(),
  blocks: z.array(blockInstanceSchema).optional(),
  seo: seoSchema.optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  changeDescription: z.string().optional(),
}).strict();

export const restoreRevisionSchema = z.object({
  revisionId: idParam,
});
