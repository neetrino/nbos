import { describe, expect, it } from 'vitest';
import {
  buildCrmDashboardScopeStatsCsvContent,
  type CrmDashboardScopeStatsCsvMeta,
} from '@/features/crm/utils/export-crm-dashboard-scope-stats-csv';
import type { LeadStats } from '@/lib/api/leads';
import type { DealStats } from '@/lib/api/deals';

const META: CrmDashboardScopeStatsCsvMeta = {
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const LEADS: LeadStats = {
  total: 10,
  byStatus: [
    { status: 'NEW', _count: 4 },
    { status: 'SQL', _count: 2 },
  ],
  bySource: [
    { source: 'WEB', _count: 6 },
    { source: 'REFERRAL', _count: 4 },
  ],
};

const DEALS: DealStats = {
  total: 5,
  byStatus: [
    { status: 'WON', _count: 1, _sum: { amount: 50_000 } },
    { status: 'NEGOTIATION', _count: 2, _sum: { amount: 49_000 } },
  ],
  byType: [{ type: 'PRODUCT', _count: 3, _sum: { amount: 99_000 } }],
};

describe('buildCrmDashboardScopeStatsCsvContent', () => {
  it('includes meta lead and deal sections', () => {
    const csv = buildCrmDashboardScopeStatsCsvContent(LEADS, DEALS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('leads_totals,total,10,,,');
    expect(lines).toContain('leads_by_status,NEW,4,,,');
    expect(lines).toContain('leads_by_source,WEB,6,,,');
    expect(lines).toContain('deals_totals,total,5,,,');
    expect(lines).toContain('deals_totals,sumAmountByStatus,99000,,,');
    expect(lines).toContain('deals_by_status,WON,1,50000,,');
    expect(lines).toContain('deals_by_type,PRODUCT,3,99000,,');
  });
});
