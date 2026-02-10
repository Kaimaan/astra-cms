import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CORS_METHODS = 'GET, POST, PATCH, DELETE, OPTIONS';
const CORS_HEADERS = 'Content-Type, Authorization';
const CORS_MAX_AGE = '86400';

function getAllowedOrigins(): string[] {
  const raw = process.env.ADMIN_CORS_ORIGIN;
  if (!raw) return [];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function matchOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return null;
  if (allowed.includes('*')) return '*';
  return allowed.includes(origin) ? origin : null;
}

function setCorsHeaders(
  response: NextResponse,
  allowedOrigin: string,
): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', CORS_METHODS);
  response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS);
  response.headers.set('Access-Control-Max-Age', CORS_MAX_AGE);
  if (allowedOrigin !== '*') {
    response.headers.append('Vary', 'Origin');
  }
  return response;
}

/**
 * Handle CORS preflight (OPTIONS) for admin API requests.
 * Returns a 204 response for OPTIONS requests, or null for non-OPTIONS (caller proceeds).
 */
export function handleCorsPreFlight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') return null;

  const allowedOrigin = matchOrigin(request.headers.get('origin'));
  if (allowedOrigin) {
    return setCorsHeaders(new NextResponse(null, { status: 204 }), allowedOrigin);
  }
  return new NextResponse(null, { status: 204 });
}

/**
 * Add CORS headers to a response for non-preflight admin API requests.
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  const allowedOrigin = matchOrigin(request.headers.get('origin'));
  if (allowedOrigin) {
    setCorsHeaders(response, allowedOrigin);
  }
  return response;
}
