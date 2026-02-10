/**
 * Config Access
 *
 * Single async entry point for accessing AstraConfig at runtime.
 * If a ConfigProvider is registered, delegates to it.
 * Otherwise, falls back to the static astra.config.ts import.
 */

import type { AstraConfig } from './types';
import { getConfigProvider } from './provider';

// Lazy-loaded static config (only used when no provider is registered)
let staticConfig: AstraConfig | null = null;

async function loadStaticConfig(): Promise<AstraConfig> {
  if (!staticConfig) {
    const mod = await import('../../../astra.config');
    staticConfig = mod.default;
  }
  return staticConfig;
}

/**
 * Get the active AstraConfig.
 * - If a ConfigProvider is registered, uses it (async, per-request)
 * - Otherwise, falls back to the static astra.config.ts import
 */
export async function getConfig(): Promise<AstraConfig> {
  const provider = getConfigProvider();
  if (provider) {
    return provider.getConfig();
  }
  return loadStaticConfig();
}

export { setConfigProvider, getConfigProvider } from './provider';
export type { ConfigProvider } from './provider';
export type { AstraConfig } from './types';
