import { NextRequest, NextResponse } from 'next/server';
import { getUsageProvider } from '@/core/ai/usage-provider';
import { withAuth } from '@/core/auth/middleware';
import { apiError, ErrorCode } from '@/lib/api-errors';

// GET /api/admin/ai/usage - Get usage data
export const GET = withAuth('site:read', async (request, _auth) => {
  try {
    const usageProvider = getUsageProvider();
    if (!usageProvider) {
      return apiError('Usage tracking not configured', ErrorCode.SERVICE_UNAVAILABLE, 503);
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const summaryOnly = searchParams.get('summary') === 'true';

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    if (summaryOnly) {
      const summary = await usageProvider.getUsageSummary(startDate, endDate);
      return NextResponse.json({ summary });
    }

    const records = await usageProvider.getUsage(startDate, endDate);
    const summary = await usageProvider.getUsageSummary(startDate, endDate);

    return NextResponse.json({ records, summary });
  } catch (error) {
    return apiError('Failed to fetch usage data', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
