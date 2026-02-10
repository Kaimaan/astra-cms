import { NextResponse } from 'next/server';
import { z, type ZodSchema } from 'zod';

export interface ValidationDetail {
  field: string;
  message: string;
}

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; response: NextResponse };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function formatZodErrors(error: z.ZodError): ValidationDetail[] {
  return error.errors.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns { success: true, data } or { success: false, response } with a 400 error.
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ValidationResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(result.error),
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

/** Reusable ID param validator — replaces duplicated isValidId() across routes */
export const idParam = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format');

/**
 * Validate a route param ID. Returns a 400 NextResponse on failure, or null on success.
 */
export function validateId(id: string): NextResponse | null {
  const result = idParam.safeParse(id);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }
  return null;
}
