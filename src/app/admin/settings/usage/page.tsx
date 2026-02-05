'use client';

import { useState, useEffect } from 'react';
import { formatCost, estimateTokens, getPricing } from '@/core/ai/pricing';
import type { AIUsageRecord, AIUsageSummary } from '@/core/ai/types';

interface UsageData {
  records: AIUsageRecord[];
  summary: AIUsageSummary;
}

function UsageSummaryCard({ summary }: { summary: AIUsageSummary }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Total Tokens</p>
          <p className="text-2xl font-bold text-gray-900">
            {summary.totalTokens.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Estimated Cost</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCost(summary.totalCostUSD)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">API Calls</p>
          <p className="text-2xl font-bold text-gray-900">
            {summary.recordCount}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Avg Tokens/Call</p>
          <p className="text-2xl font-bold text-gray-900">
            {summary.recordCount > 0
              ? Math.round(summary.totalTokens / summary.recordCount).toLocaleString()
              : 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, { tokens: number; cost: number }>;
}) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-gray-700 capitalize">{key}</span>
            <div className="text-right">
              <span className="text-gray-900 font-medium">
                {value.tokens.toLocaleString()} tokens
              </span>
              <span className="text-gray-500 text-sm ml-2">
                ({formatCost(value.cost)})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenCalculator() {
  const [text, setText] = useState('');
  const [provider, setProvider] = useState('gemini');

  const tokens = estimateTokens(text);
  const pricing = getPricing(provider);
  const inputCost = pricing ? (tokens / 1_000_000) * pricing.input : 0;
  const outputCost = pricing ? (tokens / 1_000_000) * pricing.output : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Token Calculator
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="gemini">Gemini (gemini-1.5-flash)</option>
            <option value="anthropic">Anthropic (claude-3-haiku)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text to estimate
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here to estimate token count..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-32 resize-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <p className="text-sm text-gray-500">Estimated Tokens</p>
            <p className="text-xl font-bold text-gray-900">
              {tokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">As Input</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCost(inputCost)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">As Output</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCost(outputCost)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Token count is estimated using chars/4 approximation
        </p>
      </div>
    </div>
  );
}

function CostCalculator() {
  const [operations, setOperations] = useState(100);
  const [avgTokens, setAvgTokens] = useState(500);
  const [provider, setProvider] = useState('gemini');

  const pricing = getPricing(provider);
  const totalInputTokens = operations * avgTokens;
  const totalOutputTokens = operations * avgTokens; // Assume similar output size
  const totalCost = pricing
    ? (totalInputTokens / 1_000_000) * pricing.input +
      (totalOutputTokens / 1_000_000) * pricing.output
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Cost Calculator
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="gemini">Gemini (gemini-1.5-flash)</option>
            <option value="anthropic">Anthropic (claude-3-haiku)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected monthly operations
          </label>
          <input
            type="number"
            value={operations}
            onChange={(e) => setOperations(parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Average tokens per operation
          </label>
          <input
            type="number"
            value={avgTokens}
            onChange={(e) => setAvgTokens(parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-500">Estimated Monthly Cost</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCost(totalCost)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Based on {(totalInputTokens + totalOutputTokens).toLocaleString()}{' '}
            total tokens
          </p>
        </div>
      </div>
    </div>
  );
}

function RecentUsageTable({ records }: { records: AIUsageRecord[] }) {
  const recentRecords = records.slice(-20).reverse();

  if (recentRecords.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Usage
        </h2>
        <p className="text-gray-500 text-sm">
          No usage recorded yet. Use AI features to see usage data here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Usage</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">Time</th>
              <th className="text-left py-2 text-gray-500 font-medium">
                Operation
              </th>
              <th className="text-left py-2 text-gray-500 font-medium">
                Provider
              </th>
              <th className="text-right py-2 text-gray-500 font-medium">
                Tokens
              </th>
              <th className="text-right py-2 text-gray-500 font-medium">
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {recentRecords.map((record) => (
              <tr key={record.id} className="border-b border-gray-100">
                <td className="py-2 text-gray-600">
                  {new Date(record.timestamp).toLocaleString()}
                </td>
                <td className="py-2 text-gray-900 capitalize">
                  {record.operation}
                </td>
                <td className="py-2 text-gray-600">{record.provider}</td>
                <td className="py-2 text-gray-900 text-right">
                  {record.totalTokens.toLocaleString()}
                </td>
                <td className="py-2 text-gray-900 text-right">
                  {formatCost(record.costUSD)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        // Get current month's data
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const res = await fetch(
          `/api/admin/ai/usage?startDate=${startOfMonth.toISOString()}`
        );
        if (!res.ok) throw new Error('Failed to fetch usage data');

        const data = await res.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Usage & Costs</h1>
        <p className="text-gray-600 mt-1">
          Track AI usage and estimate costs for your CMS
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading usage data...</p>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.summary && <UsageSummaryCard summary={data.summary} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BreakdownCard
              title="By Provider"
              data={data?.summary.byProvider || {}}
            />
            <BreakdownCard
              title="By Operation"
              data={data?.summary.byOperation || {}}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TokenCalculator />
            <CostCalculator />
          </div>

          {data?.records && <RecentUsageTable records={data.records} />}
        </div>
      )}
    </div>
  );
}
