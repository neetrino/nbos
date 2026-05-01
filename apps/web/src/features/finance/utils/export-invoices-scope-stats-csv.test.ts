import { describe, expect, it } from 'vitest';
import {
  buildInvoicesScopeStatsCsvContent,
  type InvoicesScopeStatsCsvMeta,
} from '@/features/finance/utils/export-invoices-scope-stats-csv';
import type { InvoiceStats } from '@/lib/api/finance';

const META: InvoicesScopeStatsCsvMeta = {
  period: 'month',
  dateFrom: '2026-04-01',
  dateTo: '2026-04-28',
  subscriptionId: 'sub-123',
  exportedAtIso: '2026-04-29T10:00:00.000Z',
};

const SAMPLE_STATS: InvoiceStats = {
  total: 5,
  byStatus: [
    { status: 'PAID', _count: 2, _sum: { amount: 100 } },
    { status: 'WAITING', _count: 3, _sum: { amount: 250.5 } },
  ],
  totalRevenue: 350.5,
  outstanding: { count: 1, amount: 50 },
  overdue: { count: 0, amount: null },
};

describe('buildInvoicesScopeStatsCsvContent', () => {
  it('includes header meta totals and by_status', () => {
    const csv = buildInvoicesScopeStatsCsvContent(SAMPLE_STATS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines).toContain('meta,period,month,,,');
    expect(lines).toContain('meta,dateFrom,2026-04-01,dateTo,2026-04-28,');
    expect(lines).toContain('meta,subscriptionId,sub-123,,,');
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('totals,totalInvoiceCount,5,,,');
    expect(lines).toContain('totals,totalRevenue,350.5,,,');
    expect(lines).toContain('by_status,PAID,2,100,,');
    expect(lines).toContain('by_status,WAITING,3,250.5,,');
  });
});
