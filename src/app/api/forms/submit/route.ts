/**
 * Public Form Submission Endpoint
 *
 * POST /api/forms/submit
 *
 * Receives form submissions from the frontend form block,
 * triggers the onFormSubmitted lifecycle hook (which can deliver
 * webhooks to external services like Astra CRM), and returns
 * a success response.
 *
 * This route is NOT behind admin auth — it's public-facing.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';
import { apiError, ErrorCode } from '@/lib/api-errors';
import { triggerHook } from '@/core/hooks';
import { generateId } from '@/core/content/types';
import type { FormSubmissionRecord } from '@/core/content/types';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const formSubmitSchema = z.object({
  formId: z.string().min(1, 'formId is required'),
  formName: z.string().optional(),
  pageId: z.string().min(1, 'pageId is required'),
  contact: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
  }),
  fields: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  consentGiven: z.boolean().optional(),
});

// =============================================================================
// SIMPLE RATE LIMITING
// =============================================================================

const submissions = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max submissions per IP per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = submissions.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  submissions.set(ip, recent);
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of submissions) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      submissions.delete(ip);
    } else {
      submissions.set(ip, recent);
    }
  }
}, RATE_LIMIT_WINDOW);

// =============================================================================
// POST /api/forms/submit
// =============================================================================

export async function POST(request: Request) {
  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return apiError('Too many submissions, please try again later', ErrorCode.VALIDATION_ERROR, 429);
  }

  // Validate body
  const validation = await validateBody(request, formSubmitSchema);
  if (!validation.success) {
    return validation.response;
  }

  const { formId, formName, pageId, contact, fields, consentGiven } = validation.data;

  // Build submission record
  const submission: FormSubmissionRecord = {
    id: generateId('sub'),
    formId,
    formName,
    pageId,
    contact,
    fields,
    consentGiven,
    createdAt: new Date(),
  };

  // Trigger lifecycle hook (webhook delivery happens here)
  await triggerHook('onFormSubmitted', submission);

  return NextResponse.json(
    { success: true, submissionId: submission.id },
    { status: 200 }
  );
}
