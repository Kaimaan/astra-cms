import { z } from 'zod';

export const updateAssetSchema = z.object({
  alt: z.string().optional(),
  title: z.string().optional(),
}).strict();
