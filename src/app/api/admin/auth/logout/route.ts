import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/core/auth/storage';
import { SESSION_COOKIE, buildClearCookieHeader } from '@/core/auth/session';

// POST /api/admin/auth/logout - Destroy session
export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await deleteSession(sessionId).catch(() => {});
  }

  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', buildClearCookieHeader());
  return response;
}
