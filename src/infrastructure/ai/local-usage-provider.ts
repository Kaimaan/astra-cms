/**
 * Local AI Usage Provider
 *
 * Implements AIUsageProvider using local JSON files.
 * Stores usage records in content/usage/YYYY-MM.json (monthly files).
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { AIUsageProvider } from '@/core/ai/usage-provider';
import type { AIUsageRecord, AIUsageSummary } from '@/core/ai/types';

const USAGE_DIR = path.join(process.cwd(), 'content', 'usage');

function getMonthFileName(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}.json`;
}

async function ensureUsageDir(): Promise<void> {
  try {
    await fs.mkdir(USAGE_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function readMonthFile(fileName: string): Promise<AIUsageRecord[]> {
  const filePath = path.join(USAGE_DIR, fileName);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeMonthFile(fileName: string, records: AIUsageRecord[]): Promise<void> {
  await ensureUsageDir();
  const filePath = path.join(USAGE_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
}

function calculateSummary(records: AIUsageRecord[]): AIUsageSummary {
  const summary: AIUsageSummary = {
    totalTokens: 0,
    totalCostUSD: 0,
    byProvider: {},
    byOperation: {},
    recordCount: records.length,
  };

  for (const record of records) {
    summary.totalTokens += record.totalTokens;
    summary.totalCostUSD += record.costUSD;

    // By provider
    if (!summary.byProvider[record.provider]) {
      summary.byProvider[record.provider] = { tokens: 0, cost: 0 };
    }
    summary.byProvider[record.provider].tokens += record.totalTokens;
    summary.byProvider[record.provider].cost += record.costUSD;

    // By operation
    if (!summary.byOperation[record.operation]) {
      summary.byOperation[record.operation] = { tokens: 0, cost: 0 };
    }
    summary.byOperation[record.operation].tokens += record.totalTokens;
    summary.byOperation[record.operation].cost += record.costUSD;
  }

  return summary;
}

export class LocalUsageProvider implements AIUsageProvider {
  async logUsage(record: AIUsageRecord): Promise<void> {
    const date = new Date(record.timestamp);
    const fileName = getMonthFileName(date);
    const records = await readMonthFile(fileName);
    records.push(record);
    await writeMonthFile(fileName, records);
  }

  async getUsage(startDate?: Date, endDate?: Date): Promise<AIUsageRecord[]> {
    const start = startDate || new Date(0);
    const end = endDate || new Date();

    // Get list of month files to read
    const monthFiles = await this.getMonthFilesInRange(start, end);

    const allRecords: AIUsageRecord[] = [];
    for (const fileName of monthFiles) {
      const records = await readMonthFile(fileName);
      allRecords.push(...records);
    }

    // Filter by date range
    return allRecords.filter((record) => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= start && recordDate <= end;
    });
  }

  async getUsageSummary(startDate?: Date, endDate?: Date): Promise<AIUsageSummary> {
    const records = await this.getUsage(startDate, endDate);
    return calculateSummary(records);
  }

  private async getMonthFilesInRange(start: Date, end: Date): Promise<string[]> {
    const files: string[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      files.push(getMonthFileName(current));
      current.setMonth(current.getMonth() + 1);
    }

    return files;
  }
}

export const localUsageProvider = new LocalUsageProvider();
