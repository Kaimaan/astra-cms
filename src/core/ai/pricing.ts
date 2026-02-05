/**
 * AI Pricing Data and Calculations
 *
 * Pricing per 1M tokens for various AI providers and models.
 * Used for cost estimation and usage tracking.
 */

export interface ModelPricing {
  input: number; // USD per 1M input tokens
  output: number; // USD per 1M output tokens
}

export interface ProviderPricing {
  [model: string]: ModelPricing;
}

// Pricing data (as of early 2024)
export const AI_PRICING: Record<string, ProviderPricing> = {
  gemini: {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  },
  anthropic: {
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  },
};

// Default models used by each provider
export const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-1.5-flash',
  anthropic: 'claude-3-haiku-20240307',
};

/**
 * Calculate cost in USD for a given number of tokens
 */
export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const providerPricing = AI_PRICING[provider];
  if (!providerPricing) {
    return 0;
  }

  const modelPricing = providerPricing[model];
  if (!modelPricing) {
    // Try default model for provider
    const defaultModel = DEFAULT_MODELS[provider];
    if (defaultModel && providerPricing[defaultModel]) {
      const defaultPricing = providerPricing[defaultModel];
      return (
        (inputTokens / 1_000_000) * defaultPricing.input +
        (outputTokens / 1_000_000) * defaultPricing.output
      );
    }
    return 0;
  }

  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}

/**
 * Format cost as a human-readable string
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) {
    // Show in fractions of a cent
    const cents = usd * 100;
    if (cents < 0.001) {
      return '< $0.00001';
    }
    return `$${usd.toFixed(5)}`;
  }
  if (usd < 1) {
    return `$${usd.toFixed(4)}`;
  }
  return `$${usd.toFixed(2)}`;
}

/**
 * Estimate token count from text using simple chars/4 approximation
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Get pricing for a specific provider/model
 */
export function getPricing(provider: string, model?: string): ModelPricing | null {
  const providerPricing = AI_PRICING[provider];
  if (!providerPricing) return null;

  const targetModel = model || DEFAULT_MODELS[provider];
  return providerPricing[targetModel] || null;
}
