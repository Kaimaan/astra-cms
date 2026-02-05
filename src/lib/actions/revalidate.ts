'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Revalidate a specific page path
 * Called from admin UI when content is published
 */
export async function revalidatePagePath(path: string) {
  revalidatePath(path);
  return { revalidated: true, path, timestamp: Date.now() };
}

/**
 * Revalidate by cache tag
 */
export async function revalidateByTag(tag: string) {
  revalidateTag(tag);
  return { revalidated: true, tag, timestamp: Date.now() };
}

/**
 * Revalidate all pages (use sparingly)
 */
export async function revalidateAllPages() {
  revalidatePath('/[locale]', 'layout');
  return { revalidated: true, scope: 'all', timestamp: Date.now() };
}
