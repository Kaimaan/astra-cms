/**
 * Anthropic (Claude) AI Provider
 *
 * Implements AIProvider using Anthropic's Claude API.
 *
 * Setup:
 * 1. Get API key from https://console.anthropic.com
 * 2. Add to .env.local: ANTHROPIC_API_KEY=sk-ant-...
 */

import type {
  AIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
  AIImproveRequest,
  AIImproveResponse,
  AISuggestRequest,
  AISuggestResponse,
  BrandVoice,
} from '@/core/ai/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_MODEL = 'claude-3-haiku-20240307'; // Fast and cheap, good for content tasks

function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

function buildBrandVoicePrompt(brandVoice?: BrandVoice): string {
  if (!brandVoice) return '';

  const parts: string[] = ['Apply the following brand voice:'];

  if (brandVoice.name) parts.push(`- Brand: ${brandVoice.name}`);
  if (brandVoice.tone) parts.push(`- Tone: ${brandVoice.tone}`);
  if (brandVoice.audience) parts.push(`- Target audience: ${brandVoice.audience}`);
  if (brandVoice.values?.length) parts.push(`- Brand values: ${brandVoice.values.join(', ')}`);
  if (brandVoice.preferredTerms?.length) parts.push(`- Use these terms: ${brandVoice.preferredTerms.join(', ')}`);
  if (brandVoice.avoidTerms?.length) parts.push(`- Avoid these terms: ${brandVoice.avoidTerms.join(', ')}`);
  if (brandVoice.additionalContext) parts.push(`- Additional context: ${brandVoice.additionalContext}`);

  return parts.join('\n');
}

async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<{ content: string; usage?: { input_tokens: number; output_tokens: number } }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    usage: data.usage,
  };
}

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';

  isConfigured(): boolean {
    return Boolean(getApiKey());
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const brandVoicePrompt = buildBrandVoicePrompt(request.brandVoice);

    const typeInstructions: Record<string, string> = {
      title: 'Generate a compelling title/headline.',
      description: 'Generate a concise description or summary.',
      content: 'Generate engaging content.',
      seo: 'Generate SEO-optimized content with relevant keywords.',
      custom: '',
    };

    const systemPrompt = `You are a professional content writer for a CMS.
${brandVoicePrompt}
${typeInstructions[request.type] || ''}
${request.maxLength ? `Keep the response under ${request.maxLength} characters.` : ''}
Respond only with the generated content, no explanations.`;

    const variations = request.variations || 1;
    const results: string[] = [];

    // Generate multiple variations if requested
    for (let i = 0; i < variations; i++) {
      const userPrompt = request.context
        ? `Context:\n${request.context}\n\nInstruction: ${request.prompt}`
        : request.prompt;

      const response = await callAnthropic(systemPrompt, userPrompt);
      results.push(response.content.trim());
    }

    return { results };
  }

  async improve(request: AIImproveRequest): Promise<AIImproveResponse> {
    const brandVoicePrompt = buildBrandVoicePrompt(request.brandVoice);

    const typeInstructions: Record<string, string> = {
      grammar: 'Fix any grammar, spelling, and punctuation errors.',
      clarity: 'Improve clarity and readability while preserving meaning.',
      tone: 'Adjust the tone to be more professional and engaging.',
      seo: 'Optimize for SEO while maintaining readability.',
      shorten: 'Make the content more concise without losing key information.',
      expand: 'Expand the content with more detail and examples.',
    };

    const systemPrompt = `You are a professional editor.
${brandVoicePrompt}
${typeInstructions[request.type]}
${request.instructions || ''}
Return only the improved content, no explanations.`;

    const response = await callAnthropic(systemPrompt, request.content);

    return { result: response.content.trim() };
  }

  async suggest(request: AISuggestRequest): Promise<AISuggestResponse> {
    const count = request.count || 5;

    const typeInstructions: Record<string, string> = {
      titles: `Suggest ${count} compelling alternative titles.`,
      keywords: `Suggest ${count} relevant SEO keywords.`,
      improvements: `Suggest ${count} ways to improve this content.`,
      cta: `Suggest ${count} call-to-action phrases.`,
    };

    const systemPrompt = `You are a content strategist.
${typeInstructions[request.type]}
Return each suggestion on a new line, numbered (1., 2., etc.).
No explanations, just the suggestions.`;

    const response = await callAnthropic(systemPrompt, request.content);

    // Parse numbered list
    const suggestions = response.content
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0);

    return { suggestions };
  }
}

export const anthropicProvider = new AnthropicProvider();
