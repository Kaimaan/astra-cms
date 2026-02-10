/**
 * Config Provider Interface
 *
 * Defines the interface for dynamic configuration loading.
 * Follows the same registry pattern as ContentProvider, AuthProvider, AIProvider.
 *
 * When no provider is registered, getConfig() falls back to the static astra.config.ts import.
 * This enables multi-tenant overlays (e.g., Gaasly) to load per-site config from Firestore
 * while keeping zero-config behavior for standard deployments.
 *
 * TO IMPLEMENT A CUSTOM PROVIDER:
 * 1. Create an object that implements ConfigProvider
 * 2. Register it with setConfigProvider() before any config access
 * 3. See /src/core/config/index.ts for the getConfig() fallback logic
 */

import type { AstraConfig } from './types';

// =============================================================================
// CONFIG PROVIDER INTERFACE
// =============================================================================

export interface ConfigProvider {
  /**
   * Get the active configuration.
   * In a multi-tenant setup, this loads config per-site (e.g., from Firestore).
   * The provider implementation may cache the result.
   */
  getConfig(): Promise<AstraConfig>;
}

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

let currentProvider: ConfigProvider | null = null;

/**
 * Set the active config provider
 */
export function setConfigProvider(provider: ConfigProvider): void {
  currentProvider = provider;
}

/**
 * Get the active config provider
 * Returns null if no provider is configured (falls back to static config)
 */
export function getConfigProvider(): ConfigProvider | null {
  return currentProvider;
}
