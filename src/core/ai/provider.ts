/**
 * AI Provider Registry
 *
 * Manages which AI provider is active.
 * Similar to ContentProvider pattern.
 */

import type { AIProvider } from './types';

let currentProvider: AIProvider | null = null;

/**
 * Set the active AI provider
 */
export function setAIProvider(provider: AIProvider): void {
  currentProvider = provider;
}

/**
 * Get the active AI provider
 * Returns null if no provider is configured (AI features disabled)
 */
export function getAIProvider(): AIProvider | null {
  return currentProvider;
}

/**
 * Check if AI features are available
 */
export function isAIEnabled(): boolean {
  return currentProvider !== null && currentProvider.isConfigured();
}
