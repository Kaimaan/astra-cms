import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, isAIEnabled } from '@/core/ai/provider';
import { getUsageProvider } from '@/core/ai/usage-provider';
import { calculateCost } from '@/core/ai/pricing';
import { GEMINI_MODEL, ANTHROPIC_MODEL } from '@/infrastructure/ai';
import { validateBody } from '@/lib/validation/validate';
import { aiActionSchema } from '@/lib/validation/schemas/ai-schemas';
import { withAuth } from '@/core/auth/middleware';
import type {
  AIGenerateRequest,
  AIImproveRequest,
  AISuggestRequest,
  AIOperation,
  AIUsageRecord,
} from '@/core/ai/types';

function getModelForProvider(providerName: string): string {
  if (providerName === 'gemini') return GEMINI_MODEL;
  if (providerName === 'anthropic') return ANTHROPIC_MODEL;
  return 'unknown';
}

async function logUsage(
  provider: string,
  operation: AIOperation,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const usageProvider = getUsageProvider();
  if (!usageProvider) return;

  const model = getModelForProvider(provider);
  const costUSD = calculateCost(provider, model, inputTokens, outputTokens);

  const record: AIUsageRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    provider,
    model,
    operation,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUSD,
  };

  try {
    await usageProvider.logUsage(record);
  } catch (error) {
    console.error('Failed to log usage:', error);
  }
}

// POST /api/admin/ai - AI operations
export const POST = withAuth('pages:update', async (request, _auth) => {
  try {
    if (!isAIEnabled()) {
      return NextResponse.json(
        {
          error: 'AI not configured',
          message:
            'Add GEMINI_API_KEY to your .env.local file to enable AI features.',
        },
        { status: 503 }
      );
    }

    const validation = await validateBody(request, aiActionSchema);
    if (!validation.success) return validation.response;
    const { action, ...params } = validation.data;

    const provider = getAIProvider()!;

    switch (action) {
      case 'generate': {
        const result = await provider.generate(params as AIGenerateRequest);
        if (result.usage) {
          await logUsage(
            provider.name,
            'generate',
            result.usage.promptTokens,
            result.usage.completionTokens
          );
        }
        return NextResponse.json(result);
      }

      case 'improve': {
        const result = await provider.improve(params as AIImproveRequest);
        return NextResponse.json(result);
      }

      case 'suggest': {
        const result = await provider.suggest(params as AISuggestRequest);
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'AI operation failed', message: String(error) },
      { status: 500 }
    );
  }
});

// GET /api/admin/ai - Check AI status
export const GET = withAuth('pages:read', async (_request, _auth) => {
  const enabled = isAIEnabled();
  return NextResponse.json({
    configured: enabled,
    provider: enabled ? getAIProvider()?.name : null,
  });
});
