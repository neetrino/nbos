import { describe, expect, it } from 'vitest';
import {
  buildOrdersScopeStatsCsvContent,
  type OrdersScopeStatsCsvMeta,
} from '@/features/finance/utils/export-orders-scope-stats-csv';
import type { OrderStats } from '@/lib/api/finance';

const META_NO_GAP: OrdersScopeStatsCsvMeta = {
  period: 'month',
  statsQuery: { dateFrom: '2026-04-01', dateTo: '2026-04-28', partnerId: 'p-1' },
  exportedAtIso: '2026-04-29T08:00:00.000Z',
};

const META_GAP: OrdersScopeStatsCsvMeta = {
  period: 'year',
  statsQuery: {
    dateFrom: '2026-01-01',
    dateTo: '2026-12-31',
    gap: 'uninvoiced',
    status: 'ACTIVE',
    search: 'ACME',
  },
  exportedAtIso: '2026-04-29T08:00:00.000Z',
};

const SAMPLE_STATS: OrderStats = {
  totalOrders: 10,
  totalAmount: 5000,
  collectedAmount: 2000,
  outstandingAmount: 3000,
  byStatus: [{ status: 'ACTIVE', _count: 7, _sum: { totalAmount: 3500 } }],
};

describe('buildOrdersScopeStatsCsvContent', () => {
  it('includes meta without gap scope note', () => {
    const csv = buildOrdersScopeStatsCsvContent(SAMPLE_STATS, META_NO_GAP);
    expect(csv).toContain('meta,period,month,,,');
    expect(csv).toContain('meta,stats_partnerId,p-1,,,');
    expect(csv).toContain('without gap:');
    expect(csv).toContain('totals,totalOrders,10,,,');
    expect(csv).toContain('by_status,ACTIVE,7,3500,,');
  });

  it('includes gap scope note and stats params', () => {
    const csv = buildOrdersScopeStatsCsvContent(SAMPLE_STATS, META_GAP);
    expect(csv).toContain('with gap:');
    expect(csv).toContain('meta,stats_gap,uninvoiced,,,');
    expect(csv).toContain('meta,stats_status,ACTIVE,,,');
    expect(csv).toContain('meta,stats_search,ACME,,,');
  });
});
