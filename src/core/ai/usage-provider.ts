/**
 * AI Usage Provider Interface
 *
 * Abstract interface for tracking AI usage and costs.
 * Allows swapping storage backends (local files, database, etc.)
 */

import type { AIUsageRecord, AIUsageSummary } from './types';

export interface AIUsageProvider {
  /**
   * Log a usage record
   */
  logUsage(record: AIUsageRecord): Promise<void>;

  /**
   * Get usage records within a date range
   */
  getUsage(startDate?: Date, endDate?: Date): Promise<AIUsageRecord[]>;

  /**
   * Get aggregated usage summary within a date range
   */
  getUsageSummary(startDate?: Date, endDate?: Date): Promise<AIUsageSummary>;
}

// =============================================================================
// GLOBAL PROVIDER REGISTRY
// =============================================================================

let usageProvider: AIUsageProvider | null = null;

export function setUsageProvider(provider: AIUsageProvider): void {
  usageProvider = provider;
}

export function getUsageProvider(): AIUsageProvider | null {
  return usageProvider;
}

export function isUsageTrackingEnabled(): boolean {
  return usageProvider !== null;
}
