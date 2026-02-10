import { z } from 'zod';

const brandVoiceSchema = z.object({
  name: z.string(),
  tone: z.string(),
  audience: z.string().optional(),
  values: z.array(z.string()).optional(),
  preferredTerms: z.array(z.string()).optional(),
  avoidTerms: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  additionalContext: z.string().optional(),
});

const generateSchema = z.object({
  action: z.literal('generate'),
  prompt: z.string().min(1, 'Prompt is required'),
  type: z.enum(['title', 'description', 'content', 'seo', 'custom']),
  context: z.string().optional(),
  brandVoice: brandVoiceSchema.optional(),
  maxLength: z.number().int().positive().optional(),
  variations: z.number().int().positive().optional(),
});

const improveSchema = z.object({
  action: z.literal('improve'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['grammar', 'clarity', 'tone', 'seo', 'shorten', 'expand']),
  brandVoice: brandVoiceSchema.optional(),
  instructions: z.string().optional(),
});

const suggestSchema = z.object({
  action: z.literal('suggest'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['titles', 'keywords', 'improvements', 'cta']),
  count: z.number().int().positive().optional(),
});

export const aiActionSchema = z.discriminatedUnion('action', [
  generateSchema,
  improveSchema,
  suggestSchema,
]);

export const editBlockSchema = z.object({
  blockType: z.string().min(1, 'Block type is required'),
  blockLabel: z.string().optional(),
  schemaDescription: z.string().optional(),
  currentProps: z.record(z.string(), z.unknown()),
  userRequest: z.string().min(1, 'User request is required'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});
