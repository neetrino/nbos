import { describe, expect, it } from 'vitest';
import {
  buildSubscriptionsScopeStatsCsvContent,
  type SubscriptionsScopeStatsCsvMeta,
} from '@/features/finance/utils/export-subscriptions-scope-stats-csv';
import type { SubscriptionStats } from '@/lib/api/subscriptions';

const META: SubscriptionsScopeStatsCsvMeta = {
  period: 'month',
  statsQuery: { dateFrom: '2026-04-01', dateTo: '2026-04-28', partnerId: 'par-1' },
  exportedAtIso: '2026-04-29T09:00:00.000Z',
};

const SAMPLE_STATS: SubscriptionStats = {
  total: 12,
  byStatus: [{ status: 'ACTIVE', _count: 8, _sum: { baseMonthlyAmount: 400 } }],
  byType: [{ type: 'MAINTENANCE_ONLY', _count: 5, _sum: { baseMonthlyAmount: 200 } }],
  activeSubscriptions: 8,
  monthlyRevenue: 350.25,
};

describe('buildSubscriptionsScopeStatsCsvContent', () => {
  it('includes meta totals by_status and by_type', () => {
    const csv = buildSubscriptionsScopeStatsCsvContent(SAMPLE_STATS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines).toContain('meta,period,month,,,');
    expect(lines).toContain('meta,stats_partnerId,par-1,,,');
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('totals,total,12,,,');
    expect(lines).toContain('totals,monthlyRevenue,350.25,,,');
    expect(lines).toContain('by_status,ACTIVE,8,400,,');
    expect(lines).toContain('by_type,MAINTENANCE_ONLY,5,200,,');
  });
});
