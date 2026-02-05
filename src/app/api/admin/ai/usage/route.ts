import { NextRequest, NextResponse } from 'next/server';
import { getUsageProvider } from '@/core/ai/usage-provider';

// GET /api/admin/ai/usage - Get usage data
export async function GET(request: NextRequest) {
  try {
    const usageProvider = getUsageProvider();
    if (!usageProvider) {
      return NextResponse.json(
        { error: 'Usage tracking not configured' },
        { status: 503 }
      );
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
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data', message: String(error) },
      { status: 500 }
    );
  }
}
