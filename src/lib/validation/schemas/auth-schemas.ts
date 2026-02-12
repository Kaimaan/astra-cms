import { z } from 'zod';

export const setupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  password: z.string().min(8).max(128).optional(),
});
