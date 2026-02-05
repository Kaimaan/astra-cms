/**
 * AI Infrastructure
 *
 * Wires up AI providers and usage tracking.
 * Supports Gemini (default) and Anthropic (fallback).
 *
 * TO ADD A NEW AI PROVIDER:
 * 1. Create a class implementing AIProvider in /src/infrastructure/ai/
 * 2. Import and register it below
 * 3. Add environment variable documentation
 */

import { setAIProvider, getAIProvider } from '@/core/ai/provider';
import { setUsageProvider, getUsageProvider } from '@/core/ai/usage-provider';
import { geminiProvider, GEMINI_MODEL } from './gemini';
import { anthropicProvider, ANTHROPIC_MODEL } from './anthropic';
import { localUsageProvider } from './local-usage-provider';

// Register AI provider: Gemini is default, Anthropic is fallback
if (geminiProvider.isConfigured()) {
  setAIProvider(geminiProvider);
} else if (anthropicProvider.isConfigured()) {
  setAIProvider(anthropicProvider);
}

// Register usage provider for tracking
setUsageProvider(localUsageProvider);

// Re-export for convenience
export { getAIProvider, getUsageProvider, geminiProvider, anthropicProvider, GEMINI_MODEL, ANTHROPIC_MODEL };
export type { AIProvider } from '@/core/ai/types';
