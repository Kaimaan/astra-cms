/**
 * Lifecycle Hooks Registry
 *
 * Manages registration and execution of lifecycle hooks.
 * Follows the same registry pattern as ContentProvider and AIProvider.
 * NO Next.js imports - pure TypeScript
 */

import type { HooksConfig } from './types';

export type { HooksConfig };

let currentHooks: HooksConfig | null = null;

/**
 * Register lifecycle hooks
 */
export function registerHooks(hooks: HooksConfig): void {
  currentHooks = hooks;
}

/**
 * Safely trigger a lifecycle hook by name.
 * Catches and logs any errors — never breaks the calling operation.
 */
export async function triggerHook<K extends keyof HooksConfig>(
  hookName: K,
  ...args: Parameters<NonNullable<HooksConfig[K]>>
): Promise<void> {
  if (!currentHooks) return;

  const handler = currentHooks[hookName];
  if (!handler) return;

  try {
    await (handler as (...a: unknown[]) => Promise<void>)(...args);
  } catch (error) {
    console.error(`[Astra Hooks] Error in ${hookName}:`, error);
  }
}
