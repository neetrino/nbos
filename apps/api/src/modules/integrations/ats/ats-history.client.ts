import { Injectable, Logger } from '@nestjs/common';
import {
  ATS_HISTORY_ENDPOINT,
  ATS_HISTORY_PAGE_ROWS,
  ATS_HISTORY_TIMEOUT_MS,
  ATS_YEREVAN_OFFSET_MS,
} from './ats.constants';
import { parseAtsHistoryResponse, type AtsHistoryCallRow } from './ats-history.parse';
import { AtsProviderConfig } from './ats-provider.config';

@Injectable()
export class AtsHistoryClient {
  private readonly logger = new Logger(AtsHistoryClient.name);

  constructor(private readonly config: AtsProviderConfig) {}

  async listCallsForDateRange(from: Date, to: Date): Promise<AtsHistoryCallRow[]> {
    if (!this.config.isConfigured()) return [];
    const first = await this.fetchHistoryPage(from, to, 0);
    const tailStart = nextHistoryPageStart(first.numFound, ATS_HISTORY_PAGE_ROWS);
    if (tailStart == null) return first.rows;
    const tail = await this.fetchHistoryPage(from, to, tailStart);
    return mergeHistoryRows(first.rows, tail.rows);
  }

  private async fetchHistoryPage(
    from: Date,
    to: Date,
    start: number,
  ): Promise<{ numFound: number; rows: AtsHistoryCallRow[] }> {
    const url = this.buildHistoryUrl(from, to, start);
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(ATS_HISTORY_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn({ event: 'ats_history_http_error', status: response.status });
        return { numFound: 0, rows: [] };
      }
      const body: unknown = await response.json().catch(() => null);
      return parseAtsHistoryResponse(body);
    } catch (error) {
      this.logger.warn({ event: 'ats_history_network_error', error: String(error) });
      return { numFound: 0, rows: [] };
    }
  }

  private buildHistoryUrl(from: Date, to: Date, start: number): string {
    const url = new URL(ATS_HISTORY_ENDPOINT);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('dateStart', toAtsHistoryYmd(from));
    url.searchParams.set('dateEnd', toAtsHistoryYmd(to));
    url.searchParams.set('rows', String(ATS_HISTORY_PAGE_ROWS));
    url.searchParams.set('start', String(start));
    return url.toString();
  }
}

export function toAtsHistoryYmd(date: Date): string {
  return new Date(date.getTime() + ATS_YEREVAN_OFFSET_MS).toISOString().slice(0, 10);
}

export function nextHistoryPageStart(numFound: number, pageRows: number): number | null {
  if (numFound <= pageRows) return null;
  return Math.max(0, numFound - pageRows);
}

function mergeHistoryRows(
  first: AtsHistoryCallRow[],
  tail: AtsHistoryCallRow[],
): AtsHistoryCallRow[] {
  const seen = new Set(first.map((row) => row.uid));
  return [...first, ...tail.filter((row) => !seen.has(row.uid))];
}
