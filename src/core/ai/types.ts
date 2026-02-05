/**
 * AI Provider Types
 *
 * Defines types for AI-assisted content generation.
 * NO Next.js imports - pure TypeScript
 */

// =============================================================================
// BRAND VOICE
// =============================================================================

export interface BrandVoice {
  /** Brand name */
  name: string;

  /** Brand tone (e.g., 'professional', 'friendly', 'casual') */
  tone: string;

  /** Target audience description */
  audience?: string;

  /** Key brand values/principles */
  values?: string[];

  /** Words/phrases to use */
  preferredTerms?: string[];

  /** Words/phrases to avoid */
  avoidTerms?: string[];

  /** Example content that represents the brand voice */
  examples?: string[];

  /** Additional context for the AI */
  additionalContext?: string;
}

// =============================================================================
// AI REQUESTS
// =============================================================================

export interface AIGenerateRequest {
  /** The prompt/instruction for generation */
  prompt: string;

  /** Type of content to generate */
  type: 'title' | 'description' | 'content' | 'seo' | 'custom';

  /** Current content for context (e.g., existing page content) */
  context?: string;

  /** Brand voice settings to apply */
  brandVoice?: BrandVoice;

  /** Maximum length of generated content */
  maxLength?: number;

  /** Number of variations to generate */
  variations?: number;
}

export interface AIImproveRequest {
  /** The content to improve */
  content: string;

  /** Type of improvement */
  type: 'grammar' | 'clarity' | 'tone' | 'seo' | 'shorten' | 'expand';

  /** Brand voice settings to apply */
  brandVoice?: BrandVoice;

  /** Additional instructions */
  instructions?: string;
}

export interface AISuggestRequest {
  /** Content to analyze */
  content: string;

  /** What to suggest */
  type: 'titles' | 'keywords' | 'improvements' | 'cta';

  /** Number of suggestions */
  count?: number;
}

// =============================================================================
// AI RESPONSES
// =============================================================================

export interface AIGenerateResponse {
  /** Generated content variations */
  results: string[];

  /** Token usage (if available) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIImproveResponse {
  /** Improved content */
  result: string;

  /** Changes made (if available) */
  changes?: string[];
}

export interface AISuggestResponse {
  /** Suggestions */
  suggestions: string[];
}

// =============================================================================
// AI PROVIDER INTERFACE
// =============================================================================

export interface AIProvider {
  /** Provider name (e.g., 'openai', 'anthropic') */
  name: string;

  /** Generate new content */
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;

  /** Improve existing content */
  improve(request: AIImproveRequest): Promise<AIImproveResponse>;

  /** Get suggestions */
  suggest(request: AISuggestRequest): Promise<AISuggestResponse>;

  /** Check if provider is configured and ready */
  isConfigured(): boolean;
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

export type AIOperation = 'generate' | 'improve' | 'suggest' | 'edit-block';

export interface AIUsageRecord {
  /** Unique identifier */
  id: string;

  /** ISO timestamp */
  timestamp: string;

  /** Provider name (e.g., 'gemini', 'anthropic') */
  provider: string;

  /** Model used (e.g., 'gemini-1.5-flash') */
  model: string;

  /** Operation type */
  operation: AIOperation;

  /** Number of input/prompt tokens */
  inputTokens: number;

  /** Number of output/completion tokens */
  outputTokens: number;

  /** Total tokens (input + output) */
  totalTokens: number;

  /** Estimated cost in USD */
  costUSD: number;
}

export interface AIUsageSummary {
  /** Total tokens across all records */
  totalTokens: number;

  /** Total estimated cost in USD */
  totalCostUSD: number;

  /** Breakdown by provider */
  byProvider: Record<string, { tokens: number; cost: number }>;

  /** Breakdown by operation type */
  byOperation: Record<string, { tokens: number; cost: number }>;

  /** Number of records in this summary */
  recordCount: number;
}
