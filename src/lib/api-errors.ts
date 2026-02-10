import { NextResponse } from 'next/server';

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

interface ApiErrorResponse {
  error: string;
  code: ErrorCodeType;
}

/**
 * Create a standardized error response.
 * When `cause` is provided, logs it via console.error.
 */
export function apiError(
  message: string,
  code: ErrorCodeType,
  status: number = 500,
  cause?: unknown
): NextResponse<ApiErrorResponse> {
  if (cause !== undefined) {
    console.error(message, cause);
  }
  return NextResponse.json({ error: message, code }, { status });
}
