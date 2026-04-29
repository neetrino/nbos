import { describe, expect, it } from 'vitest';
import {
  buildPaymentsScopeStatsCsvContent,
  type PaymentsScopeStatsCsvMeta,
} from '@/features/finance/utils/export-payments-scope-stats-csv';
import type { PaymentStats } from '@/lib/api/finance';

const META: PaymentsScopeStatsCsvMeta = {
  period: 'quarter',
  dateFrom: '2026-01-01',
  dateTo: '2026-03-31',
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const SAMPLE_STATS: PaymentStats = {
  totalPayments: 42,
  totalCollected: 12500.75,
  thisMonthCollected: 800,
};

describe('buildPaymentsScopeStatsCsvContent', () => {
  it('includes header meta and totals', () => {
    const csv = buildPaymentsScopeStatsCsvContent(SAMPLE_STATS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines).toContain('meta,period,quarter,,,');
    expect(lines).toContain('meta,dateFrom,2026-01-01,dateTo,2026-03-31,');
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('totals,totalPayments,42,,,');
    expect(lines).toContain('totals,totalCollected,12500.75,,,');
    expect(lines).toContain('totals,thisMonthCollected,800,,,');
  });
});
