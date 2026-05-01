import { describe, expect, it } from 'vitest';
import {
  buildExpensesScopeStatsCsvContent,
  type ExpensesScopeStatsCsvMeta,
} from '@/features/finance/utils/export-expenses-scope-stats-csv';
import type { ExpenseStats } from '@/lib/api/finance';

const META: ExpensesScopeStatsCsvMeta = {
  period: 'month',
  statsQuery: {
    dateFrom: '2026-04-01',
    dateTo: '2026-04-30',
    projectId: 'proj-uuid-1',
    activeBoard: true,
  },
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const SAMPLE_STATS: ExpenseStats = {
  totalAmount: 5000,
  paidAmount: 2000,
  unpaidAmount: 3000,
  byCategory: [
    { category: 'OFFICE', _count: 2, _sum: { amount: 1200 } },
    { category: 'TRAVEL', _count: 1, _sum: { amount: null } },
  ],
  byStatus: [
    { status: 'PENDING', _count: 3, _sum: { amount: 800 } },
    { status: 'PAID', _count: 1, _sum: { amount: 400 } },
  ],
};

describe('buildExpensesScopeStatsCsvContent', () => {
  it('includes header meta totals by_category and by_status', () => {
    const csv = buildExpensesScopeStatsCsvContent(SAMPLE_STATS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines).toContain('meta,period,month,,,');
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('meta,stats_dateFrom,2026-04-01,,,');
    expect(lines).toContain('meta,stats_projectId,proj-uuid-1,,,');
    expect(lines).toContain('meta,stats_activeBoard,true,,,');
    expect(lines).toContain('totals,totalAmount,5000,,,');
    expect(lines).toContain('totals,paidAmount,2000,,,');
    expect(lines).toContain('totals,unpaidAmount,3000,,,');
    expect(lines).toContain('by_category,OFFICE,2,1200,,');
    expect(lines).toContain('by_category,TRAVEL,1,,,');
    expect(lines).toContain('by_status,PENDING,3,800,,');
    expect(lines).toContain('by_status,PAID,1,400,,');
  });
});
