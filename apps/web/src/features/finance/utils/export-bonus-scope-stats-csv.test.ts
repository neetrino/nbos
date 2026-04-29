import { describe, expect, it } from 'vitest';
import {
  buildBonusScopeStatsCsvContent,
  type BonusScopeStatsCsvMeta,
} from '@/features/finance/utils/export-bonus-scope-stats-csv';
import type { BonusStats } from '@/lib/api/bonus';

const META: BonusScopeStatsCsvMeta = {
  exportedAtIso: '2026-04-29T12:00:00.000Z',
};

const SAMPLE_STATS: BonusStats = {
  totalAmount: '12500.50',
  byStatus: [
    { status: 'PAID', _count: 3, _sum: { amount: '9000' } },
    { status: 'ACTIVE', _count: 2, _sum: { amount: null } },
  ],
};

describe('buildBonusScopeStatsCsvContent', () => {
  it('includes header meta scope_note totals and by_status', () => {
    const csv = buildBonusScopeStatsCsvContent(SAMPLE_STATS, META);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('section,col1,col2,col3,col4,col5');
    expect(lines.some((l) => l.startsWith('meta,exportedAt,'))).toBe(true);
    expect(lines.some((l) => l.startsWith('meta,scope_note,'))).toBe(true);
    expect(lines).toContain('totals,totalAmount,12500.50,,,');
    expect(lines).toContain('by_status,PAID,3,9000,,');
    expect(lines).toContain('by_status,ACTIVE,2,,,');
  });
});
