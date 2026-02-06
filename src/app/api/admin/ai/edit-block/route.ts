import { NextRequest, NextResponse } from 'next/server';
import { getUsageProvider } from '@/core/ai/usage-provider';
import { calculateCost } from '@/core/ai/pricing';
import type { AIUsageRecord } from '@/core/ai/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-3-flash-preview';

interface EditBlockRequest {
  blockType: string;
  blockLabel: string;
  schemaDescription: string;
  currentProps: Record<string, unknown>;
  userRequest: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface EditBlockResponse {
  updatedProps: Record<string, unknown>;
  explanation: string;
  error?: string;
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

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

async function logUsage(inputTokens: number, outputTokens: number): Promise<void> {
  const usageProvider = getUsageProvider();
  if (!usageProvider) return;

  const costUSD = calculateCost('gemini', MODEL, inputTokens, outputTokens);

  const record: AIUsageRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    provider: 'gemini',
    model: MODEL,
    operation: 'edit-block',
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

async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Convert messages to Gemini format
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(`${GEMINI_API_URL}/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = data.usageMetadata
    ? {
        inputTokens: data.usageMetadata.promptTokenCount,
        outputTokens: data.usageMetadata.candidatesTokenCount,
      }
    : undefined;

  return { text, usage };
}

export async function POST(request: NextRequest): Promise<NextResponse<EditBlockResponse>> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          updatedProps: {},
          explanation: '',
          error: 'AI not configured. Add GEMINI_API_KEY to enable AI features.',
        },
        { status: 503 }
      );
    }

    const body: EditBlockRequest = await request.json();
    const {
      blockType,
      blockLabel,
      schemaDescription,
      currentProps,
      userRequest,
      conversationHistory = [],
    } = body;

    const systemPrompt = `You are an AI assistant helping users edit content blocks in a CMS.

You are editing a "${blockLabel}" block (type: ${blockType}).

The block has the following editable properties:
${schemaDescription}

Current values:
${JSON.stringify(currentProps, null, 2)}

RULES:
1. When the user asks to change something, return the COMPLETE updated props object with the changes applied
2. Only modify the properties the user mentions - keep other values unchanged
3. Respect the schema constraints (required fields, valid enum values, etc.)
4. If the user asks something impossible (like setting an invalid value), explain why and suggest alternatives
5. For creative requests (like "make it more exciting"), use your judgment to improve the content

RESPONSE FORMAT:
You must respond with a JSON object in this exact format:
{
  "updatedProps": { /* the complete updated props object */ },
  "explanation": "Brief explanation of what was changed"
}

Only output the JSON object, nothing else.`;

    // Build messages array with conversation history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory,
      { role: 'user', content: userRequest },
    ];

    const response = await callGemini(systemPrompt, messages);

    // Log usage if available
    if (response.usage) {
      await logUsage(response.usage.inputTokens, response.usage.outputTokens);
    }

    // Parse the JSON response
    let parsed: { updatedProps: Record<string, unknown>; explanation: string };
    try {
      // Handle potential markdown code blocks
      const jsonMatch = response.text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response.text];
      const jsonStr = jsonMatch[1]?.trim() || response.text.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, try to extract meaningful info
      return NextResponse.json({
        updatedProps: currentProps,
        explanation: response.text,
        error: 'Failed to parse AI response. The AI said: ' + response.text.substring(0, 200),
      });
    }

    return NextResponse.json({
      updatedProps: parsed.updatedProps,
      explanation: parsed.explanation,
    });
  } catch (error) {
    console.error('Edit block AI error:', error);
    return NextResponse.json(
      {
        updatedProps: {},
        explanation: '',
        error: error instanceof Error ? error.message : 'Failed to process edit request',
      },
      { status: 500 }
    );
  }
}
