/**
 * Google Gemini AI Provider
 *
 * Implements AIProvider using Google's Gemini API.
 *
 * Setup:
 * 1. Get API key from https://aistudio.google.com/apikey
 * 2. Add to .env.local: GEMINI_API_KEY=...
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

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
export const GEMINI_MODEL = 'gemini-3-flash-preview'; // Fast and cost-effective

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
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

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data: GeminiResponse = await response.json();

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = data.usageMetadata
    ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      }
    : undefined;

  return { content, usage };
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';

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
    let totalUsage: AIGenerateResponse['usage'] | undefined;

    for (let i = 0; i < variations; i++) {
      const userPrompt = request.context
        ? `Context:\n${request.context}\n\nInstruction: ${request.prompt}`
        : request.prompt;

      const response = await callGemini(systemPrompt, userPrompt);
      results.push(response.content.trim());

      if (response.usage) {
        if (!totalUsage) {
          totalUsage = { ...response.usage };
        } else {
          totalUsage.promptTokens += response.usage.promptTokens;
          totalUsage.completionTokens += response.usage.completionTokens;
          totalUsage.totalTokens += response.usage.totalTokens;
        }
      }
    }

    return { results, usage: totalUsage };
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

    const response = await callGemini(systemPrompt, request.content);

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

    const response = await callGemini(systemPrompt, request.content);

    const suggestions = response.content
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0);

    return { suggestions };
  }
}

export const geminiProvider = new GeminiProvider();
